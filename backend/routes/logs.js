const express = require("express");
const authMiddleware = require("../utils/auth.middleware");
const prisma = require("../lib/prisma");

const router = express.Router();

// GET TRAFFIC LOGS
router.get(
  "/api/logs/traffic",
  authMiddleware,
  async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 50, 
        operation,
        userId,
        startDate,
        endDate 
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Build where clause
      const where = {
        organizationId: req.user.organizationId
      };

      if (operation && operation !== 'all') {
        where.operation = operation;
      }

      if (userId) {
        where.userId = userId;
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
          where.createdAt.lte = new Date(endDate);
        }
      }

      // Get logs with pagination
      const [logs, total] = await Promise.all([
        prisma.trafficLog.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            file: {
              select: {
                id: true,
                name: true,
                mimeType: true
              }
            }
          }
        }),
        prisma.trafficLog.count({ where })
      ]);

      // Transform data
      const transformedLogs = logs.map(log => ({
        id: log.id,
        operation: log.operation,
        bytes: log.bytes,
        size: formatBytes(Number(log.bytes)),
        createdAt: log.createdAt,
        user: log.user ? {
          id: log.user.id,
          name: log.user.name,
          email: log.user.email
        } : null,
        file: log.file ? {
          id: log.file.id,
          name: log.file.name,
          mimeType: log.file.mimeType
        } : null
      }));

      return res.json({
        success: true,
        data: {
          logs: transformedLogs,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / parseInt(limit))
          }
        }
      });

    } catch (err) {
      console.error("Get traffic logs error:", err);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to get traffic logs" 
      });
    }
  }
);

// GET AUDIT LOGS
router.get(
  "/api/logs/audit",
  authMiddleware,
  async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 50,
        action,
        userId,
        startDate,
        endDate 
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Build where clause
      const where = {};

      // Get users from same organization
      const orgUsers = await prisma.user.findMany({
        where: {
          organizationId: req.user.organizationId
        },
        select: { id: true }
      });

      const userIds = orgUsers.map(u => u.id);

      if (userId) {
        where.userId = userId;
      } else {
        where.userId = { in: userIds };
      }

      if (action && action !== 'all') {
        where.action = action;
      }

      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) {
          where.timestamp.gte = new Date(startDate);
        }
        if (endDate) {
          where.timestamp.lte = new Date(endDate);
        }
      }

      // Get audit logs with pagination
      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: {
            timestamp: 'desc'
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }),
        prisma.auditLog.count({ where })
      ]);

      // Transform data
      const transformedLogs = logs.map(log => ({
        id: log.id,
        action: log.action,
        targetId: log.targetId,
        targetType: log.targetType,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        details: log.details,
        timestamp: log.timestamp,
        user: log.user ? {
          id: log.user.id,
          name: log.user.name,
          email: log.user.email
        } : null
      }));

      return res.json({
        success: true,
        data: {
          logs: transformedLogs,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / parseInt(limit))
          }
        }
      });

    } catch (err) {
      console.error("Get audit logs error:", err);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to get audit logs" 
      });
    }
  }
);

// GET USER ACTIVITIES
router.get(
  "/api/logs/activities",
  authMiddleware,
  async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 50,
        activityType,
        userId,
        startDate,
        endDate 
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Build where clause
      const where = {
        organizationId: req.user.organizationId
      };

      if (userId) {
        where.userId = userId;
      }

      if (activityType && activityType !== 'all') {
        where.activityType = activityType;
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
          where.createdAt.lte = new Date(endDate);
        }
      }

      // Get activities with pagination
      const [activities, total] = await Promise.all([
        prisma.userActivity.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }),
        prisma.userActivity.count({ where })
      ]);

      // Transform data
      const transformedActivities = activities.map(activity => ({
        id: activity.id,
        activityType: activity.activityType,
        ipAddress: activity.ipAddress,
        userAgent: activity.userAgent,
        createdAt: activity.createdAt,
        user: activity.user ? {
          id: activity.user.id,
          name: activity.user.name,
          email: activity.user.email
        } : null
      }));

      return res.json({
        success: true,
        data: {
          activities: transformedActivities,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / parseInt(limit))
          }
        }
      });

    } catch (err) {
      console.error("Get user activities error:", err);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to get user activities" 
      });
    }
  }
);

