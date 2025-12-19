const prisma = require('../lib/prisma');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { organizationId, range = '7days', startDate, endDate } = req.query;

    if (!organizationId || typeof organizationId !== 'string') {
      return res.status(400).json({ success: false, error: 'Organization ID is required' });
    }

    // Check tổ chức có tồn tại không
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId }
    });

    if (!organization) {
      return res.status(404).json({ success: false, error: 'Organization not found' });
    }

    // Tính ngày
    let fromDate;
    let toDate = new Date();

    if (range === 'custom' && startDate && endDate) {
      fromDate = new Date(startDate);
      toDate = new Date(endDate);
    } else {
      const days =
        range === '7days' ? 7 :
        range === '30days' ? 30 :
        365;

      fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);
    }

    // Lấy thống kê
    const dailyStats = await prisma.dailyStatistic.findMany({
      where: {
        organizationId: organizationId,
        date: {
          gte: fromDate,
          lte: toDate
        }
      },
      orderBy: { date: 'asc' }
    });

    // Format dữ liệu trả về
    const activeUsers = dailyStats.map(stat => ({
      date: stat.date.toISOString().split('T')[0],
      activeUsers: stat.activeUsers
    }));

    const storageUsage = dailyStats.map(stat => ({
      date: stat.date.toISOString().split('T')[0],
      storage: Number((stat.totalStorageBytes / (1024 ** 3)).toFixed(2))
    }));

    const fileCount = dailyStats.map(stat => ({
      date: stat.date.toISOString().split('T')[0],
      count: stat.fileCount
    }));

    const traffic = dailyStats.map(stat => ({
      date: stat.date.toISOString().split('T')[0],
      traffic: Number((stat.trafficBytes / (1024 ** 2)).toFixed(2))
    }));

    return res.status(200).json({
      success: true,
      data: {
        activeUsers,
        storageUsage,
        fileCount,
        traffic
      }
    });

  } catch (error) {
    console.error('Error fetching statistics:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
};
