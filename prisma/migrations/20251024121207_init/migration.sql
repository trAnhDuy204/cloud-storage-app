CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateTable
CREATE TABLE "Plan" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "price_usd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "storage_limit_gb" INTEGER NOT NULL DEFAULT 10,
    "max_users" INTEGER NOT NULL DEFAULT 5,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "storage_limit_gb" INTEGER NOT NULL DEFAULT 10,
    "plan_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password_hash" TEXT,
    "organization_id" UUID,
    "role" TEXT NOT NULL DEFAULT 'member',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Folder" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "parent_id" UUID,
    "owner_id" UUID,
    "organization_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Folder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "folder_id" UUID NOT NULL,
    "owner_id" UUID,
    "size_bytes" BIGINT DEFAULT 0,
    "s3_key" TEXT NOT NULL,
    "mime_type" TEXT,
    "checksum" TEXT,
    "version_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileVersion" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "file_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "s3_key" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploaded_by" UUID,
    "size_bytes" BIGINT,
    "checksum" TEXT,
    "mimeType" TEXT,

    CONSTRAINT "FileVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Share" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "file_id" UUID NOT NULL,
    "shared_by" UUID,
    "shared_with_user" UUID,
    "shared_with_email" TEXT,
    "link_token" TEXT,
    "permission" TEXT NOT NULL DEFAULT 'view',
    "password_hash" TEXT,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Share_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "organization_id" UUID NOT NULL,
    "plan_id" UUID,
    "stripe_subscription_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "subscription_id" UUID NOT NULL,
    "stripe_invoice_id" TEXT,
    "amount_usd" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_at" TIMESTAMP(3),
    "raw_payload" JSONB,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageStat" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "organization_id" UUID NOT NULL,
    "total_storage_bytes" BIGINT NOT NULL DEFAULT 0,
    "file_count" BIGINT NOT NULL DEFAULT 0,
    "last_updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID,
    "action" TEXT NOT NULL,
    "target_id" UUID,
    "targetType" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "details" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_name_key" ON "Organization"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "idx_folder_parent" ON "Folder"("parent_id");

-- CreateIndex
CREATE INDEX "idx_folder_org" ON "Folder"("organization_id");

-- CreateIndex
CREATE INDEX "idx_file_folder" ON "File"("folder_id");

-- CreateIndex
CREATE INDEX "idx_file_owner" ON "File"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "File_folder_id_name_key" ON "File"("folder_id", "name");

-- CreateIndex
CREATE INDEX "idx_file_version_file" ON "FileVersion"("file_id");

-- CreateIndex
CREATE UNIQUE INDEX "FileVersion_file_id_version_number_key" ON "FileVersion"("file_id", "version_number");

-- CreateIndex
CREATE UNIQUE INDEX "Share_link_token_key" ON "Share"("link_token");

-- CreateIndex
CREATE INDEX "idx_share_file" ON "Share"("file_id");

-- CreateIndex
CREATE INDEX "idx_share_user" ON "Share"("shared_with_user");

-- CreateIndex
CREATE INDEX "idx_sub_org" ON "Subscription"("organization_id");

-- CreateIndex
CREATE INDEX "idx_sub_stripe" ON "Subscription"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "idx_invoice_sub" ON "Invoice"("subscription_id");

-- CreateIndex
CREATE INDEX "idx_invoice_stripe" ON "Invoice"("stripe_invoice_id");

-- CreateIndex
CREATE UNIQUE INDEX "UsageStat_organization_id_key" ON "UsageStat"("organization_id");

-- CreateIndex
CREATE INDEX "idx_audit_user" ON "AuditLog"("user_id");

-- CreateIndex
CREATE INDEX "idx_audit_target" ON "AuditLog"("targetType", "target_id");

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "Folder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileVersion" ADD CONSTRAINT "FileVersion_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileVersion" ADD CONSTRAINT "FileVersion_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Share" ADD CONSTRAINT "Share_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Share" ADD CONSTRAINT "Share_shared_by_fkey" FOREIGN KEY ("shared_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Share" ADD CONSTRAINT "Share_shared_with_user_fkey" FOREIGN KEY ("shared_with_user") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageStat" ADD CONSTRAINT "UsageStat_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- TRIGGERS
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_users
BEFORE UPDATE ON "User"
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_update_files
BEFORE UPDATE ON "File"
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_update_orgs
BEFORE UPDATE ON "Organization"
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- INITIAL DATA
INSERT INTO "Plan" (name, price_usd, storage_limit_gb, max_users)
VALUES
('Free', 0, 1, 1),
('Normal',4.99,100,3),
('Pro', 19.99, 250, 5),
('Enterprise', 49.99, 1000, 10);