// GET TRAFFIC SUMMARY
router.get(
  "/api/logs/traffic/summary",
  authMiddleware,
  async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      const where = {
        organizationId: req.user.organizationId
      };

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
          where.createdAt.lte = new Date(endDate);
        }
      }

      // Get traffic summary by operation
      const summary = await prisma.trafficLog.groupBy({
        by: ['operation'],
        where,
        _sum: {
          bytes: true
        },
        _count: {
          id: true
        }
      });

      // Get total
      const total = await prisma.trafficLog.aggregate({
        where,
        _sum: {
          bytes: true
        },
        _count: {
          id: true
        }
      });

      // Get top users
      const topUsers = await prisma.trafficLog.groupBy({
        by: ['userId'],
        where: {
          ...where,
          userId: { not: null }
        },
        _sum: {
          bytes: true
        },
        _count: {
          id: true
        },
        orderBy: {
          _sum: {
            bytes: 'desc'
          }
        },
        take: 10
      });

      // Get user details
      const userIds = topUsers.map(u => u.userId).filter(Boolean);
      const users = await prisma.user.findMany({
        where: {
          id: { in: userIds }
        },
        select: {
          id: true,
          name: true,
          email: true
        }
      });

      const userMap = {};
      users.forEach(u => {
        userMap[u.id] = u;
      });

      const topUsersWithDetails = topUsers.map(item => ({
        user: userMap[item.userId] || null,
        totalBytes: item._sum.bytes || 0,
        totalSize: formatBytes(Number(item._sum.bytes) || 0),
        count: item._count.id
      }));

      return res.json({
        success: true,
        data: {
          byOperation: summary.map(s => ({
            operation: s.operation,
            totalBytes: s._sum.bytes || 0,
            totalSize: formatBytes(Number(s._sum.bytes) || 0),
            count: s._count.id
          })),
          total: {
            totalBytes: total._sum.bytes || 0,
            totalSize: formatBytes(Number(total._sum.bytes) || 0),
            count: total._count.id
          },
          topUsers: topUsersWithDetails
        }
      });

    } catch (err) {
      console.error("Get traffic summary error:", err);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to get traffic summary" 
      });
    }
  }
);

// EXPORT LOGS (CSV)
router.get(
  "/api/logs/export",
  authMiddleware,
  async (req, res) => {
    try {
      const { type = 'traffic', startDate, endDate } = req.query;

      const where = {
        organizationId: req.user.organizationId
      };

      if (startDate || endDate) {
        const dateField = type === 'traffic' ? 'createdAt' : 'timestamp';
        where[dateField] = {};
        if (startDate) {
          where[dateField].gte = new Date(startDate);
        }
        if (endDate) {
          where[dateField].lte = new Date(endDate);
        }
      }

      let csvContent = '';

      if (type === 'traffic') {
        const logs = await prisma.trafficLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { name: true, email: true } },
            file: { select: { name: true } }
          }
        });

        csvContent = 'Date,User,Email,Operation,File,Size (Bytes),Size\n';
        logs.forEach(log => {
          const date = new Date(log.createdAt).toISOString();
          const user = log.user?.name || 'N/A';
          const email = log.user?.email || 'N/A';
          const operation = log.operation;
          const file = log.file?.name || 'N/A';
          const bytes = log.bytes;
          const size = formatBytes(Number(bytes));
          
          csvContent += `${date},${user},${email},${operation},"${file}",${bytes},${size}\n`;
        });
      } else if (type === 'audit') {
        where.userId = { 
          in: (await prisma.user.findMany({
            where: { organizationId: req.user.organizationId },
            select: { id: true }
          })).map(u => u.id)
        };

        const logs = await prisma.auditLog.findMany({
          where,
          orderBy: { timestamp: 'desc' },
          include: {
            user: { select: { name: true, email: true } }
          }
        });

        csvContent = 'Timestamp,User,Email,Action,Target Type,Target ID,IP Address\n';
        logs.forEach(log => {
          const timestamp = new Date(log.timestamp).toISOString();
          const user = log.user?.name || 'N/A';
          const email = log.user?.email || 'N/A';
          const action = log.action;
          const targetType = log.targetType || 'N/A';
          const targetId = log.targetId || 'N/A';
          const ip = log.ipAddress || 'N/A';
          
          csvContent += `${timestamp},${user},${email},${action},${targetType},${targetId},${ip}\n`;
        });
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-logs-${Date.now()}.csv"`);
      return res.send(csvContent);

    } catch (err) {
      console.error("Export logs error:", err);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to export logs" 
      });
    }
  }
);

// HELPER FUNCTIONS
function formatBytes(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

module.exports = router;