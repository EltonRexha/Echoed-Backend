-- CreateIndex
CREATE INDEX "user_verification_tokens_created_at_idx" ON "user_verification_tokens"("created_at");

-- CreateIndex
CREATE INDEX "user_verification_tokens_created_at_userId_idx" ON "user_verification_tokens"("created_at", "userId");

-- CreateIndex
CREATE INDEX "user_verification_tokens_expiresAt_idx" ON "user_verification_tokens"("expiresAt");
