-- Tokens de uso único passam a ser armazenados apenas como hash.
-- Os valores em texto puro emitidos antes desta migração deixam de ser utilizáveis.
DELETE FROM "password_reset_tokens";
DELETE FROM "email_verification_tokens";
DELETE FROM "email_change_tokens";

ALTER TABLE "password_reset_tokens" RENAME COLUMN "token" TO "token_hash";
ALTER INDEX "password_reset_tokens_token_key" RENAME TO "password_reset_tokens_token_hash_key";

ALTER TABLE "email_verification_tokens" RENAME COLUMN "token" TO "token_hash";
ALTER INDEX "email_verification_tokens_token_key" RENAME TO "email_verification_tokens_token_hash_key";

ALTER TABLE "email_change_tokens" RENAME COLUMN "token" TO "token_hash";
ALTER INDEX "email_change_tokens_token_key" RENAME TO "email_change_tokens_token_hash_key";

CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");
