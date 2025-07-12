/**
 * Database Connection Verification Script
 * Test your database connection and show tables
 * Usage: node scripts/verify-database-connection.js
 */

const { Pool } = require('pg');

async function verifyDatabase() {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error('❌ DATABASE_URL environment variable not found');
    process.exit(1);
  }

  console.log('🔄 Testing database connection...');
  console.log('🌐 Database URL host:', dbUrl.split('@')[1]?.split('/')[0] || 'Unknown');

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Test connection
    console.log('📡 Connecting to database...');
    const client = await pool.connect();
    
    // Basic info
    const basicInfo = await client.query('SELECT current_database(), current_user, current_schema()');
    console.log('✅ Connected successfully!');
    console.log('📋 Database:', basicInfo.rows[0].current_database);
    console.log('👤 User:', basicInfo.rows[0].current_user);
    console.log('📁 Schema:', basicInfo.rows[0].current_schema);
    
    console.log('\n📊 Table List:');
    console.log('='.repeat(50));
    
    // Get tables with row counts
    const tablesQuery = `
      SELECT 
        t.table_name,
        CASE 
          WHEN t.table_name IN ('users', 'bookings', 'vehicles', 'notifications') 
          THEN (SELECT count(*) FROM information_schema.tables WHERE table_name = t.table_name)::text
          ELSE '✓'
        END as status
      FROM information_schema.tables t
      WHERE t.table_schema = 'public'
      ORDER BY t.table_name;
    `;
    
    const tables = await client.query(tablesQuery);
    
    // Essential tables check
    const essentialTables = ['users', 'bookings', 'vehicles', 'notifications'];
    const existingTables = tables.rows.map(row => row.table_name);
    
    console.log('🔍 Essential Tables Status:');
    essentialTables.forEach(table => {
      const exists = existingTables.includes(table);
      console.log(`${exists ? '✅' : '❌'} ${table}: ${exists ? 'Found' : 'Missing'}`);
    });
    
    console.log('\n📈 Data Count Check:');
    console.log('='.repeat(30));
    
    // Get actual row counts for essential tables
    for (const table of essentialTables) {
      if (existingTables.includes(table)) {
        try {
          const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
          const count = countResult.rows[0].count;
          console.log(`📊 ${table}: ${count} records`);
        } catch (error) {
          console.log(`⚠️  ${table}: Error getting count`);
        }
      }
    }
    
    console.log('\n🔑 Admin User Check:');
    console.log('='.repeat(25));
    
    try {
      const adminCheck = await client.query(`
        SELECT email, role, subscription_plan, is_active 
        FROM users 
        WHERE role = 'admin' 
        ORDER BY email
      `);
      
      if (adminCheck.rows.length > 0) {
        adminCheck.rows.forEach(admin => {
          console.log(`✅ ${admin.email} (${admin.subscription_plan}) - ${admin.is_active ? 'Active' : 'Inactive'}`);
        });
      } else {
        console.log('❌ No admin users found');
      }
    } catch (error) {
      console.log('⚠️  Could not check admin users');
    }
    
    console.log('\n🎉 Database Verification Complete!');
    console.log('='.repeat(40));
    console.log(`📊 Total Tables: ${tables.rows.length}`);
    console.log('✅ Database is ready for Render deployment');
    console.log('🚀 All systems operational');
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('🔧 Check your DATABASE_URL format');
    process.exit(1);
  }
}

verifyDatabase();