# LifeLine — Production Deployment Guide & Runbook

This guide describes how to deploy the full **LifeLine Emergency Blood & Donor Network** to a production cloud server (AWS EC2, DigitalOcean Droplet, Hetzner, or on-premise Linux host) using Docker and Nginx.

---

## 1. Production Architecture Overview

```
                 [Internet / End Users]
                           │
                           ▼ HTTPS (Port 443)
              ┌───────────────────────────┐
              │ Cloudflare / Edge Proxy   │ (SSL/TLS Termination)
              └────────────┬──────────────┘
                           │ HTTP (Port 80)
                           ▼
              ┌───────────────────────────┐
              │  lifeline_prod_client     │
              │  (Nginx Alpine Container) │
              └─────┬──────────────┬──────┘
       Static Files │              │ Proxy /api/* & /socket.io/*
       (React SPA)  │              │
                    │              ▼
                    │    ┌───────────────────────────┐
                    │    │   lifeline_prod_server    │
                    │    │  (Node 20 Alpine Runner)  │
                    │    └─────┬──────────────┬──────┘
                    │          │              │
                    ▼          ▼              ▼
              ┌──────────┐ ┌──────────┐ ┌──────────┐
              │ Browser  │ │ Postgres │ │  Redis   │
              │ Clients  │ │  Port    │ │  Port    │
              │ (Cache)  │ │  5432    │ │  6379    │
              └──────────┘ └──────────┘ └──────────┘
```

---

## 2. Server Preparation & Requirements

### Minimum Hardware Recommendations:
- **CPU**: 2 vCPU cores
- **RAM**: 4 GB (minimum 2 GB with swap)
- **Disk**: 40 GB NVMe / SSD
- **OS**: Ubuntu 22.04 LTS or 24.04 LTS / Debian 12

### Install Docker Engine & Compose on Server:
```bash
# Update and install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Verify Docker installation
docker --version
docker compose version
```

---

## 3. Environment Configuration

Create a production `.env` file on the server (do **not** commit this to version control):

```bash
# ==========================================
# LifeLine Production Secrets
# ==========================================

# Database
POSTGRES_USER=lifeline_prod_user
POSTGRES_PASSWORD=GENERATE_STRONG_RANDOM_PASSWORD_64_CHARS
POSTGRES_DB=lifeline_prod_db

# Redis Cache
REDIS_PASSWORD=GENERATE_STRONG_RANDOM_REDIS_PASSWORD_64_CHARS

# JWT Cryptographic Secrets (Use: openssl rand -base64 48)
JWT_ACCESS_SECRET=GENERATE_STRONG_64_CHAR_ACCESS_SECRET
JWT_REFRESH_SECRET=GENERATE_STRONG_64_CHAR_REFRESH_SECRET

# Application Domain
CLIENT_URL=https://lifeline.org.bd
PORT=80
```

---

## 4. One-Command Production Launch

Clone the repository and launch the container cluster:

```bash
# 1. Build and start all 4 production services in background
docker compose -f docker-compose.prod.yml up -d --build

# 2. Verify all container health statuses
docker compose -f docker-compose.prod.yml ps
```

All 4 containers (`lifeline_prod_postgres`, `lifeline_prod_redis`, `lifeline_prod_server`, `lifeline_prod_client`) should indicate `(healthy)`.

---

## 5. Database Schema Initialization & Seeding

Run Prisma migrations inside the running production server container:

```bash
# Run schema migration
docker compose -f docker-compose.prod.yml exec server npx prisma migrate deploy

# (Optional) Seed initial hospitals, test donors, and admin user
docker compose -f docker-compose.prod.yml exec server npx tsx prisma/seed.ts
```

---

## 6. SSL / HTTPS Setup with Let's Encrypt Certbot

If you are not using Cloudflare for automatic SSL, you can obtain a free certificate via Certbot:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d lifeline.org.bd -d www.lifeline.org.bd
```

---

## 7. Daily Database Backup Automation

Add a daily automated PostgreSQL dump via crontab:

```bash
sudo crontab -e
```

Add the following cron line (runs daily at 3:00 AM Asia/Dhaka time):
```cron
0 3 * * * docker exec lifeline_prod_postgres pg_dump -U lifeline_prod_user -d lifeline_prod_db | gzip > /backups/lifeline_$(date +\%Y\%m\%d_\%H\%M\%S).sql.gz
```

---

## 8. Maintenance Commands Cheat Sheet

| Task | Command |
| :--- | :--- |
| **View live logs** | `docker compose -f docker-compose.prod.yml logs -f` |
| **Backend logs only** | `docker compose -f docker-compose.prod.yml logs -f server` |
| **Restart cluster** | `docker compose -f docker-compose.prod.yml restart` |
| **Update to latest code** | `git pull && docker compose -f docker-compose.prod.yml up -d --build` |
| **Prisma Studio in container** | `docker compose -f docker-compose.prod.yml exec server npx prisma studio --port 5555` |
