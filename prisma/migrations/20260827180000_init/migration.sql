-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" TEXT NOT NULL,
    "name" VARCHAR(255),
    "username" VARCHAR(50),
    "username_changed_at" TIMESTAMPTZ(6),
    "birth_date" DATE,
    "age_verified" BOOLEAN NOT NULL DEFAULT false,
    "age_verified_at" TIMESTAMPTZ(6),
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_verified_at" TIMESTAMPTZ(6),
    "terms_accepted" BOOLEAN NOT NULL DEFAULT false,
    "terms_accepted_at" TIMESTAMPTZ(6),
    "social_provider" VARCHAR(50),
    "social_provider_id" VARCHAR(255),
    "google_id" VARCHAR(255),
    "email_notifications" BOOLEAN NOT NULL DEFAULT true,
    "avatar_url" TEXT,
    "bio" TEXT,
    "author_verified" BOOLEAN NOT NULL DEFAULT false,
    "author_founder" BOOLEAN NOT NULL DEFAULT false,
    "founder_request_status" VARCHAR(20),
    "founder_requested_at" TIMESTAMPTZ(6),
    "founder_granted_at" TIMESTAMPTZ(6),
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "suspended_at" TIMESTAMPTZ(6),
    "is_test" BOOLEAN NOT NULL DEFAULT false,
    "tour_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token" VARCHAR(128) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_change_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "pending_email" VARCHAR(255) NOT NULL,
    "token" VARCHAR(128) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_change_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verification_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token" VARCHAR(128) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fanfics" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "synopsis" TEXT,
    "content" TEXT,
    "category" VARCHAR(100),
    "category_id" UUID,
    "author_name" VARCHAR(255),
    "author_id" UUID,
    "language" VARCHAR(50) NOT NULL DEFAULT 'PT',
    "original_language" VARCHAR(10),
    "translation_of_story_id" UUID,
    "status" VARCHAR(20) NOT NULL DEFAULT 'EM_ANDAMENTO',
    "age_rating" VARCHAR(10) NOT NULL DEFAULT 'LIVRE',
    "archive_warnings" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "copyright_status" VARCHAR(100) NOT NULL DEFAULT 'Todos os direitos reservados',
    "cover_url" TEXT,
    "main_tag" VARCHAR(80),
    "featured_original" BOOLEAN NOT NULL DEFAULT false,
    "views" INTEGER NOT NULL DEFAULT 0,
    "views_count" INTEGER NOT NULL DEFAULT 0,
    "effective_views" INTEGER NOT NULL DEFAULT 0,
    "followers_count" INTEGER NOT NULL DEFAULT 0,
    "chapters_count" INTEGER NOT NULL DEFAULT 0,
    "votes_count" INTEGER NOT NULL DEFAULT 0,
    "library_count" INTEGER NOT NULL DEFAULT 0,
    "comments_count" INTEGER NOT NULL DEFAULT 0,
    "ratings_count" INTEGER NOT NULL DEFAULT 0,
    "rating_average" DECIMAL(4,2) NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "hidden_at" TIMESTAMPTZ(6),
    "hidden_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fanfics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_coauthors" (
    "id" UUID NOT NULL,
    "story_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "story_coauthors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_team_messages" (
    "id" UUID NOT NULL,
    "story_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "story_team_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_team_notes" (
    "id" UUID NOT NULL,
    "story_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "story_team_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_view_daily" (
    "id" UUID NOT NULL,
    "story_id" UUID NOT NULL,
    "day" DATE NOT NULL,
    "views_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "story_view_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trending_exposures" (
    "id" UUID NOT NULL,
    "story_id" UUID NOT NULL,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ(6),
    "position" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "snapshot_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trending_exposures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chapters" (
    "id" UUID NOT NULL,
    "story_id" UUID NOT NULL,
    "chapter_number" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "author_note_before" TEXT,
    "author_note_after" TEXT,
    "show_author_note_before" BOOLEAN NOT NULL DEFAULT false,
    "show_author_note_after" BOOLEAN NOT NULL DEFAULT false,
    "views_count" INTEGER NOT NULL DEFAULT 0,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "published_at" TIMESTAMPTZ(6),
    "comments_count" INTEGER NOT NULL DEFAULT 0,
    "votes_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "type" VARCHAR(50) NOT NULL DEFAULT 'trope',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_tags" (
    "story_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "story_tags_pkey" PRIMARY KEY ("story_id","tag_id")
);

-- CreateTable
CREATE TABLE "user_library" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "story_id" UUID NOT NULL,
    "added_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_library_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_reading_progress" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "story_id" UUID NOT NULL,
    "current_chapter" INTEGER NOT NULL DEFAULT 0,
    "total_chapters" INTEGER NOT NULL DEFAULT 0,
    "progress_percent" INTEGER NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMPTZ(6),
    "last_read_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_reading_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_ratings" (
    "id" UUID NOT NULL,
    "story_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "rating" SMALLINT NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "story_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reading_lists" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reading_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reading_list_stories" (
    "id" UUID NOT NULL,
    "reading_list_id" UUID NOT NULL,
    "story_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reading_list_stories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "author_followers" (
    "id" UUID NOT NULL,
    "follower_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "author_followers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "link" VARCHAR(255),
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "group_key" VARCHAR(255),
    "group_count" INTEGER NOT NULL DEFAULT 1,
    "actor_ids" JSONB NOT NULL DEFAULT '[]',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(128) NOT NULL,
    "replaced_by_token_hash" VARCHAR(128),
    "revoked_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMPTZ(6),
    "user_agent" TEXT,
    "ip_address" VARCHAR(64),

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_social_accounts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provider" VARCHAR(20) NOT NULL,
    "provider_user_id" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_social_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "author_conversation_posts" (
    "id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "parent_id" UUID,
    "body" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "author_conversation_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chapter_comments" (
    "id" UUID NOT NULL,
    "chapter_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "parent_id" UUID,
    "content" TEXT NOT NULL,
    "language" VARCHAR(10),
    "likes_count" INTEGER NOT NULL DEFAULT 0,
    "reports_count" INTEGER NOT NULL DEFAULT 0,
    "is_test" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "chapter_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment_likes" (
    "id" UUID NOT NULL,
    "comment_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "is_test" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chapter_votes" (
    "id" UUID NOT NULL,
    "chapter_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chapter_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment_reports" (
    "id" UUID NOT NULL,
    "comment_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "reason" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "resolved_at" TIMESTAMPTZ(6),
    "resolved_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paragraph_comments" (
    "id" UUID NOT NULL,
    "chapter_id" UUID NOT NULL,
    "paragraph_id" VARCHAR(64) NOT NULL,
    "user_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "paragraph_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paragraph_comment_reactions" (
    "id" UUID NOT NULL,
    "comment_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paragraph_comment_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_reports" (
    "id" UUID NOT NULL,
    "story_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "reason" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "resolved_at" TIMESTAMPTZ(6),
    "resolved_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "story_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_reports" (
    "id" UUID NOT NULL,
    "reported_user_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "reason" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "resolved_at" TIMESTAMPTZ(6),
    "resolved_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_audit_logs" (
    "id" UUID NOT NULL,
    "admin_id" UUID,
    "action" VARCHAR(120) NOT NULL,
    "details" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donations" (
    "id" UUID NOT NULL,
    "provider" VARCHAR(40) NOT NULL DEFAULT 'mercadopago',
    "provider_payment_id" VARCHAR(64) NOT NULL,
    "status" VARCHAR(40) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(8) NOT NULL DEFAULT 'BRL',
    "payment_method" VARCHAR(40),
    "payer_email" VARCHAR(255),
    "description" VARCHAR(500),
    "paid_at" TIMESTAMPTZ(6),
    "raw_payload" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "donations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schema_migrations" (
    "filename" TEXT NOT NULL,
    "applied_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schema_migrations_pkey" PRIMARY KEY ("filename")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_google_id_idx" ON "users"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_user_id_key" ON "password_reset_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "email_change_tokens_user_id_key" ON "email_change_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "email_change_tokens_token_key" ON "email_change_tokens"("token");

-- CreateIndex
CREATE INDEX "email_change_tokens_user_id_idx" ON "email_change_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_token_key" ON "email_verification_tokens"("token");

-- CreateIndex
CREATE INDEX "email_verification_tokens_user_id_idx" ON "email_verification_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_user_id_key" ON "email_verification_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE INDEX "fanfics_author_id_idx" ON "fanfics"("author_id");

-- CreateIndex
CREATE INDEX "fanfics_created_at_idx" ON "fanfics"("created_at" DESC);

-- CreateIndex
CREATE INDEX "fanfics_category_created_at_idx" ON "fanfics"("category", "created_at" DESC);

-- CreateIndex
CREATE INDEX "fanfics_category_id_idx" ON "fanfics"("category_id");

-- CreateIndex
CREATE INDEX "fanfics_status_created_at_idx" ON "fanfics"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "fanfics_translation_of_story_id_idx" ON "fanfics"("translation_of_story_id");

-- CreateIndex
CREATE INDEX "fanfics_deleted_at_idx" ON "fanfics"("deleted_at");

-- CreateIndex
CREATE INDEX "fanfics_hidden_at_idx" ON "fanfics"("hidden_at");

-- CreateIndex
CREATE INDEX "fanfics_effective_views_idx" ON "fanfics"("effective_views" DESC);

-- CreateIndex
CREATE INDEX "fanfics_chapters_count_idx" ON "fanfics"("chapters_count" DESC);

-- CreateIndex
CREATE INDEX "fanfics_votes_count_idx" ON "fanfics"("votes_count" DESC);

-- CreateIndex
CREATE INDEX "fanfics_library_count_idx" ON "fanfics"("library_count" DESC);

-- CreateIndex
CREATE INDEX "fanfics_comments_count_idx" ON "fanfics"("comments_count" DESC);

-- CreateIndex
CREATE INDEX "fanfics_updated_at_idx" ON "fanfics"("updated_at" DESC);

-- CreateIndex
CREATE INDEX "story_coauthors_story_id_status_idx" ON "story_coauthors"("story_id", "status");

-- CreateIndex
CREATE INDEX "story_coauthors_user_id_status_idx" ON "story_coauthors"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "story_coauthors_story_id_user_id_key" ON "story_coauthors"("story_id", "user_id");

-- CreateIndex
CREATE INDEX "story_team_messages_story_id_created_at_idx" ON "story_team_messages"("story_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "story_team_notes_story_id_resolved_pinned_created_at_idx" ON "story_team_notes"("story_id", "resolved", "pinned", "created_at" DESC);

-- CreateIndex
CREATE INDEX "story_view_daily_day_views_count_idx" ON "story_view_daily"("day", "views_count" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "story_view_daily_story_id_day_key" ON "story_view_daily"("story_id", "day");

-- CreateIndex
CREATE INDEX "trending_exposures_story_id_started_at_idx" ON "trending_exposures"("story_id", "started_at" DESC);

-- CreateIndex
CREATE INDEX "trending_exposures_ended_at_idx" ON "trending_exposures"("ended_at");

-- CreateIndex
CREATE INDEX "chapters_published_at_idx" ON "chapters"("published_at");

-- CreateIndex
CREATE UNIQUE INDEX "chapters_story_id_chapter_number_key" ON "chapters"("story_id", "chapter_number");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slug_key" ON "tags"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "user_library_user_id_story_id_key" ON "user_library"("user_id", "story_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_reading_progress_user_id_story_id_key" ON "user_reading_progress"("user_id", "story_id");

-- CreateIndex
CREATE UNIQUE INDEX "story_ratings_story_id_user_id_key" ON "story_ratings"("story_id", "user_id");

-- CreateIndex
CREATE INDEX "reading_lists_user_id_idx" ON "reading_lists"("user_id");

-- CreateIndex
CREATE INDEX "reading_list_stories_story_id_idx" ON "reading_list_stories"("story_id");

-- CreateIndex
CREATE UNIQUE INDEX "reading_list_stories_reading_list_id_story_id_key" ON "reading_list_stories"("reading_list_id", "story_id");

-- CreateIndex
CREATE UNIQUE INDEX "author_followers_follower_id_author_id_key" ON "author_followers"("follower_id", "author_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "user_social_accounts_provider_provider_user_id_key" ON "user_social_accounts"("provider", "provider_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_social_accounts_user_id_provider_key" ON "user_social_accounts"("user_id", "provider");

-- CreateIndex
CREATE INDEX "author_conversation_posts_author_id_created_at_idx" ON "author_conversation_posts"("author_id", "created_at");

-- CreateIndex
CREATE INDEX "author_conversation_posts_author_id_pinned_created_at_idx" ON "author_conversation_posts"("author_id", "pinned", "created_at");

-- CreateIndex
CREATE INDEX "author_conversation_posts_parent_id_idx" ON "author_conversation_posts"("parent_id");

-- CreateIndex
CREATE INDEX "chapter_comments_created_at_idx" ON "chapter_comments"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "comment_likes_comment_id_user_id_key" ON "comment_likes"("comment_id", "user_id");

-- CreateIndex
CREATE INDEX "chapter_votes_user_id_idx" ON "chapter_votes"("user_id");

-- CreateIndex
CREATE INDEX "chapter_votes_created_at_idx" ON "chapter_votes"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "chapter_votes_chapter_id_user_id_key" ON "chapter_votes"("chapter_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "comment_reports_comment_id_user_id_key" ON "comment_reports"("comment_id", "user_id");

-- CreateIndex
CREATE INDEX "paragraph_comments_chapter_id_paragraph_id_idx" ON "paragraph_comments"("chapter_id", "paragraph_id");

-- CreateIndex
CREATE INDEX "paragraph_comments_chapter_id_paragraph_id_deleted_at_idx" ON "paragraph_comments"("chapter_id", "paragraph_id", "deleted_at");

-- CreateIndex
CREATE INDEX "paragraph_comment_reactions_comment_id_idx" ON "paragraph_comment_reactions"("comment_id");

-- CreateIndex
CREATE UNIQUE INDEX "paragraph_comment_reactions_comment_id_user_id_key" ON "paragraph_comment_reactions"("comment_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "story_reports_story_id_user_id_key" ON "story_reports"("story_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_reports_reported_user_id_user_id_key" ON "user_reports"("reported_user_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "donations_provider_payment_id_key" ON "donations"("provider_payment_id");

-- CreateIndex
CREATE INDEX "donations_status_paid_at_idx" ON "donations"("status", "paid_at");

-- CreateIndex
CREATE INDEX "donations_provider_status_idx" ON "donations"("provider", "status");

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_change_tokens" ADD CONSTRAINT "email_change_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fanfics" ADD CONSTRAINT "fanfics_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fanfics" ADD CONSTRAINT "fanfics_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fanfics" ADD CONSTRAINT "fanfics_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fanfics" ADD CONSTRAINT "fanfics_hidden_by_fkey" FOREIGN KEY ("hidden_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fanfics" ADD CONSTRAINT "fanfics_translation_of_story_id_fkey" FOREIGN KEY ("translation_of_story_id") REFERENCES "fanfics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_coauthors" ADD CONSTRAINT "story_coauthors_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "fanfics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_coauthors" ADD CONSTRAINT "story_coauthors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_team_messages" ADD CONSTRAINT "story_team_messages_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "fanfics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_team_messages" ADD CONSTRAINT "story_team_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_team_notes" ADD CONSTRAINT "story_team_notes_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "fanfics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_team_notes" ADD CONSTRAINT "story_team_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_view_daily" ADD CONSTRAINT "story_view_daily_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "fanfics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trending_exposures" ADD CONSTRAINT "trending_exposures_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "fanfics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "fanfics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_tags" ADD CONSTRAINT "story_tags_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "fanfics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_tags" ADD CONSTRAINT "story_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_library" ADD CONSTRAINT "user_library_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_library" ADD CONSTRAINT "user_library_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "fanfics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_reading_progress" ADD CONSTRAINT "user_reading_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_reading_progress" ADD CONSTRAINT "user_reading_progress_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "fanfics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_ratings" ADD CONSTRAINT "story_ratings_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "fanfics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_ratings" ADD CONSTRAINT "story_ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_lists" ADD CONSTRAINT "reading_lists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_list_stories" ADD CONSTRAINT "reading_list_stories_reading_list_id_fkey" FOREIGN KEY ("reading_list_id") REFERENCES "reading_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_list_stories" ADD CONSTRAINT "reading_list_stories_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "fanfics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "author_followers" ADD CONSTRAINT "author_followers_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "author_followers" ADD CONSTRAINT "author_followers_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_social_accounts" ADD CONSTRAINT "user_social_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "author_conversation_posts" ADD CONSTRAINT "author_conversation_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "author_conversation_posts" ADD CONSTRAINT "author_conversation_posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "author_conversation_posts" ADD CONSTRAINT "author_conversation_posts_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "author_conversation_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapter_comments" ADD CONSTRAINT "chapter_comments_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapter_comments" ADD CONSTRAINT "chapter_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapter_comments" ADD CONSTRAINT "chapter_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "chapter_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "chapter_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapter_votes" ADD CONSTRAINT "chapter_votes_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapter_votes" ADD CONSTRAINT "chapter_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_reports" ADD CONSTRAINT "comment_reports_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "chapter_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_reports" ADD CONSTRAINT "comment_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paragraph_comments" ADD CONSTRAINT "paragraph_comments_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paragraph_comments" ADD CONSTRAINT "paragraph_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paragraph_comment_reactions" ADD CONSTRAINT "paragraph_comment_reactions_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "paragraph_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paragraph_comment_reactions" ADD CONSTRAINT "paragraph_comment_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_reports" ADD CONSTRAINT "story_reports_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "fanfics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_reports" ADD CONSTRAINT "story_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reported_user_id_fkey" FOREIGN KEY ("reported_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
