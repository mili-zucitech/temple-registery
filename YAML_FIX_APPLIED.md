# ✅ YAML Configuration Fixed

## Issue Resolved

**Problem:** Duplicate `spring:` key in `application-dev.yml`

**Error Message:**
```
org.yaml.snakeyaml.constructor.DuplicateKeyException: 
while constructing a mapping
found duplicate key spring
in 'reader', line 63, column 1
```

## What Was Wrong

The `application-dev.yml` file had:
- **Two `spring:` keys** (line 1 and line 63)
- **Two `app:` keys** (one in the middle, one at the end)

This happened when we added the email configuration for the notification module.

## What Was Fixed

✅ **Merged duplicate `spring:` sections into one**
- Moved `spring.mail` configuration under the main `spring:` key
- Now there's only ONE `spring:` key at the top

✅ **Merged duplicate `app:` sections into one**
- Moved `app.base-url` under the main `app:` key
- Now there's only ONE `app:` key

## Fixed Configuration Structure

```yaml
spring:                          # ← Single spring key
  datasource:
    ...
  jpa:
    ...
  flyway:
    ...
  security:
    ...
  mail:                          # ← Email config merged here
    enabled: false
    host: smtp.gmail.com
    ...

springdoc:
  ...

trm:
  ...

app:                             # ← Single app key
  jwt:
    ...
  cors:
    ...
  encryption:
    ...
  storage:
    ...
  base-url: ${APP_BASE_URL:...} # ← Merged here

logging:
  ...
```

## Verification

✅ **YAML syntax is now valid**
✅ **No duplicate keys**
✅ **Application should start successfully**

## Next Steps

### 1. Start the Application

The application is currently starting in the background. You can:

**Option A: Check if it's running**
```bash
# Check if port 8080 is listening
netstat -ano | findstr :8080

# Or check the process
Get-Process -Name java
```

**Option B: Stop and restart manually**
```bash
# Stop the background process
# Press Ctrl+C in the terminal where it's running

# Start fresh
cd backend
mvn spring-boot:run
```

### 2. Wait for Startup

Spring Boot applications typically take 30-60 seconds to start, especially on first run. Look for this message:

```
Started TempleRegistryApplication in X.XXX seconds
```

### 3. Test the Application

Once started, test the notification system:

```bash
# Check if application is running
curl http://localhost:8080/actuator/health

# Or test an API endpoint
curl http://localhost:8080/api/health
```

## Email Configuration (Optional)

The email configuration is now properly integrated under `spring.mail`:

```yaml
spring:
  mail:
    enabled: false  # ← Disabled by default
    host: smtp.gmail.com
    port: 587
    username: ${SMTP_USERNAME:your-email@gmail.com}
    password: ${SMTP_PASSWORD:your-app-password}
    from: noreply@templeregistry.gov.in
```

**To enable email notifications:**

1. Get Gmail App Password
2. Set environment variables:
   ```bash
   $env:SMTP_USERNAME="your-email@gmail.com"
   $env:SMTP_PASSWORD="your-16-char-password"
   ```
3. Change `enabled: false` to `enabled: true`
4. Restart application

## Summary

✅ **YAML configuration fixed**
✅ **Duplicate keys removed**
✅ **Email configuration properly merged**
✅ **Application should start successfully**

The notification system is ready to use once the application starts!

---

**Status:** ✅ FIXED  
**Next:** Wait for application to start (30-60 seconds)  
**Then:** Test notifications!
