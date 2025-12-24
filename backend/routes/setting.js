const express = require("express");
const bcrypt = require("bcryptjs");
const authMiddleware = require("../utils/auth.middleware");
const prisma = require("../lib/prisma");

const router = express.Router();

// GET USER PROFILE
router.get(
  "/api/users/profile",
  authMiddleware,
  async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          organization: {
            select: {
              id: true,
              name: true,
              storageLimitGb: true,
              plan: {
                select: {
                  name: true,
                  priceUsd: true
                }
              }
            }
          }
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      return res.json({
        success: true,
        data: user
      });

    } catch (err) {
      console.error("Get profile error:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to get profile"
      });
    }
  }
);

// UPDATE USER PROFILE
router.patch(
  "/api/users/profile",
  authMiddleware,
  async (req, res) => {
    try {
      const { name, email } = req.body;

      if (!name && !email) {
        return res.status(400).json({
          success: false,
          message: "At least one field is required"
        });
      }

      const updateData = {};
      if (name) updateData.name = name;
      if (email) {
        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
          where: { email }
        });

        if (existingUser && existingUser.id !== req.user.id) {
          return res.status(400).json({
            success: false,
            message: "Email already in use"
          });
        }
        updateData.email = email;
      }

      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          updatedAt: true
        }
      });

      return res.json({
        success: true,
        message: "Profile updated successfully",
        data: updatedUser
      });

    } catch (err) {
      console.error("Update profile error:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to update profile"
      });
    }
  }
);

// CHANGE PASSWORD
router.post(
  "/api/users/change-password",
  authMiddleware,
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password and new password are required"
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "New password must be at least 6 characters"
        });
      }

      // Get user with password
      const user = await prisma.user.findUnique({
        where: { id: req.user.id }
      });

      if (!user || !user.passwordHash) {
        return res.status(400).json({
          success: false,
          message: "User not found"
        });
      }

      // Verify current password
      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect"
        });
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // Update password
      await prisma.user.update({
        where: { id: req.user.id },
        data: { passwordHash: newPasswordHash }
      });

      return res.json({
        success: true,
        message: "Password changed successfully"
      });

    } catch (err) {
      console.error("Change password error:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to change password"
      });
    }
  }
);

// API: GET ORGANIZATION SETTINGS (Admin only)
router.get(
  "/api/organizations/:id/settings",
  authMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Check if user is admin of this organization
      if (req.user.role !== 'admin' || req.user.organizationId !== id) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Admin only."
        });
      }

      const organization = await prisma.organization.findUnique({
        where: { id },
        include: {
          plan: true,
          subscription: {
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          users: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              createdAt: true
            }
          }
        }
      });

      if (!organization) {
        return res.status(404).json({
          success: false,
          message: "Organization not found"
        });
      }

      return res.json({
        success: true,
        data: organization
      });

    } catch (err) {
      console.error("Get organization settings error:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to get organization settings"
      });
    }
  }
);

// API: UPDATE ORGANIZATION SETTINGS (Admin only)
router.patch(
  "/api/organizations/:id/settings",
  authMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, storageLimitGb } = req.body;

      // Check if user is admin of this organization
      if (req.user.role !== 'admin' || req.user.organizationId !== id) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Admin only."
        });
      }

      const updateData = {};
      if (name) updateData.name = name;
      if (storageLimitGb) updateData.storageLimitGb = parseInt(storageLimitGb);

      const updatedOrganization = await prisma.organization.update({
        where: { id },
        data: updateData,
        include: {
          plan: true
        }
      });

      return res.json({
        success: true,
        message: "Organization settings updated successfully",
        data: updatedOrganization
      });

    } catch (err) {
      console.error("Update organization settings error:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to update organization settings"
      });
    }
  }
);

