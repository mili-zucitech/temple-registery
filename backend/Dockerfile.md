# temple-registry-backend
# ──────────────────────────────────────────────────────────────────────────────
# Build:   docker build -t temple-registry-backend .
# Run dev: docker run -p 8080:8080 --env-file .env temple-registry-backend
# ──────────────────────────────────────────────────────────────────────────────

# Required environment variables (must be provided at runtime):
# DB_URL              jdbc:mysql://mysql:3306/temple_registry?...
# DB_USERNAME         <db user>
# DB_PASSWORD         <db password>
# JWT_ACCESS_SECRET   (not used — key material is mounted from /app/keys/)
# ENCRYPTION_KEY      32-char AES key (hex or plain — must be exactly 32 bytes)
# AWS_REGION          ap-south-1
# S3_BUCKET_NAME      temple-registry-docs-<env>
# CORS_ALLOWED_ORIGINS https://portal.temple-registry.gov.in

# For local dev, override via docker-compose or application-dev.yml.
