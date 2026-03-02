# Step 1: Production Hardening (Implemented)

This project is now configured for secure deployment with environment variables and profile-based config.

## What was changed

1. JWT secret moved to env var (`JWT_SECRET`) instead of hardcoded key.
2. Token expiry moved to env var (`JWT_EXPIRATION_MS`).
3. CORS is now configurable using `APP_CORS_ALLOWED_ORIGINS`.
4. Config split by profile:
   - `application-dev.yaml` -> local H2
   - `application-prod.yaml` -> PostgreSQL via env vars
5. Default profile is `dev`, so local development remains easy.

## Files changed

- `src/main/resources/application.yaml`
- `src/main/resources/application-dev.yaml`
- `src/main/resources/application-prod.yaml`
- `src/main/java/com/mybill/billing/security/JwtService.java`
- `src/main/java/com/mybill/billing/security/SecurityConfig.java`
- `deploy.env.example`

## How to use in production

1. Set environment variable:
   - `SPRING_PROFILES_ACTIVE=prod`
2. Set Postgres connection variables:
   - `SPRING_DATASOURCE_URL`
   - `SPRING_DATASOURCE_USERNAME`
   - `SPRING_DATASOURCE_PASSWORD`
3. Set JWT variables:
   - `JWT_SECRET`
   - `JWT_EXPIRATION_MS`
4. Set CORS allowlist:
   - `APP_CORS_ALLOWED_ORIGINS=https://your-frontend-domain`
5. Start app normally; Spring will load `application-prod.yaml`.

For quick copy, use values from `deploy.env.example`.
