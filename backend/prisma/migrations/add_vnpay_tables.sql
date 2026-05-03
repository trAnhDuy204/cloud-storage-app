-- Thêm cột vnpay vào bảng Subscription
ALTER TABLE "Subscription" 
ADD COLUMN "vnpay_transaction_id" TEXT,
ADD COLUMN "payment_method" TEXT DEFAULT 'stripe';

-- bảng Payment
CREATE TABLE "Payment" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "organization_id" UUID NOT NULL,
    "subscription_id" UUID,
    "order_id" TEXT NOT NULL UNIQUE,
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

-- Index để query nhanh
CREATE INDEX "Payment_order_id_idx" ON "Payment"("order_id");
CREATE INDEX "Payment_organization_id_idx" ON "Payment"("organization_id");
CREATE INDEX "Payment_status_idx" ON "Payment"("status");
CREATE INDEX "Payment_vnpay_transaction_id_idx" ON "Payment"("vnpay_transaction_id");

-- Foreign keys
ALTER TABLE "Payment" 
ADD CONSTRAINT "Payment_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE,
ADD CONSTRAINT "Payment_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "Subscription"("id") ON DELETE SET NULL;