// backend/src/controllers/auth.controller.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../prisma/client");

const JWT_SECRET = process.env.JWT_SECRET || "changeme";

// REGISTER
exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Thiếu email hoặc password" });
    }

    // check email tồn tại chưa
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return res.status(409).json({ message: "Email đã tồn tại" });
    }

    // hash mật khẩu
    const hashed = await bcrypt.hash(password, 10);

    // tạo user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name,
      },
    });

    return res.status(201).json({
      message: "Đăng ký thành công",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // kiểm tra input
    if (!email || !password) {
      return res.status(400).json({ message: "Thiếu email hoặc password" });
    }

    // tìm user email
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(400).json({ message: "Sai email hoặc mật khẩu" });
    }

    // so sánh mật khẩu
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(400).json({ message: "Sai email hoặc mật khẩu" });
    }

    // tạo token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};
