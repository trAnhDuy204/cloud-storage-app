const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const authMiddleware = require("../utils/auth.middleware");
const prisma = require("../lib/prisma");
const { trackTraffic, updateUsageStats } = require("../utils/statistics");

const router = express.Router();

// =========================
// CẤU HÌNH MULTER
// =========================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "uploads/";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// =========================
// API: GET ALL FILES & FOLDERS
// =========================
router.get(
  "/api/files",
  authMiddleware,
  async (req, res) => {
    try {
      const { folderId } = req.query;

      // Get root folder if no folderId specified
      let targetFolderId = folderId;
      
      if (!folderId) {
        const rootFolder = await prisma.folder.findFirst({
          where: {
            name: "My library",
            ownerId: req.user.id,
            organizationId: req.user.organizationId,
            parentId: null
          }
        });

        if (!rootFolder) {
          // Create root folder if not exists
          const newRootFolder = await prisma.folder.create({
            data: {
              name: "My library",
              ownerId: req.user.id,
              organizationId: req.user.organizationId
            }
          });
          targetFolderId = newRootFolder.id;
        } else {
          targetFolderId = rootFolder.id;
        }
      }

      // Get folders
      const folders = await prisma.folder.findMany({
        where: {
          parentId: targetFolderId,
          organizationId: req.user.organizationId
        },
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
          owner: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: { name: 'asc' }
      });

      // Get files
      const files = await prisma.file.findMany({
        where: {
          folderId: targetFolderId,
          deletedAt: null
        },
        select: {
          id: true,
          name: true,
          sizeBytes: true,
          mimeType: true,
          createdAt: true,
          updatedAt: true,
          owner: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: { name: 'asc' }
      });

      // Transform data
      const transformedFolders = folders.map(folder => ({
        id: folder.id,
        name: folder.name,
        type: 'folder',
        size: '0 files', // TODO: Count files inside
        modified: folder.updatedAt,
        owner: folder.owner?.name || 'Unknown',
        folder: targetFolderId
      }));

      const transformedFiles = files.map(file => ({
        id: file.id,
        name: file.name,
        type: 'file',
        fileType: getFileType(file.mimeType),
        size: formatFileSize(Number(file.sizeBytes)),
        modified: file.updatedAt,
        owner: file.owner?.name || 'Unknown',
        folder: targetFolderId,
        mimeType: file.mimeType
      }));

      return res.json({
        success: true,
        data: {
          currentFolderId: targetFolderId,
          items: [...transformedFolders, ...transformedFiles]
        }
      });

    } catch (err) {
      console.error("Get files error:", err);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to get files" 
      });
    }
  }
);

// =========================
// API: CREATE FOLDER
// =========================
router.post(
  "/api/folders",
  authMiddleware,
  async (req, res) => {
    try {
      const { name, parentId } = req.body;

      if (!name) {
        return res.status(400).json({ 
          success: false, 
          message: "Folder name is required" 
        });
      }

      // Check if folder with same name exists
      const existing = await prisma.folder.findFirst({
        where: {
          name,
          parentId: parentId || null,
          ownerId: req.user.id,
          organizationId: req.user.organizationId
        }
      });

      if (existing) {
        return res.status(400).json({ 
          success: false, 
          message: "Folder with this name already exists" 
        });
      }

      const folder = await prisma.folder.create({
        data: {
          name,
          parentId: parentId || null,
          ownerId: req.user.id,
          organizationId: req.user.organizationId
        },
        include: {
          owner: {
            select: {
              name: true,
              email: true
            }
          }
        }
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'create',
          targetId: folder.id,
          targetType: 'folder',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || '',
          details: `Folder "${folder.name}" created`
        }
      });

      return res.json({
        success: true,
        message: "Folder created successfully",
        data: {
          id: folder.id,
          name: folder.name,
          type: 'folder',
          size: '0 files',
          modified: folder.createdAt,
          owner: folder.owner.name
        }
      });

    } catch (err) {
      console.error("Create folder error:", err);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to create folder" 
      });
    }
  }
);

