import { db } from './db';
import { vehicles, users } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

// Production diagnostic endpoint for vehicle creation issues
export async function setupDiagnosticRoutes(app: any) {
  app.get('/api/diagnostic/health', async (req: any, res: any) => {
    try {
      const checks = {
        database: false,
        vehicleTable: false,
        userTable: false,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL ? 'Present' : 'Missing'
      };

      // Test database connection
      try {
        await db.select().from(users).limit(1);
        checks.database = true;
      } catch (error) {
        console.error('Database connection test failed:', error);
      }

      // Test vehicle table access
      try {
        await db.select().from(vehicles).limit(1);
        checks.vehicleTable = true;
      } catch (error) {
        console.error('Vehicle table test failed:', error);
      }

      // Test user table access
      try {
        await db.select().from(users).limit(1);
        checks.userTable = true;
      } catch (error) {
        console.error('User table test failed:', error);
      }

      const overallHealth = checks.database && checks.vehicleTable && checks.userTable;

      res.status(overallHealth ? 200 : 500).json({
        status: overallHealth ? 'healthy' : 'unhealthy',
        checks,
        message: overallHealth ? 'All systems operational' : 'Some systems failing'
      });
    } catch (error) {
      console.error('Health check failed:', error);
      res.status(500).json({
        status: 'error',
        message: 'Health check failed',
        error: error.message
      });
    }
  });

  app.get('/api/diagnostic/vehicle-schema', async (req: any, res: any) => {
    try {
      const sampleVehicleData = {
        registrationNumber: 'TEST123',
        vehicleType: 'Truck',
        capacity: '1000',
        driverName: 'Test Driver',
        driverPhone: '1234567890',
        driverLicense: 'DL123456',
        isActive: true,
        userId: 'test-user-id'
      };

      const { insertVehicleSchema } = await import('@shared/schema');
      const validation = insertVehicleSchema.safeParse(sampleVehicleData);

      res.json({
        schemaTest: 'completed',
        sampleData: sampleVehicleData,
        validation: {
          success: validation.success,
          errors: validation.success ? null : validation.error.errors
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Schema diagnostic failed:', error);
      res.status(500).json({
        status: 'error',
        message: 'Schema diagnostic failed',
        error: error.message
      });
    }
  });

  app.post('/api/diagnostic/test-vehicle', async (req: any, res: any) => {
    try {
      // Get a real user ID from the database for testing
      const realUser = await db.select().from(users).limit(1);
      const testUserId = realUser[0]?.id || 'test-user-id';
      
      const testData = {
        registrationNumber: `TEST-${Date.now()}`,
        vehicleType: 'Truck',
        capacity: '1000',
        driverName: 'Test Driver',
        driverPhone: '1234567890',
        driverLicense: 'DL123456',
        isActive: true,
        userId: req.body.userId || testUserId
      };

      console.log('🧪 DIAGNOSTIC: Testing vehicle creation with data:', testData);

      const { insertVehicleSchema } = await import('@shared/schema');
      const validation = insertVehicleSchema.safeParse(testData);

      if (!validation.success) {
        return res.status(400).json({
          status: 'validation_failed',
          errors: validation.error.errors,
          testData
        });
      }

      // Try to create test vehicle
      const testVehicle = await db.insert(vehicles).values(validation.data).returning();
      
      // Clean up test data
      if (testVehicle[0]) {
        await db.delete(vehicles).where(eq(vehicles.id, testVehicle[0].id));
      }

      res.json({
        status: 'success',
        message: 'Vehicle creation test passed',
        testData,
        createdVehicle: testVehicle[0],
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Test vehicle creation failed:', error);
      
      // Classify the error type
      let errorType = 'unknown_error';
      let userMessage = 'Test vehicle creation failed';
      
      if (error.code === '23503') {
        errorType = 'foreign_key_violation';
        userMessage = 'Invalid user ID - user does not exist';
      } else if (error.code === '23505') {
        errorType = 'duplicate_key';
        userMessage = 'Duplicate registration number';
      } else if (error.code === 'ECONNREFUSED') {
        errorType = 'database_connection';
        userMessage = 'Database connection failed';
      }
      
      res.status(500).json({
        status: 'error',
        message: userMessage,
        errorType,
        error: error.message,
        code: error.code,
        constraint: error.constraint,
        timestamp: new Date().toISOString()
      });
    }
  });

  // GPS Schema Check endpoint
  app.get('/api/diagnostic/gps-schema', async (req: any, res: any) => {
    try {
      // Check if GPS columns exist in vehicles table
      const schemaCheck = await db.execute(sql`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'vehicles' 
        AND column_name IN ('gps_device_id', 'gps_imei', 'gps_sim_number', 'gps_status')
        ORDER BY column_name
      `);
      
      const existingColumns = schemaCheck.rows.map((row: any) => row.column_name);
      const requiredColumns = ['gps_device_id', 'gps_imei', 'gps_sim_number', 'gps_status'];
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
      
      const isSchemaComplete = missingColumns.length === 0;
      
      res.json({
        status: isSchemaComplete ? 'complete' : 'incomplete',
        requiredColumns,
        existingColumns,
        missingColumns,
        recommendation: isSchemaComplete ? 
          'GPS schema is complete' : 
          `Missing GPS columns: ${missingColumns.join(', ')}. Run database migration.`,
        fix: isSchemaComplete ? null : 'npm run db:push or use scripts/fix-production-schema.js',
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('GPS schema check failed:', error);
      res.status(500).json({
        status: 'error',
        message: 'GPS schema check failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });
}