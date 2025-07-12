import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { Server as SocketIOServer } from 'socket.io';

interface ConnectedClient {
  ws: WebSocket;
  userId: string;
  role: string;
}

export class EventHub {
  private wss: WebSocketServer;
  private io: SocketIOServer;
  private clients: Map<string, ConnectedClient[]> = new Map();
  private socketClients: Map<string, any[]> = new Map();

  constructor(server: Server) {
    console.log('🚀 EventHub: Initializing WebSocket and Socket.IO servers');
    
    // Production environment detection
    const isRender = process.env.RENDER_SERVICE_NAME || process.env.RENDER;
    const isReplit = process.env.REPLIT_URL || process.env.REPL_SLUG;
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Dynamic CORS origins based on environment
    let corsOrigins = ["http://localhost:5000", "http://localhost:3000"];
    
    if (isRender) {
      corsOrigins = [
        "https://cargorepo-4.onrender.com", // Your Render app URL
        /.*\.onrender\.com$/, // All Render domains
        process.env.RENDER_EXTERNAL_URL
      ].filter(Boolean);
    } else if (isReplit) {
      corsOrigins = [
        /.*\.replit\.dev$/, // All Replit domains
        /.*\.replit\.co$/,
        process.env.REPLIT_URL
      ].filter(Boolean);
    } else if (!isProduction) {
      corsOrigins = "*"; // Development - allow all
    }
    
    // Create Socket.IO server optimized for production
    this.io = new SocketIOServer(server, {
      cors: {
        origin: corsOrigins,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        credentials: true,
        allowedHeaders: ["*"]
      },
      path: "/socket.io/",
      transports: isProduction ? ['polling', 'websocket'] : ['websocket', 'polling'],
      allowEIO3: true,
      pingTimeout: isProduction ? 120000 : 60000, // Longer timeout for production
      pingInterval: isProduction ? 30000 : 25000,
      maxHttpBufferSize: 1e6,
      connectTimeout: isProduction ? 60000 : 45000,
      upgradeTimeout: 30000,
      cookie: false, // Disable socket.io cookies for better compatibility
      serveClient: false // Don't serve client files in production
    });
    
    // Create main WebSocket server for notifications (original path)
    this.wss = new WebSocketServer({ 
      server,
      path: '/events',
      perMessageDeflate: false,
      maxPayload: 1024 * 1024,
      skipUTF8Validation: true,
      verifyClient: (info: any) => {
        console.log('🔍 EventHub /events: Verifying client from origin:', info.origin);
        return true; // Allow all connections for Replit compatibility
      }
    });
    
    // Create additional WebSocket server for dedicated notification service
    const notificationWss = new WebSocketServer({ 
      server,
      path: '/ws',
      perMessageDeflate: false,
      maxPayload: 1024 * 1024,
      skipUTF8Validation: true,
      handleProtocols: (protocols: Set<string>) => {
        console.log('🔍 EventHub /ws: Handling protocols:', Array.from(protocols));
        return false; // Don't require specific protocols
      },
      verifyClient: (info: any) => {
        console.log('🔍 EventHub /ws: Verifying client from origin:', info.origin);
        console.log('🔍 EventHub /ws: Request URL:', info.req.url);
        console.log('🔍 EventHub /ws: Headers:', info.req.headers);
        return true; // Allow all connections for Replit compatibility
      }
    });
    
    console.log('📡 EventHub: WebSocket servers created on /events and /ws');
    console.log('⚡ EventHub: Socket.IO server created on /socket.io/');
    this.setupSocketIO();
    this.setupWebSocketServer();
    this.setupNotificationWebSocket(notificationWss);
  }

