-- AlterTable
ALTER TABLE "Organization" ALTER COLUMN "storage_limit_gb" SET DEFAULT 10;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "plan_id" UUID;

-- AlterTable
ALTER TABLE "Plan" ALTER COLUMN "storage_limit_gb" SET DEFAULT 10,
ALTER COLUMN "max_users" SET DEFAULT 5;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