// =========================
// API: UPLOAD FILE
// =========================
router.post(
  "/api/files/upload",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: "No file uploaded" 
        });
      }

      const { folderId } = req.body;

      // Get or create root folder
      let targetFolderId = folderId;
      
      if (!folderId) {
        const rootFolder = await prisma.folder.findFirst({
          where: {
            name: "My library",
            ownerId: req.user.id,
            organizationId: req.user.organizationId,
            parentId: null
          }
        });

        if (!rootFolder) {
          const newRootFolder = await prisma.folder.create({
            data: {
              name: "My library",
              ownerId: req.user.id,
              organizationId: req.user.organizationId
            }
          });
          targetFolderId = newRootFolder.id;
        } else {
          targetFolderId = rootFolder.id;
        }
      }

      // Create file record
      const fileRecord = await prisma.file.create({
        data: {
          name: req.file.originalname,
          folderId: targetFolderId,
          ownerId: req.user.id,
          serverKey: req.file.filename,
          sizeBytes: req.file.size,
          mimeType: req.file.mimetype
        },
        include: {
          owner: {
            select: {
              name: true,
              email: true
            }
          }
        }
      });

      // Create first version
      await prisma.fileVersion.create({
        data: {
          fileId: fileRecord.id,
          versionNumber: 1,
          serverKey: req.file.filename,
          sizeBytes: req.file.size,
          mimeType: req.file.mimetype,
          uploadedBy: req.user.id
        }
      });

      // Track upload traffic
      await trackTraffic(
        req.user.organizationId,
        'upload',
        req.file.size,
        req.user.id,
        fileRecord.id
      );

      // Update usage stats
      await updateUsageStats(req.user.organizationId);

      return res.json({
        success: true,
        message: "File uploaded successfully",
        data: {
          id: fileRecord.id,
          name: fileRecord.name,
          type: 'file',
          fileType: getFileType(fileRecord.mimeType),
          size: formatFileSize(Number(fileRecord.sizeBytes)),
          modified: fileRecord.createdAt,
          owner: fileRecord.owner.name,
          mimeType: fileRecord.mimeType
        }
      });

    } catch (err) {
      console.error("Upload error:", err);
      
      // Clean up uploaded file on error
      if (req.file) {
        const filePath = path.join(__dirname, "../uploads", req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      
      return res.status(500).json({ 
        success: false, 
        message: "Upload failed" 
      });
    }
  }
);

// =========================
// API: DOWNLOAD FILE
// =========================
router.get(
  "/api/files/:id/download",
  authMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;

      const file = await prisma.file.findUnique({
        where: { id }
      });

      if (!file) {
        return res.status(404).json({ 
          success: false, 
          message: "File not found" 
        });
      }

      // Check permissions (owner or same organization)
      if (file.ownerId !== req.user.id) {
        const folder = await prisma.folder.findUnique({
          where: { id: file.folderId }
        });
        
        if (folder.organizationId !== req.user.organizationId) {
          return res.status(403).json({ 
            success: false, 
            message: "Access denied" 
          });
        }
      }

      const filePath = path.join(__dirname, "../uploads", file.serverKey);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ 
          success: false, 
          message: "File not found on server" 
        });
      }

      // Track download traffic
      await trackTraffic(
        req.user.organizationId,
        'download',
        file.sizeBytes,
        req.user.id,
        file.id
      );

      return res.download(filePath, file.name);

    } catch (err) {
      console.error("Download error:", err);
      return res.status(500).json({ 
        success: false, 
        message: "Download failed" 
      });
    }
  }
);

// =========================
// API: DELETE FILE
// =========================
router.delete(
  "/api/files/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;

      const file = await prisma.file.findUnique({
        where: { id }
      });

      if (!file) {
        return res.status(404).json({ 
          success: false, 
          message: "File not found" 
        });
      }

      // Check ownership
      if (file.ownerId !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: "Access denied" 
        });
      }

      // Soft delete
      await prisma.file.update({
        where: { id },
        data: {
          deletedAt: new Date()
        }
      });

      // Delete physical file
      const filePath = path.join(__dirname, "../uploads", file.serverKey);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'delete',
          targetId: file.id,
          targetType: 'file',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || '',
          details: `File "${file.name}" deleted`
        }
      });

      // Track delete traffic
      await trackTraffic(
        req.user.organizationId,
        'delete',
        file.sizeBytes,
        req.user.id,
        file.id
      );

      // Update usage stats
      await updateUsageStats(req.user.organizationId);

      return res.json({ 
        success: true, 
        message: "File deleted successfully" 
      });

    } catch (err) {
      console.error("Delete error:", err);
      return res.status(500).json({ 
        success: false, 
        message: "Delete failed" 
      });
    }
  }
);

// =========================
// API: DELETE FOLDER
// =========================
router.delete(
  "/api/folders/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;

      const folder = await prisma.folder.findUnique({
        where: { id },
        include: {
          files: true,
          children: true
        }
      });

      if (!folder) {
        return res.status(404).json({ 
          success: false, 
          message: "Folder not found" 
        });
      }

      // Check ownership
      if (folder.ownerId !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: "Access denied" 
        });
      }

      // Check if folder is empty
      if (folder.files.length > 0 || folder.children.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: "Folder is not empty" 
        });
      }

      await prisma.folder.delete({
        where: { id }
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'delete',
          targetId: folder.id,
          targetType: 'folder',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || '',
          details: `Folder "${folder.name}" deleted`
        }
      });

      return res.json({ 
        success: true, 
        message: "Folder deleted successfully" 
      });

    } catch (err) {
      console.error("Delete folder error:", err);
      return res.status(500).json({ 
        success: false, 
        message: "Delete failed" 
      });
    }
  }
);

