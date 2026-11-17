# Panduan Docker & Deployment
## KaryaGuard — Secure HRIS, Geofenced Attendance & Payroll System

> **Target Lingkungan**:
> 1. **Lokal / Containerized**: Docker & Docker Compose (Multi-stage build).
> 2. **Cloud Production**: Vercel (Next.js Application) + Neon PostgreSQL (Serverless Database).

---

## 1. Konfigurasi Docker Multi-Stage (`Dockerfile`)

Gunakan *multi-stage build* untuk meminimalisir ukuran image (< 150 MB) dan meningkatkan keamanan container (menjalankan aplikasi dengan user non-root `nextjs`).

```dockerfile
# -----------------------------------------------------------------------------
# Stage 1: Base & Dependencies
# -----------------------------------------------------------------------------
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client & Build Next.js standalone
ENV NEXT_TELEMETRY_DISABLED 1
RUN npx prisma generate
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 3: Runner (Production Image Non-Root)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Security: Jalankan sebagai user non-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set permission yang tepat untuk prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy artifact standalone dari builder
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

---

## 2. Konfigurasi `docker-compose.yml` (Pengujian Lokal Lengkap)

Docker Compose memungkinkan pengujian sistem secara offline dengan PostgreSQL lokal atau langsung terkoneksi ke Neon:

```yaml
version: '3.8'

services:
  # Next.js Application Container
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: karyaguard-app
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://karyaguard_user:karyaguard_pass@postgres:5432/karyaguard_db?schema=public
      - JWT_SECRET=super_secret_jwt_key_minimal_32_characters_long_12345
      - NEXT_PUBLIC_APP_URL=http://localhost:3000
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - karyaguard-net

  # Local PostgreSQL Database (Staging / Offline Testing)
  postgres:
    image: postgres:16-alpine
    container_name: karyaguard-postgres
    restart: always
    environment:
      POSTGRES_USER: karyaguard_user
      POSTGRES_PASSWORD: karyaguard_pass
      POSTGRES_DB: karyaguard_db
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U karyaguard_user -d karyaguard_db"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - karyaguard-net

  # Prisma Studio Container (UI Database Inspector)
  prisma-studio:
    image: node:20-alpine
    container_name: karyaguard-studio
    working_dir: /app
    volumes:
      - ./prisma:/app/prisma
      - ./package.json:/app/package.json
    command: sh -c "npm install prisma @prisma/client && npx prisma studio --browser none --port 5555"
    ports:
      - "5555:5555"
    environment:
      - DATABASE_URL=postgresql://karyaguard_user:karyaguard_pass@postgres:5432/karyaguard_db?schema=public
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - karyaguard-net

volumes:
  pgdata:

networks:
  karyaguard-net:
    driver: bridge
```

### Perintah Menjalankan Docker:
```bash
# 1. Menjalankan seluruh container
docker compose up --build -d

# 2. Menjalankan migrasi database di container
docker compose exec app npx prisma migrate deploy

# 3. Menjalankan database seed (akun uji coba)
docker compose exec app npx prisma db seed

# 4. Mematikan container
docker compose down
```

---

## 3. Integrasi Neon PostgreSQL (Cloud Serverless)

1. Buat project baru di **[neon.tech](https://neon.tech)**.
2. Dapatkan *Connection String* dengan parameter SSL:
   ```env
   DATABASE_URL="postgresql://[user]:[password]@[endpoint].neon.tech/neondb?sslmode=require"
   ```
3. Neon mendukung *connection pooling* otomatis yang sangat optimal saat dipadukan dengan Vercel Serverless Functions.

---

## 4. Panduan Publikasi ke Vercel

Sesuai standar rilis publik (FQDN publik ber-HTTPS aktif):

1. **Push Source Code ke Repositori GitHub/GitLab**:
   ```bash
   git init
   git add .
   git commit -m "feat: initial commit KaryaGuard HRIS"
   git remote add origin https://github.com/username/karyaguard.git
   git push -u origin main
   ```
2. **Impor ke Vercel**:
   * Buka [vercel.com](https://vercel.com) -> *Add New Project* -> Pilih repositori `karyaguard`.
   * Framework Preset: **Next.js**.
3. **Konfigurasi Environment Variables di Vercel Dashboard**:
   * `DATABASE_URL`: Connection string dari Neon DB.
   * `JWT_SECRET`: Random string 64 karakter untuk enkripsi token sesi.
   * `NEXT_PUBLIC_APP_URL`: URL subdomain Vercel Anda (contoh: `https://karyaguard.vercel.app`).
4. **Deploy**:
   * Klik **Deploy**. Dalam waktu ~1-2 menit, aplikasi aktif dan dapat diakses dengan sertifikat SSL/TLS valid.

