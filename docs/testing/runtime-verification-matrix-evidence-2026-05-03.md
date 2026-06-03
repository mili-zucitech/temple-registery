# Runtime Verification Evidence - 2026-05-03

## E1 Frontend Build
- Command: npm run build
- Result: success
- Output excerpt:
  - vite v6.4.2 building for production...
  - 3182 modules transformed
  - built in 22.44s
  - exit code 0

## E2 Backend Compile
- Command: mvn -q -DskipTests compile
- Result: success
- Output excerpt: COMPILE_EXIT_CODE=0

## E3 Backend Startup Failure (before resolver fix)
- Run mode: java -jar target/temple-registry-backend-0.0.1-SNAPSHOT.jar with APP_ENCRYPTION_KEY and APP_HMAC_KEY (32-byte values)
- Failure excerpt:
  - APPLICATION FAILED TO START
  - Description: Parameter 8 of constructor in TempleProfileStagingServiceImpl required a bean of type com.templeregistry.service.workflow.ActionContextResolver that could not be found.

## E4 Backend Startup Failure (invalid key length)
- Run mode: java -jar target/temple-registry-backend-0.0.1-SNAPSHOT.jar with 64-char APP_ENCRYPTION_KEY
- Failure excerpt:
  - Application run failed
  - BeanCreationException creating AesEncryptionConverter
  - IllegalArgumentException: AES encryption key must be exactly 32 bytes (256 bits).

## E5 Backend Startup Progress (after resolver fix)
- Run mode: java -jar target/temple-registry-backend-0.0.1-SNAPSHOT.jar with 32-byte APP_ENCRYPTION_KEY and APP_HMAC_KEY
- Observed:
  - Tomcat lifecycle startup traces present
  - Hikari pool started and DB TLS handshake succeeded
  - No line containing: Started TempleRegistryApplication
- Therefore: full startup remains NOT VERIFIED in this run window.

## E6 Existing DB Query Proof Artifact
- Existing smoke report contains workflow instance verification SQL for staging workflow creation:
  - SELECT ... FROM workflow_instance WHERE entity_type='TEMPLE_PROFILE' ...
- Source: backend/TRACK_4_SMOKE_VERIFICATION_REPORT.md