  private setupSocketIO() {
    console.log('⚡ EventHub: Setting up Socket.IO connection handlers');
    
    this.io.on('connection', (socket) => {
      console.log('🔗 Socket.IO: NEW CONNECTION ESTABLISHED', socket.id);
      
      // Get user info from handshake query
      const userId = socket.handshake.query.userId as string;
      const role = socket.handshake.query.role as string;
      
      if (!userId || !role) {
        console.log('❌ Socket.IO: Missing userId or role in handshake');
        socket.disconnect();
        return;
      }
      
      // Join user to their personal room
      socket.join(userId);
      console.log(`👤 Socket.IO: User ${userId} (${role}) joined room`);
      
      // Store client info - limit to 1 Socket.IO connection per user
      if (!this.socketClients.has(userId)) {
        this.socketClients.set(userId, []);
      }
      
      const existingSockets = this.socketClients.get(userId)!;
      if (existingSockets.length >= 1) {
        console.log(`🔄 Socket.IO: User ${userId} already has ${existingSockets.length} Socket.IO connection(s), closing old ones`);
        existingSockets.forEach(existingSocket => {
          try {
            existingSocket.disconnect();
          } catch (e) {
            console.log('Error disconnecting old Socket.IO:', e);
          }
        });
        // Clear the array
        this.socketClients.set(userId, []);
      }
      
      this.socketClients.get(userId)!.push(socket);
      
      // Send welcome message
      socket.emit('connected', {
        type: 'connected',
        userId,
        timestamp: Date.now()
      });
      
      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`🔌 Socket.IO: User ${userId} disconnected`);
        this.removeSocketClient(userId, socket);
      });
      
