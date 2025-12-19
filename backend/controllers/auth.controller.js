// backend/src/controllers/auth.controller.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");
const { trackUserActivity } = require('../utils/statistics');

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

    const plan = await prisma.plan.findFirst({
        where: {name: "Free"},
    })
    if (!plan) {
        return res.status(409).json({ message: "Plan đã tồn tại" });
    }

    // tạo organization
    const organization = await prisma.organization.create({
      data: {
        storageLimitGb: plan.storageLimitGb,
        planId: plan.id,
        name: email,
      },
    });

    // tạo user
    const user = await prisma.user.create({
      data: {
        email,
        organizationId: organization.id,
        passwordHash: hashed,
        role:"admin",
        name,
      },
    });

    return res.status(201).json({
      message: "Đăng ký thành công",
      user: {
        id: user.id,
        organizationId: organization.id,
        plan: plan.name,
        email: user.email,
        name: user.name,
        storageLimitGb: organization.storageLimitGb
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

    // tìm organization của user
    const organization = await prisma.organization.findFirst({ where: { id: user.organizationId } });

    if (!organization) {
      return res.status(400).json({ message: "Tài khoản không tồn tại" });
    }

    if (!user.passwordHash) {
      console.error("LỖI: user.password bị null!");
      return res.status(500).json({ message: "Dữ liệu user lỗi, thiếu mật khẩu" });
    }

    // so sánh mật khẩu
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(400).json({ message: "Sai email hoặc mật khẩu" });
    }

    // theo dõi sau khi đăng nhập thành công
    if (user.organizationId) {
        await trackUserActivity(
            user.id,
            user.organizationId,
            'login',
            req.headers['x-forwarded-for'],
            req.headers['user-agent']
        );
    }

    // tạo token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        role: user.role,
        organizationId: organization.id
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user.id,
        organizationId: organization.id,
        role: user.role,
        email: user.email,
        name: user.name,
        googleId: user.googleId
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};