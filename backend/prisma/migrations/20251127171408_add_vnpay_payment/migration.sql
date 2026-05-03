-- DropIndex
DROP INDEX "public"."idx_audit_target";

-- DropIndex
DROP INDEX "public"."idx_audit_user";

-- DropIndex
DROP INDEX "public"."File_folder_id_name_key";

-- DropIndex
DROP INDEX "public"."idx_file_folder";

-- DropIndex
DROP INDEX "public"."idx_file_owner";

-- DropIndex
DROP INDEX "public"."FileVersion_file_id_version_number_key";

-- DropIndex
DROP INDEX "public"."idx_file_version_file";

-- DropIndex
DROP INDEX "public"."idx_folder_org";

-- DropIndex
DROP INDEX "public"."idx_folder_parent";

-- DropIndex
DROP INDEX "public"."idx_invoice_stripe";

-- DropIndex
DROP INDEX "public"."idx_invoice_sub";

-- DropIndex
DROP INDEX "public"."Organization_name_key";

-- DropIndex
DROP INDEX "public"."Share_link_token_key";

-- DropIndex
DROP INDEX "public"."idx_share_file";

-- DropIndex
DROP INDEX "public"."idx_share_user";

-- DropIndex
DROP INDEX "public"."idx_sub_org";

-- DropIndex
DROP INDEX "public"."idx_sub_stripe";

-- DropIndex
DROP INDEX "public"."UsageStat_organization_id_key";

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "payment_method" TEXT NOT NULL DEFAULT 'stripe',
ADD COLUMN     "vnpay_transaction_id" TEXT;

-- CreateTable
CREATE TABLE "Payment" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "organization_id" UUID NOT NULL,
    "subscription_id" UUID,
    "order_id" TEXT NOT NULL,
    "payment_method" TEXT NOT NULL DEFAULT 'vnpay',
    "amount_usd" DOUBLE PRECISION NOT NULL,
    "amount_vnd" BIGINT,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "vnpay_transaction_id" TEXT,
    "vnpay_response_code" TEXT,
    "stripe_payment_intent_id" TEXT,
    "description" TEXT,
    "ip_address" TEXT,
    "return_url" TEXT,
    "raw_response" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_order_id_key" ON "Payment"("order_id");

-- CreateIndex
CREATE INDEX "Payment_order_id_idx" ON "Payment"("order_id");

-- CreateIndex
CREATE INDEX "Payment_organization_id_idx" ON "Payment"("organization_id");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_vnpay_transaction_id_idx" ON "Payment"("vnpay_transaction_id");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
