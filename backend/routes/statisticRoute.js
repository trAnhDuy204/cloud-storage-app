const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Ensure safe convert BigInt → Number and prevent null values
function toNumber(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === "bigint") return Number(value);
  return value;
}

function safeDivide(value, divider) {
  const num = toNumber(value);
  return num === 0 ? 0 : num / divider;
}


// GET /api/organizations/:organizationId/statistics
router.get('/api/organizations/:organizationId/statistics', async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { range , startDate, endDate } = req.query;

    if (!organizationId) {
      return res.status(400).json({ success: false, error: 'Organization ID is required' });
    }

    // Kiểm tra tổ chức có tồn tại không
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId }
    });

    if (!organization) {
      return res.status(404).json({ success: false, error: 'Organization not found' });
    }

    // Tính toán ngày
    let fromDate;
    let toDate = new Date();

    if (range === 'custom' && startDate && endDate) {
      fromDate = new Date(startDate);
      toDate = new Date(endDate);
    } else {
      const days = range === '7days' ? 7 : range === '30days' ? 30 : 365;
      fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);
    }

    // Lấy thống kê
    const stats = await prisma.dailyStatistic.findMany({
      where: {
        organizationId,
        date: { gte: fromDate, lte: toDate }
      },
      orderBy: { date: 'asc' }
    });

    // Transform output
    const activeUsers = stats.map(s => ({
      date: s.date.toISOString().split('T')[0],
      activeUsers: toNumber(s.activeUsers) || 0
    }));

    const storageUsage = stats.map(s => ({
        date: s.date.toISOString().split('T')[0],
        storage: Number(safeDivide(s.totalStorageBytes, 1024 ** 3).toFixed(2)) || 0
    }));

    const fileCount = stats.map(s => ({
      date: s.date.toISOString().split('T')[0],
      count: toNumber(s.fileCount) || 0
    }));

    const traffic = stats.map(s => ({
      date: s.date.toISOString().split('T')[0],
      traffic: Number(safeDivide(s.trafficBytes, 1024 ** 2).toFixed(2)) || 0
    }));

    res.json({
      success: true,
      data: {
        activeUsers,
        storageUsage,
        fileCount,
        traffic,
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to fetch statistics' });
  }
});

module.exports = router;
