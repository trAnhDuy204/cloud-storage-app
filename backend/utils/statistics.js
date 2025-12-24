const prisma = require('../lib/prisma');

async function trackUserActivity(
  userId,
  organizationId,
  activityType,
  ipAddress,
  userAgent
) {
  try {
    await prisma.userActivity.create({
      data: {
        userId,
        organizationId,
        activityType,
        ipAddress,
        userAgent
      }
    });
  } catch (error) {
    console.error('Error tracking user activity:', error);
  }
}

async function trackTraffic(
  organizationId,
  operation,
  bytes,
  userId,
  fileId
) {
  try {
    await prisma.trafficLog.create({
      data: {
        organizationId,
        operation,
        bytes,
        userId,
        fileId
      }
    });
  } catch (error) {
    console.error('Error tracking traffic:', error);
  }
}

async function updateUsageStats(organizationId) {
  try {
    const users = await prisma.user.findMany({
      where: { organizationId },
      select: { id: true }
    });

    const userIds = users.map(u => u.id);

    const [storageResult, fileCountResult] = await Promise.all([
      prisma.file.aggregate({
        where: {
          ownerId: { in: userIds },
          deletedAt: null
        },
        _sum: {
          sizeBytes: true
        }
      }),
      prisma.file.count({
        where: {
          ownerId: { in: userIds },
          deletedAt: null
        }
      })
    ]);

    const totalStorageBytes = storageResult._sum.sizeBytes || 0;
    const fileCount = fileCountResult;

    await prisma.usageStat.upsert({
      where: { organizationId },
      update: {
        totalStorageBytes,
        fileCount,
        lastUpdatedAt: new Date()
      },
      create: {
        organizationId,
        totalStorageBytes,
        fileCount
      }
    });

    return { totalStorageBytes, fileCount };
  } catch (error) {
    console.error('Error updating usage stats:', error);
    throw error;
  }
}

module.exports = {
  trackUserActivity,
  trackTraffic,
  updateUsageStats
};