// API: GET USAGE STATISTICS
router.get(
  "/api/users/usage",
  authMiddleware,
  async (req, res) => {
    try {
      // Get user's files
      const [files, totalSize] = await Promise.all([
        prisma.file.count({
          where: {
            ownerId: req.user.id,
            deletedAt: null
          }
        }),
        prisma.file.aggregate({
          where: {
            ownerId: req.user.id,
            deletedAt: null
          },
          _sum: {
            sizeBytes: true
          }
        })
      ]);

      // Get user's traffic this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const trafficStats = await prisma.trafficLog.aggregate({
        where: {
          userId: req.user.id,
          createdAt: {
            gte: startOfMonth
          }
        },
        _sum: {
          bytes: true
        }
      });

      // Get organization limits
      const organization = await prisma.organization.findUnique({
        where: { id: req.user.organizationId },
        select: {
          storageLimitGb: true,
          plan: {
            select: {
              maxUsers: true
            }
          }
        }
      });

      const storageUsed = totalSize._sum.sizeBytes || 0;
      const storageLimitBytes = (organization?.storageLimitGb || 10) * 1024 * 1024 * 1024;

      return res.json({
        success: true,
        data: {
          fileCount: files,
          storageUsed: storageUsed,
          storageUsedFormatted: formatBytes(Number(storageUsed)),
          storageLimit: storageLimitBytes,
          storageLimitFormatted: formatBytes(Number(storageLimitBytes)),
          storagePercentage: (storageUsed / storageLimitBytes * 100).toFixed(2),
          trafficThisMonth: trafficStats._sum.bytes || 0,
          trafficThisMonthFormatted: formatBytes(Number(trafficStats._sum.bytes) || 0)
        }
      });

    } catch (err) {
      console.error("Get usage error:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to get usage statistics"
      });
    }
  }
);

// API: DELETE ACCOUNT
router.delete(
  "/api/users/account",
  authMiddleware,
  async (req, res) => {
    try {
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({
          success: false,
          message: "Password is required to delete account"
        });
      }

      // Get user with password
      const user = await prisma.user.findUnique({
        where: { id: req.user.id }
      });

      if (!user || !user.passwordHash) {
        return res.status(400).json({
          success: false,
          message: "User not found"
        });
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: "Password is incorrect"
        });
      }

      // Check if user is the last admin
      if (user.role === 'admin') {
        const adminCount = await prisma.user.count({
          where: {
            organizationId: user.organizationId,
            role: 'admin'
          }
        });

        if (adminCount <= 1) {
          return res.status(400).json({
            success: false,
            message: "Cannot delete the last admin. Please assign another admin first."
          });
        }
      }

      // Soft delete user's files
      await prisma.file.updateMany({
        where: { ownerId: req.user.id },
        data: { deletedAt: new Date() }
      });

      // Delete user
      await prisma.user.delete({
        where: { id: req.user.id }
      });

      return res.json({
        success: true,
        message: "Account deleted successfully"
      });

    } catch (err) {
      console.error("Delete account error:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to delete account"
      });
    }
  }
);

// API: GET API KEYS (Admin only)
router.get(
  "/api/organizations/:id/api-keys",
  authMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Check if user is admin
      if (req.user.role !== 'admin' || req.user.organizationId !== id) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Admin only."
        });
      }

      // For now, return mock data
      // In production, you'd have an ApiKey table
      return res.json({
        success: true,
        data: {
          keys: []
        }
      });

    } catch (err) {
      console.error("Get API keys error:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to get API keys"
      });
    }
  }
);

// API: GET NOTIFICATION SETTINGS
router.get(
  "/api/users/notifications",
  authMiddleware,
  async (req, res) => {
    try {
      // For now, return mock data
      // In production, you'd have a NotificationSettings table
      return res.json({
        success: true,
        data: {
          emailNotifications: true,
          fileUploadNotifications: true,
          shareNotifications: true,
          weeklyReport: false,
          securityAlerts: true
        }
      });

    } catch (err) {
      console.error("Get notifications error:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to get notification settings"
      });
    }
  }
);

// API: UPDATE NOTIFICATION SETTINGS
router.patch(
  "/api/users/notifications",
  authMiddleware,
  async (req, res) => {
    try {
      const settings = req.body;

      // For now, just return success
      // In production, save to NotificationSettings table
      return res.json({
        success: true,
        message: "Notification settings updated successfully",
        data: settings
      });

    } catch (err) {
      console.error("Update notifications error:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to update notification settings"
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