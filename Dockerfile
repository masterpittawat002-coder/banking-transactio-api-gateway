# === Stage 1: Builder ===
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files ก่อน เพื่อ cache npm install layer
COPY package*.json ./

# Install ALL dependencies (รวม devDependencies เพราะต้องใช้ typescript)
RUN npm ci

# Copy source code + build configs
COPY tsconfig.json tsconfig.build.json ./
COPY src/ ./src/

# Compile TypeScript
RUN npm run build

# === Stage 2: Production ===
FROM node:20-alpine AS production

WORKDIR /app

# สร้าง non-root user -- security best practice
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy compiled code จาก builder stage + register-paths สำหรับ path alias
COPY --from=builder /app/dist ./dist
COPY register-paths.js ./

# Copy migrations + migrate script — ต้องมีใน image เพราะ Render Free plan
# ไม่รองรับ Pre-Deploy Command ต้อง run migrate ตอน container start
COPY database/migrations ./database/migrations
COPY scripts/migrate.js ./scripts/migrate.js

# สร้าง logs directory
RUN mkdir -p logs && chown -R appuser:appgroup logs

# สลับเป็น non-root user
USER appuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start -- run migrations ก่อน แล้วค่อย start app
# ใช้ -r register-paths.js เพื่อให้ @/ alias ทำงานใน production
CMD ["sh", "-c", "node scripts/migrate.js && node -r ./register-paths.js dist/app.js"]