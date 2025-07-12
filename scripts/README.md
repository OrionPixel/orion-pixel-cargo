# Production Deployment Scripts

This folder contains scripts for production database deployment and admin user management.

## Available Scripts

### 1. Schema Deployment
```bash
node scripts/deploy-schema.js [database-url]
```
- Deploys complete database schema using Drizzle
- Uses DATABASE_URL environment variable if no URL provided
- Example: `node scripts/deploy-schema.js postgresql://user:pass@host/db`

### 2. Admin User Creation
```bash
node scripts/create-admin.js <email> <password> [database-url]
```
- Creates admin user with specified credentials
- Uses DATABASE_URL environment variable if no URL provided
- Example: `node scripts/create-admin.js admin@company.com mypassword123`

### 3. Simple Admin Creation (Shell Script)
```bash
./scripts/create-admin-simple.sh <email> <password>
```
- Creates admin user using registration API + SQL update
- Requires local server running
- Example: `./scripts/create-admin-simple.sh admin@company.com mypassword123`

## Security Notes

- **Never commit database URLs to version control**
- **Always pass database URLs as command line arguments**
- **Use environment variables for automation**
- **Generated passwords should be changed after first login**

## Usage for Production

1. First deploy the schema:
   ```bash
   node scripts/deploy-schema.js "your-production-database-url"
   ```

2. Then create admin user:
   ```bash
   node scripts/create-admin.js admin@company.com securepass123 "your-production-database-url"
   ```

3. Verify deployment by logging into your application with the admin credentials.