const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const { updateUsageStats } = require('./statistics');

const prisma = new PrismaClient();

function setupStatisticsCronJobs() {
  // Chạy mỗi ngày lúc 00:00 để tổng hợp thống kê ngày hôm trước
  cron.schedule('0 0 * * *', async () => {
    console.log('Running daily statistics aggregation...');

    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await prisma.$executeRaw`SELECT aggregate_daily_statistics(${yesterday}::DATE)`;

      console.log('Daily statistics aggregation completed');
    } catch (error) {
      console.error('Error in daily statistics aggregation:', error);
    }
  });

  // Update usage stats mỗi giờ
  cron.schedule('0 * * * *', async () => {
    console.log('Updating usage statistics...');

    try {
      const organizations = await prisma.organization.findMany({
        select: { id: true }
      });

      for (const org of organizations) {
        await updateUsageStats(org.id);
      }

      console.log('Usage statistics updated');
    } catch (error) {
      console.error('Error updating usage statistics:', error);
    }
  });
}

module.exports = { setupStatisticsCronJobs };