      // Handle ping for keepalive
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });
    });
    
    console.log('⚡ Socket.IO: Connection handlers set up');
  }

  private setupWebSocketServer() {
    console.log('🔧 EventHub: Setting up WebSocket connection handlers');
    this.wss.on('connection', (ws: WebSocket, request) => {
      console.log('🔗 EventHub: NEW CONNECTION ESTABLISHED');
      try {
        const url = new URL(request.url || '/events', `http://${request.headers.host || 'localhost:5000'}`);
        const userId = url.searchParams.get('userId');
        const role = url.searchParams.get('role') || 'user';
        console.log('🔗 EventHub: Connection details:', { userId, role, url: url.toString() });
        if (!userId) {
          console.log('❌ EventHub: No userId provided, closing connection');
          ws.close(4000, 'User ID required');
          return;
        }
        // Check for existing connections and limit to 1 per user
        const existingClients = this.clients.get(userId) || [];
        if (existingClients.length >= 1) {
          console.log(`🔄 EventHub: User ${userId} already has ${existingClients.length} connection(s), closing old ones`);
          existingClients.forEach(client => {
            try { 
              client.ws.close(1000, 'Replaced by new connection'); 
            } catch (e) { 
              console.log('Error closing old ws:', e); 
            }
          });
          // Clear the array
          this.clients.set(userId, []);
        }
        
        const client: ConnectedClient = { ws, userId, role };
        this.clients.get(userId)!.push(client);
        console.log(`✅ EventHub: Client ${userId} connected successfully`);
        console.log(`📊 EventHub: Total clients for user ${userId}: ${this.clients.get(userId)!.length}`);
        ws.send(JSON.stringify({
          type: 'connected',
          message: 'WebSocket connected successfully',
          userId,
          role,
          timestamp: new Date().toISOString()
        }));
        ws.on('message', async (data) => {
          try {
            const message = JSON.parse(data.toString());
            console.log(`📨 Message from ${userId}:`, message.type);
            await this.handleMessage(ws, message, userId);
          } catch (error) {
            console.error('Message handling error:', error);
          }
        });
        ws.on('close', () => {
          console.log(`🔌 EventHub: Client ${userId} disconnected`);
          this.removeClient(userId, ws);
        });
        ws.on('error', (error) => {
          console.error(`❌ EventHub: Client ${userId} error:`, error);
          this.removeClient(userId, ws);
        });
      } catch (error) {
        console.error('❌ EventHub: Error setting up connection:', error);
        ws.close(1011, 'Internal server error');
      }
    });
  }

  private setupNotificationWebSocket(notificationWss: WebSocketServer) {
    console.log('🔔 EventHub: Setting up dedicated notification WebSocket on /ws');
    
    notificationWss.on('connection', (ws: WebSocket, request) => {
      console.log('🔔 EventHub: NEW NOTIFICATION WS CONNECTION ESTABLISHED');
      try {
        const url = new URL(request.url || '/ws', `http://${request.headers.host || 'localhost:5000'}`);
        const userId = url.searchParams.get('userId');
        const role = url.searchParams.get('role') || 'user';
        console.log('🔔 EventHub: Notification WS Connection details:', { userId, role, url: url.toString() });
        if (!userId) {
          console.log('❌ EventHub: No userId provided for notification ws, closing connection');
          ws.close(4000, 'User ID required');
          return;
        }
        // Force close all previous connections for this user
        const existingClients = this.clients.get(userId) || [];
        if (existingClients.length > 0) {
          console.log(`🔄 EventHub: Closing ${existingClients.length} previous notification ws connections for user ${userId}`);
          existingClients.forEach(client => {
            try { client.ws.close(1000, 'Replaced by new notification ws connection'); } catch (e) { console.log('Error closing old notification ws:', e); }
          });
        }
        this.clients.set(userId, []);
        const client: ConnectedClient = { ws, userId, role };
        this.clients.get(userId)!.push(client);
        console.log(`✅ EventHub: Notification WS Client ${userId} connected successfully`);
        console.log(`📊 EventHub: Total notification ws clients for user ${userId}: ${this.clients.get(userId)!.length}`);
        ws.send(JSON.stringify({
          type: 'connected',
          message: 'Notification WebSocket connected successfully',
          userId,
          role,
          timestamp: new Date().toISOString()
        }));
        ws.on('close', () => {
          console.log(`🔌 EventHub: Notification WS Client ${userId} disconnected`);
          this.removeClient(userId, ws);
        });
        ws.on('error', (error) => {
          console.error(`❌ EventHub: Notification WS Client ${userId} error:`, error);
          this.removeClient(userId, ws);
        });
        // Send periodic ping to keep connection alive
        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            try {
              ws.send(JSON.stringify({
                type: 'ping',
                timestamp: new Date().toISOString()
              }));
            } catch (error) {
              console.log('Error sending ping to notification ws client:', error);
              clearInterval(pingInterval);
              this.removeClient(userId, ws);
            }
          } else {
            clearInterval(pingInterval);
            this.removeClient(userId, ws);
          }
        }, 30000);
        ws.on('close', () => {
          clearInterval(pingInterval);
        });
      } catch (error) {
        console.error('❌ EventHub: Error setting up notification ws connection:', error);
        ws.close(1011, 'Internal server error');
      }
    });
  }

  private async handleMessage(ws: WebSocket, message: any, userId: string) {
    console.log(`📨 WebSocket message from ${userId}:`, message.type);
    
    switch (message.type) {
      case 'dashboard_register':
        console.log('📊 Dashboard registration:', {
          userId: message.userId,
          role: message.role,
          dashboard: message.dashboard
        });
        ws.send(JSON.stringify({ 
          type: 'dashboard_registered', 
          dashboard: message.dashboard,
          status: 'connected',
          timestamp: Date.now() 
        }));
        break;
      case 'REQUEST_PRICING_DATA':
        await this.handlePricingDataRequest(ws);
        break;
      default:
        console.log(`❓ Unknown message type: ${message.type}`);
    }
  }

  private async handlePricingDataRequest(ws: WebSocket) {
    try {
      // Import storage dynamically to avoid circular dependencies
      const { storage } = await import('./storage');
      const plans = await storage.getAllSubscriptionPlans();
      
      ws.send(JSON.stringify({
        type: 'PRICING_DATA_UPDATE',
        plans: plans,
        timestamp: Date.now()
      }));
      
      console.log(`💰 Sent pricing data to client: ${plans.length} plans`);
    } catch (error) {
      console.error('Error fetching pricing data:', error);
      ws.send(JSON.stringify({
        type: 'ERROR',
        message: 'Failed to fetch pricing data',
        timestamp: Date.now()
      }));
    }
  }

  private removeClient(userId: string, ws: WebSocket) {
    const userClients = this.clients.get(userId);
    if (userClients) {
      const index = userClients.findIndex(client => client.ws === ws);
      if (index !== -1) {
        userClients.splice(index, 1);
      }
      if (userClients.length === 0) {
        this.clients.delete(userId);
      }
    }
  }

  private removeSocketClient(userId: string, socket: any) {
    const userClients = this.socketClients.get(userId);
    if (userClients) {
      const index = userClients.findIndex(client => client.id === socket.id);
      if (index !== -1) {
        userClients.splice(index, 1);
        console.log(`🔌 Socket.IO: Client removed for user ${userId}. Remaining: ${userClients.length}`);
        
        if (userClients.length === 0) {
          this.socketClients.delete(userId);
          console.log(`📭 Socket.IO: All clients disconnected for user ${userId}`);
        }
      }
    }
  }

  // Event emission methods
  public emitToUser(userId: string, event: any) {
    // Emit via WebSocket (existing clients)
    const userClients = this.clients.get(userId);
    if (userClients) {
      userClients.forEach(client => {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(JSON.stringify(event));
        }
      });
    }
    
    // Emit via Socket.IO (new reliable method)
    this.io.to(userId).emit('realtime-event', event);
    
    console.log(`📡 Event emitted to user ${userId} via WebSocket and Socket.IO:`, event.type);
  }

  public emitToRole(role: string, event: any) {
    this.clients.forEach((userClients) => {
      userClients.forEach(client => {
        if (client.role === role && client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(JSON.stringify(event));
        }
      });
    });
  }

  public emitToAll(event: any) {
    this.clients.forEach((userClients) => {
      userClients.forEach(client => {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(JSON.stringify(event));
        }
      });
    });
  }

  // Specific event emitters
  public emitNewNotification(userId: string, notification: any) {
    this.emitToUser(userId, {
      type: 'notification',
      action: 'new',
      data: notification
    });
  }

  public emitNewMessage(userId: string, message: any) {
    this.emitToUser(userId, {
      type: 'message',
      action: 'new',
      data: message
    });
  }

  public emitBookingUpdate(userId: string, booking: any) {
    this.emitToUser(userId, {
      type: 'booking',
      action: 'update',
      data: booking
    });
  }

  public emitVehicleUpdate(userId: string, vehicle: any) {
    this.emitToUser(userId, {
      type: 'vehicle',
      action: 'update',
      data: vehicle
    });
  }

  public emitGPSUpdate(userId: string, gpsData: any) {
    this.emitToUser(userId, {
      type: 'gps',
      action: 'update',
      data: gpsData
    });
  }

  public emitDashboardUpdate(userId: string, analytics: any) {
    this.emitToUser(userId, {
      type: 'dashboard',
      action: 'update',
      data: analytics
    });
  }

  public emitPricingDataUpdate(plans: any) {
    console.log('📊 Broadcasting pricing update to all clients:', plans.length, 'plans');
    this.emitToAll({
      type: 'PRICING_DATA_UPDATE',
      plans: plans,
      timestamp: Date.now()
    });
  }

  public emitPlanUpdate(plan: any) {
    console.log('💰 Broadcasting single plan update:', plan.name, '₹' + plan.price);
    this.emitToAll({
      type: 'PLAN_UPDATE',
      plan: plan,
      timestamp: Date.now()
    });
  }
}

let eventHub: EventHub;

export function initializeEventHub(server: Server) {
  eventHub = new EventHub(server);
  console.log('🚀 Event Hub initialized');
  return eventHub;
}

export function getEventHub(): EventHub {
  if (!eventHub) {
    throw new Error('Event Hub not initialized');
  }
  return eventHub;
}