# Client Build Setup - CargoRepo

## 🚀 **Default Setup: Client Build with Backend**

The application is now configured to serve the **client build** by default with the backend server.

### **How it works:**
- **Backend**: Runs on port 8000
- **Frontend**: Served as static build from `client/dist/`
- **Single Server**: Everything runs from one server at `http://localhost:8000`

### **Available Scripts:**

```bash
# Start development server (serves client build)
npm run dev

# Build client and start development server
npm run start:dev

# Build only the client
npm run build:client

# Build both client and server for production
npm run build

# Start production server
npm run start
```

### **Quick Start:**

1. **First time setup:**
   ```bash
   npm run build:client  # Build the client
   npm run dev          # Start the server
   ```

2. **Regular development:**
   ```bash
   npm run dev          # Starts server with existing client build
   ```

3. **After making changes to client:**
   ```bash
   npm run build:client  # Rebuild client
   npm run dev          # Restart server
   ```

### **Access the Application:**
- **URL**: `http://localhost:8000`
- **API**: `http://localhost:8000/api/*`
- **WebSocket**: `ws://localhost:8000/ws`

### **Benefits:**
✅ **Single server** - No need to run separate frontend/backend  
✅ **Production-like** - Uses built assets instead of Vite dev server  
✅ **Faster startup** - No Vite compilation on startup  
✅ **Better performance** - Optimized production build  
✅ **Simpler deployment** - One server to deploy  

### **Fallback:**
If the client build fails, the server will automatically fall back to Vite development mode.

### **Login Credentials:**
- **Email**: `admin@logigofast.com`
- **Password**: `admin123`

---

**Note**: This setup prioritizes the client build for better performance and production-like behavior during development. 