// =========================
// API: RENAME FILE
// =========================
router.patch(
  "/api/files/:id/rename",
  authMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({ 
          success: false, 
          message: "Name is required" 
        });
      }

      const file = await prisma.file.findUnique({
        where: { id }
      });

      if (!file || file.ownerId !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: "Access denied" 
        });
      }

      const updated = await prisma.file.update({
        where: { id },
        data: { name }
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'update',
          targetId: file.id,
          targetType: 'file',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || '',
          details: `File "${file.name}" renamed`
        }
      });

      return res.json({ 
        success: true, 
        message: "File renamed successfully",
        data: updated
      });

    } catch (err) {
      console.error("Rename error:", err);
      return res.status(500).json({ 
        success: false, 
        message: "Rename failed" 
      });
    }
  }
);

// =========================
// API: RENAME FOLDER
// =========================
router.patch(
  "/api/folders/:id/rename",
  authMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({ 
          success: false, 
          message: "Name is required" 
        });
      }

      const folder = await prisma.folder.findUnique({
        where: { id }
      });

      if (!folder || folder.ownerId !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: "Access denied" 
        });
      }

      const updated = await prisma.folder.update({
        where: { id },
        data: { name }
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'update',
          targetId: folder.id,
          targetType: 'folder',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || '',
          details: `Folder "${folder.name}" renamed`
        }
      });

      return res.json({ 
        success: true, 
        message: "Folder renamed successfully",
        data: updated
      });

    } catch (err) {
      console.error("Rename folder error:", err);
      return res.status(500).json({ 
        success: false, 
        message: "Rename failed" 
      });
    }
  }
);

// =========================
// API: SEARCH FILES
// =========================
router.get(
  "/api/files/search",
  authMiddleware,
  async (req, res) => {
    try {
      const { query } = req.query;

      if (!query || query.length < 2) {
        return res.json({
          success: true,
          data: []
        });
      }

      const files = await prisma.file.findMany({
        where: {
          name: {
            contains: query,
            mode: 'insensitive'
          },
          deletedAt: null,
          folder: {
            organizationId: req.user.organizationId
          }
        },
        include: {
          owner: {
            select: {
              name: true
            }
          }
        },
        take: 50
      });

      const folders = await prisma.folder.findMany({
        where: {
          name: {
            contains: query,
            mode: 'insensitive'
          },
          organizationId: req.user.organizationId
        },
        include: {
          owner: {
            select: {
              name: true
            }
          }
        },
        take: 50
      });

      const results = [
        ...folders.map(f => ({
          id: f.id,
          name: f.name,
          type: 'folder',
          owner: f.owner?.name
        })),
        ...files.map(f => ({
          id: f.id,
          name: f.name,
          type: 'file',
          fileType: getFileType(f.mimeType),
          size: formatFileSize(Number(f.sizeBytes)),
          owner: f.owner?.name
        }))
      ];

      return res.json({
        success: true,
        data: results
      });

    } catch (err) {
      console.error("Search error:", err);
      return res.status(500).json({ 
        success: false, 
        message: "Search failed" 
      });
    }
  }
);

// =========================
// HELPER FUNCTIONS
// =========================
function getFileType(mimeType) {
  if (!mimeType) return 'file';
  
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'doc';
  if (mimeType.includes('image')) return 'image';
  if (mimeType.includes('video')) return 'video';
  if (mimeType.includes('zip') || mimeType.includes('compressed')) return 'zip';
  if (mimeType.includes('audio')) return 'audio';
  
  return 'file';
}

function formatFileSize(size) {
  if (typeof size === 'bigint') {
    if (size < 1024n) return `${size} B`;
    if (size < 1024n ** 2n) return `${size / 1024n} KB`;
    if (size < 1024n ** 3n) return `${size / (1024n ** 2n)} MB`;
    return `${size / (1024n ** 3n)} GB`;
  }

  // fallback number
  if (size < 1024) return `${size} B`;
  if (size < 1024 ** 2) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 ** 3) return `${(size / 1024 ** 2).toFixed(1)} MB`;
  return `${(size / 1024 ** 3).toFixed(1)} GB`;
}


module.exports = router;