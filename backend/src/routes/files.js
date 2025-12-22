const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const authMiddleware = require("../middlewares/auth.middleware");
const prisma = require("../prisma/client");

const router = express.Router();

// =========================
// CẤU HÌNH MULTER
// =========================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// =========================
// API UPLOAD FILE (JWT + DB)
// =========================
router.post(
  "/upload",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Không có file nào được upload" });
      }

      // 🔹 LẤY ROOT FOLDER "My library"
      const rootFolder = await prisma.folder.findFirst({
        where: {
          ownerId: req.user.id,
          parentId: null
        }
      });

      if (!rootFolder) {
        return res.status(400).json({ message: "Không tìm thấy thư mục gốc" });
      }

      // 🔹 LƯU FILE VÀO DB
      const fileRecord = await prisma.file.create({
        data: {
          name: req.file.filename, // tên file lưu trên server
          folderId: rootFolder.id,
          ownerId: req.user.id,
          organizationId: rootFolder.organizationId,
          sizeBytes: req.file.size,
          mimeType: req.file.mimetype
        }
      });

      return res.json({
        message: "Upload file thành công",
        user: req.user,
        file: {
          id: fileRecord.id,
          originalName: req.file.originalname,
          filename: req.file.filename,
          size: req.file.size
        }
      });
    } catch (err) {
      console.error("Upload error:", err);
      return res.status(500).json({ message: "Upload thất bại" });
    }
  }
);

// =========================
// API DOWNLOAD FILE (JWT)
// =========================
router.get(
  "/:id/download",
  authMiddleware,
  async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);

      const file = await prisma.file.findUnique({
        where: { id: fileId }
      });

      if (!file) {
        return res.status(404).json({ message: "File không tồn tại" });
      }

      if (file.ownerId !== req.user.id) {
        return res.status(403).json({ message: "Không có quyền truy cập file này" });
      }

      const filePath = path.join(__dirname, "../../uploads", file.name);
      return res.download(filePath, file.name);
    } catch (err) {
      console.error("Download error:", err);
      return res.status(500).json({ message: "Download thất bại" });
    }
  }
);

// =========================
// API XEM FILE .TXT (JWT)
// =========================
router.get(
  "/:id/view",
  authMiddleware,
  async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);

      const file = await prisma.file.findUnique({
        where: { id: fileId }
      });

      if (!file) {
        return res.status(404).json({ message: "File không tồn tại" });
      }

      if (file.ownerId !== req.user.id) {
        return res.status(403).json({ message: "Không có quyền xem file này" });
      }

      if (!file.mimeType || !file.mimeType.startsWith("text")) {
        return res.status(400).json({ message: "Chỉ hỗ trợ xem file text" });
      }

      const filePath = path.join(__dirname, "../../uploads", file.name);
      const content = fs.readFileSync(filePath, "utf-8");

      return res.json({
        id: file.id,
        filename: file.name,
        content
      });
    } catch (err) {
      console.error("View file error:", err);
      return res.status(500).json({ message: "Không thể xem file" });
    }
  }
);

// =========================
// API XÓA FILE (JWT)
// =========================
router.delete(
  "/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);

      const file = await prisma.file.findUnique({
        where: { id: fileId }
      });

      if (!file) {
        return res.status(404).json({ message: "File không tồn tại" });
      }

      if (file.ownerId !== req.user.id) {
        return res.status(403).json({ message: "Không có quyền xóa file này" });
      }

      const filePath = path.join(__dirname, "../../uploads", file.name);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      await prisma.file.delete({
        where: { id: fileId }
      });

      return res.json({ message: "Xóa file thành công" });
    } catch (err) {
      console.error("Delete file error:", err);
      return res.status(500).json({ message: "Xóa file thất bại" });
    }
  }
);

module.exports = router;
