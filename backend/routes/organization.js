const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');


BigInt.prototype.toJSON = function () {
  return this.toString();
};

// hàm serialize để chuyển đổi bigint thành string trong object
const serialize = (obj) => {
  return JSON.parse(JSON.stringify(obj, (_, value) =>
    typeof value === "bigint"
      ? value.toString()
      : value
  ));
};

// lấy dashboard của organization
router.get('/api/organizations/:organizationId/dashboard', async (req, res) => {
  try {
    const { organizationId } = req.params;

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        plan: true,
        users: {
          select: { id: true, name: true, email: true, role: true, createdAt: true ,updatedAt: true}
        },
        usageStats: true,
        subscriptions: {
          where: { status: 'active' },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: "Organization not found"
      });
    }

    // Stats
    const totalUsersCount = organization.users.length;
    const usageStats = organization.usageStats[0] || {
      totalStorageBytes: 0n,
      fileCount: 0
    };

    // Storage limits
    const storageLimitBytes =
      BigInt(organization.storageLimitGb) * BigInt(1024 * 1024 * 1024);

    const spaceUsedPercentage =
      storageLimitBytes > 0n
        ? Number((usageStats.totalStorageBytes * 10000n) / storageLimitBytes) / 100
        : 0;

    // Format bytes
    const formatBytes = (bytes) => {
      bytes = Number(bytes);
      if (bytes === 0) return '0 B';
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(1024));
      return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Response Object
    const dashboardData = {
      organization: {
        id: organization.id,
        name: organization.name,
        storageLimitGb: organization.storageLimitGb,
        createdAt: organization.createdAt
      },
      plan: organization.plan ? {
        id: organization.plan.id,
        name: organization.plan.name,
        priceUsd: organization.plan.priceUsd,
        storageLimitGb: organization.plan.storageLimitGb,
        maxUsers: organization.plan.maxUsers
      } : null,
      stats: {
        totalUsers: totalUsersCount,
        activeUsers: totalUsersCount,
        userNumLimit: organization.plan?.maxUsers || 1,
        storageUsed: formatBytes(usageStats.totalStorageBytes),
        storageLimit: `${organization.storageLimitGb} GB`,
        storageUsedBytes: usageStats.totalStorageBytes,
        storageLimitBytes: storageLimitBytes,
        fileCount: usageStats.fileCount,
        spaceUsedPercentage,
        trafficThisMonth: "0 B",
        trafficLimit: "300 GB",
        trafficPercentage: 0
      },
      subscription: organization.subscriptions[0] || null,
      users: organization.users
    };

    res.json({
      success: true,
      data: serialize(dashboardData)
    });

  } catch (error) {
    console.error("Error fetching organization dashboard:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


// lấy danh sách người dùng trong organization
router.get('/api/organizations/:organizationId/users', async (req, res) => {
  try {
    const { organizationId } = req.params;

    const users = await prisma.user.findMany({
      where: { organizationId: organizationId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ 
      success: true,
      users: users,
      count: users.length
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// câp nhật thông tin organization
router.put('/api/organizations/:organizationId', async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { name, storageLimitGb, planId } = req.body;

    const organization = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        ...(name && { name }),
        ...(storageLimitGb && { storageLimitGb: parseInt(storageLimitGb) }),
        ...(planId && { planId }),
        updatedAt: new Date()
      },
      include: {
        plan: true
      }
    });

    res.json({ 
      success: true,
      organization: organization
    });

  } catch (error) {
    console.error('Error updating organization:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// thêm người dùng vào organization
router.post('/api/users/:organizationId', async (req, res) => {
  const { name, email, password, role} = req.body;
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        role,
        organizationId: req.params.organizationId
      }
    });
    
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// xóa người dùng khỏi organization
router.delete('/api/users/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    await prisma.user.delete({
      where: { id: userId }
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;