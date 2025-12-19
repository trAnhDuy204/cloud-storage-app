const prisma = require('../lib/prisma');

async function trackUserActivity(
  userId,
  organizationId,
  activityType = 'login',
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


/*
  
TODO: thêm vào chỗ upload, dowload file
import { trackTraffic, updateUsageStats } from '@/lib/statistics';

// After successful upload
await trackTraffic(
  organizationId, 
  'upload', 
  file.size, 
  userId, 
  fileId
);

// Update usage stats
await updateUsageStats(organizationId);

//after dowload file
await trackTraffic(
  organizationId, 
  'download', 
  file.sizeBytes, 
  userId, 
  fileId
);

// Example usage in file upload/download handlers:
// 
// File: pages/api/files/upload.ts
// import { trackTraffic, updateUsageStats } from '@/lib/statistics';
// 
// After successful upload:
// await trackTraffic(organizationId, 'upload', file.size, userId, fileId);
// await updateUsageStats(organizationId);
//
// File: pages/api/auth/login.ts  
// import { trackUserActivity } from '@/lib/statistics';
//
// After successful login:
// await trackUserActivity(user.id, user.organizationId, 'login', req.headers['x-forwarded-for'], req.headers['user-agent']);
*/