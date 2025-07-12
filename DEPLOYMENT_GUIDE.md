# CargoFlow - Server Deployment Guide

## Prerequisites
- Linux Server (Ubuntu 20.04+ recommended)
- Node.js 20+ 
- PM2 (Process Manager)
- Nginx (Reverse Proxy)
- SSL Certificate (Let's Encrypt)
- PostgreSQL Database (Neon or self-hosted)

## Step 1: Server Setup

### 1.1 Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Install Node.js 20+
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # Should be 20+
```

### 1.3 Install PM2 Globally
```bash
sudo npm install -g pm2
```

### 1.4 Install Nginx
```bash
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

## Step 2: Project Deployment

### 2.1 Create Project Directory
```bash
sudo mkdir -p /var/www/cargoflow
sudo chown -R $USER:$USER /var/www/cargoflow
cd /var/www/cargoflow
```

### 2.2 Clone/Upload Project
```bash
# Option A: Git Clone (if using Git)
git clone https://github.com/yourusername/cargoflow.git .

# Option B: Upload files manually
# Upload your project files to /var/www/cargoflow/
```

### 2.3 Install Dependencies
```bash
npm install --production
```

### 2.4 Build Production Assets
```bash
npm run build
```

## Step 3: Environment Configuration

### 3.1 Create Environment File
```bash
nano .env
```

Add the following variables:
```env
NODE_ENV=production
DATABASE_URL=your_postgresql_connection_string
SESSION_SECRET=your_super_secure_session_secret_64_chars_minimum
PORT=5000
FRONTEND_URL=https://yourdomain.com
```

### 3.2 Secure Environment File
```bash
chmod 600 .env
```

## Step 4: Database Setup

### 4.1 Run Database Migrations
```bash
npm run db:push
```

### 4.2 Verify Database Connection
```bash
# Test connection (optional)
node -e "
const { Pool } = require('@neondatabase/serverless');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()').then(r => console.log('DB Connected:', r.rows[0])).catch(console.error);
"
```

## Step 5: PM2 Process Management

### 5.1 Create PM2 Configuration
```bash
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'cargoflow',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/cargoflow/error.log',
    out_file: '/var/log/cargoflow/access.log',
    log_file: '/var/log/cargoflow/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
```

### 5.2 Create Log Directory
```bash
sudo mkdir -p /var/log/cargoflow
sudo chown -R $USER:$USER /var/log/cargoflow
```

### 5.3 Start Application with PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

Follow the command output to setup PM2 auto-start.

## Step 6: Nginx Configuration

### 6.1 Create Nginx Site Configuration
```bash
sudo nano /etc/nginx/sites-available/cargoflow
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options nosniff;
    }
    
    # Main application
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_redirect off;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # WebSocket support for GPS tracking
    location /ws {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 6.2 Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/cargoflow /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

## Step 7: SSL Certificate (Let's Encrypt)

### 7.1 Install Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 7.2 Obtain SSL Certificate
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 7.3 Auto-renewal Setup
```bash
sudo crontab -e
```

Add this line:
```
0 12 * * * /usr/bin/certbot renew --quiet
```

## Step 8: Firewall Configuration

### 8.1 Configure UFW
```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
sudo ufw status
```

## Step 9: Monitoring & Maintenance

### 9.1 Monitor Application
```bash
# Check PM2 status
pm2 status
pm2 logs cargoflow

# Check Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Check system resources
htop
df -h
```

### 9.2 Application Updates
```bash
# Stop application
pm2 stop cargoflow

# Update code
git pull origin main  # or upload new files

# Install new dependencies
npm install --production

# Rebuild
npm run build

# Database migrations (if needed)
npm run db:push

# Restart application
pm2 restart cargoflow
```

## Step 10: Backup Strategy

### 10.1 Database Backup
```bash
# Create backup script
nano /home/$USER/backup-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/$USER/backups"
mkdir -p $BACKUP_DIR

# Database backup (for Neon, export data)
# For self-hosted PostgreSQL:
# pg_dump $DATABASE_URL > $BACKUP_DIR/cargoflow_$DATE.sql

# Application files backup
tar -czf $BACKUP_DIR/cargoflow_files_$DATE.tar.gz /var/www/cargoflow

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
```

```bash
chmod +x /home/$USER/backup-db.sh
```

### 10.2 Automated Backups
```bash
crontab -e
```

Add:
```
0 2 * * * /home/$USER/backup-db.sh
```

## Step 11: Security Hardening

### 11.1 Fail2Ban (Optional)
```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 11.2 Update Nginx Security
```bash
sudo nano /etc/nginx/nginx.conf
```

Add in `http` block:
```nginx
server_tokens off;
client_max_body_size 10M;
```

## Final Verification

### Check Application Status
```bash
# PM2 status
pm2 status

# Application health
curl http://localhost:5000/api/user
curl https://yourdomain.com

# SSL certificate
curl -I https://yourdomain.com

# Database connection
pm2 logs cargoflow | grep -i "serving on port"
```

## Default Admin Credentials
- Email: admin@logigofast.com
- Password: admin123

**Important:** Change these credentials immediately after deployment!

## Support Commands

```bash
# Restart all services
sudo systemctl restart nginx
pm2 restart cargoflow

# View real-time logs
pm2 logs cargoflow --lines 50

# Check disk space
df -h

# Check memory usage
free -h

# Check running processes
pm2 list
```

Your CargoFlow application is now ready for production deployment!