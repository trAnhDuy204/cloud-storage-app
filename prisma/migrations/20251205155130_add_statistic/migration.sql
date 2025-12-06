-- CreateTable
CREATE TABLE "DailyStatistic" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "organization_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "active_users" INTEGER NOT NULL DEFAULT 0,
    "total_storage_bytes" BIGINT NOT NULL DEFAULT 0,
    "file_count" INTEGER NOT NULL DEFAULT 0,
    "traffic_bytes" BIGINT NOT NULL DEFAULT 0,
    "new_files" INTEGER NOT NULL DEFAULT 0,
    "deleted_files" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyStatistic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserActivity" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "activity_type" TEXT NOT NULL DEFAULT 'login',
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrafficLog" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "organization_id" UUID NOT NULL,
    "user_id" UUID,
    "file_id" UUID,
    "operation" TEXT NOT NULL,
    "bytes" BIGINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrafficLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyStatistic_organization_id_idx" ON "DailyStatistic"("organization_id");

-- CreateIndex
CREATE INDEX "DailyStatistic_date_idx" ON "DailyStatistic"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyStatistic_organization_id_date_key" ON "DailyStatistic"("organization_id", "date");

-- CreateIndex
CREATE INDEX "UserActivity_user_id_idx" ON "UserActivity"("user_id");

-- CreateIndex
CREATE INDEX "UserActivity_organization_id_idx" ON "UserActivity"("organization_id");

-- CreateIndex
CREATE INDEX "UserActivity_created_at_idx" ON "UserActivity"("created_at");

-- CreateIndex
CREATE INDEX "TrafficLog_organization_id_idx" ON "TrafficLog"("organization_id");

-- CreateIndex
CREATE INDEX "TrafficLog_created_at_idx" ON "TrafficLog"("created_at");

-- CreateIndex
CREATE INDEX "TrafficLog_user_id_idx" ON "TrafficLog"("user_id");

-- AddForeignKey
ALTER TABLE "DailyStatistic" ADD CONSTRAINT "DailyStatistic_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserActivity" ADD CONSTRAINT "UserActivity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserActivity" ADD CONSTRAINT "UserActivity_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrafficLog" ADD CONSTRAINT "TrafficLog_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrafficLog" ADD CONSTRAINT "TrafficLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrafficLog" ADD CONSTRAINT "TrafficLog_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add trigger for updated_at
CREATE TRIGGER trg_update_daily_stats
BEFORE UPDATE ON "DailyStatistic"
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Function to aggregate daily statistics
-- Chạy function này mỗi ngày bằng cron job
CREATE OR REPLACE FUNCTION aggregate_daily_statistics(target_date DATE DEFAULT CURRENT_DATE)
RETURNS void AS $$
DECLARE
    org_record RECORD;
BEGIN
    FOR org_record IN SELECT id FROM "Organization" LOOP
        INSERT INTO "DailyStatistic" (
            organization_id,
            date,
            active_users,
            total_storage_bytes,
            file_count,
            traffic_bytes,
            new_files,
            deleted_files
        )
        SELECT
            org_record.id,
            target_date,
            --tính tổng số user đăng nhập trong ngày
            (SELECT COUNT(DISTINCT user_id) 
             FROM "UserActivity" 
             WHERE organization_id = org_record.id 
             AND DATE(created_at) = target_date),
            -- Tổng dung lượng lưu trữ từ UsageStat
            COALESCE((SELECT total_storage_bytes 
                      FROM "UsageStat" 
                      WHERE organization_id = org_record.id), 0),
            -- Tổng số file từ UsageStat
            COALESCE((SELECT file_count 
                      FROM "UsageStat" 
                      WHERE organization_id = org_record.id), 0),
            -- Tổng băng thông sử dụng trong ngày
            COALESCE((SELECT SUM(bytes) 
                      FROM "TrafficLog" 
                      WHERE organization_id = org_record.id 
                      AND DATE(created_at) = target_date), 0),
            --Số file được tạo trong ngày
            (SELECT COUNT(*) 
             FROM "File" 
             WHERE owner_id IN (SELECT id FROM "User" WHERE organization_id = org_record.id)
             AND DATE(created_at) = target_date
             AND deleted_at IS NULL),
            --Số file bị xóa trong ngày
            (SELECT COUNT(*) 
             FROM "File" 
             WHERE owner_id IN (SELECT id FROM "User" WHERE organization_id = org_record.id)
             AND DATE(deleted_at) = target_date)
        ON CONFLICT (organization_id, date) 
        DO UPDATE SET
            active_users = EXCLUDED.active_users,
            total_storage_bytes = EXCLUDED.total_storage_bytes,
            file_count = EXCLUDED.file_count,
            traffic_bytes = EXCLUDED.traffic_bytes,
            new_files = EXCLUDED.new_files,
            deleted_files = EXCLUDED.deleted_files,
            updated_at = NOW();
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Backfill historical data (chạy một lần để tạo dữ liệu cho 30 ngày qua)
DO $$
DECLARE
    day_offset INTEGER;
BEGIN
    FOR day_offset IN 0..30 LOOP
        PERFORM aggregate_daily_statistics(CURRENT_DATE - day_offset);
    END LOOP;
END $$;