-- Better Auth's PostgreSQL adapter uses its documented camelCase field names
-- when no custom field mapping is configured. Rename the columns created by
-- 009 without changing data or the application-facing table boundaries.
ALTER TABLE auth_users RENAME COLUMN email_verified TO "emailVerified";
ALTER TABLE auth_users RENAME COLUMN display_username TO "displayUsername";
ALTER TABLE auth_users RENAME COLUMN created_at TO "createdAt";
ALTER TABLE auth_users RENAME COLUMN updated_at TO "updatedAt";

ALTER TABLE auth_sessions RENAME COLUMN expires_at TO "expiresAt";
ALTER TABLE auth_sessions RENAME COLUMN created_at TO "createdAt";
ALTER TABLE auth_sessions RENAME COLUMN updated_at TO "updatedAt";
ALTER TABLE auth_sessions RENAME COLUMN ip_address TO "ipAddress";
ALTER TABLE auth_sessions RENAME COLUMN user_agent TO "userAgent";
ALTER TABLE auth_sessions RENAME COLUMN user_id TO "userId";

ALTER TABLE auth_accounts RENAME COLUMN account_id TO "accountId";
ALTER TABLE auth_accounts RENAME COLUMN provider_id TO "providerId";
ALTER TABLE auth_accounts RENAME COLUMN user_id TO "userId";
ALTER TABLE auth_accounts RENAME COLUMN access_token TO "accessToken";
ALTER TABLE auth_accounts RENAME COLUMN refresh_token TO "refreshToken";
ALTER TABLE auth_accounts RENAME COLUMN id_token TO "idToken";
ALTER TABLE auth_accounts RENAME COLUMN access_token_expires_at TO "accessTokenExpiresAt";
ALTER TABLE auth_accounts RENAME COLUMN refresh_token_expires_at TO "refreshTokenExpiresAt";
ALTER TABLE auth_accounts RENAME COLUMN created_at TO "createdAt";
ALTER TABLE auth_accounts RENAME COLUMN updated_at TO "updatedAt";

ALTER TABLE auth_verifications RENAME COLUMN expires_at TO "expiresAt";
ALTER TABLE auth_verifications RENAME COLUMN created_at TO "createdAt";
ALTER TABLE auth_verifications RENAME COLUMN updated_at TO "updatedAt";
