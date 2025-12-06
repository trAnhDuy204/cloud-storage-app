const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { organizationId } = req.query;
    const { date } = req.body;

    if (!organizationId || typeof organizationId !== 'string') {
      return res.status(400).json({ success: false, error: 'Organization ID is required' });
    }

    const targetDate = date ? new Date(date) : new Date();

    // Call stored procedure
    await prisma.$executeRaw`SELECT aggregate_daily_statistics(${targetDate}::DATE)`;

    return res.status(200).json({
      success: true,
      message: 'Statistics aggregated successfully'
    });

  } catch (error) {
    console.error('Error aggregating statistics:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to aggregate statistics'
    });
  }
};
