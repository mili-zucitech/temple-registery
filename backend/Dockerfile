# ─── Stage 1: Build ────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /build

# Cache dependencies before copying source
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN ./mvnw dependency:go-offline -q

# Build (skip tests — tests run in CI pipeline, not in image build)
COPY src/ src/
RUN ./mvnw package -DskipTests -q

# ─── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine AS runtime

# Security: run as non-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app

# Copy the fat JAR from the builder stage
COPY --from=builder /build/target/*.jar app.jar

# Keys directory — populated at deploy time via Kubernetes Secret / volume mount
RUN mkdir -p /app/keys && chown -R appuser:appgroup /app

USER appuser

EXPOSE 8080

# JVM tuning for containers; actuator graceful shutdown enabled in application.yml
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
