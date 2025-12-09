// backend/src/controllers/auth.controller.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../prisma/client");

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key";
const JWT_EXPIRES = "7d";

// ================= REGISTER =================
async function register(req, res) {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email và mật khẩu bắt buộc" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res
        .status(409)
        .json({ message: "Email đã được đăng ký" });
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    // 1) Tạo Organization trước
    const orgName =
      name?.trim() ||
      `${email.split("@")[0]}'s Workspace`;

    const org = await prisma.organization.create({
      data: {
        name: orgName,
      },
    });

    // 2) Tạo User gắn với organizationId vừa tạo
    const user = await prisma.user.create({
      data: {
        email,
        password: hash,
        name: name || null,
        organizationId: org.id,
      },
      select: {
        id: true,
        email: true,
        name: true,
        organizationId: true,
      },
    });

    return res
      .status(201)
      .json({ message: "Đăng ký thành công", user });
  } catch (err) {
    console.error("register error", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
}


// ================= LOGIN =================
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email và mật khẩu bắt buộc" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
      return res.status(401).json({ message: "Email hoặc mật khẩu sai" });

    // <-- đọc field `password` từ DB (là hash)
    const ok = await bcrypt.compare(password, user.password);
    if (!ok)
      return res.status(401).json({ message: "Email hoặc mật khẩu sai" });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    return res.json({
      message: "Đăng nhập thành công",
      token,
      user: { id: user.id, email: user.email }
    });

  } catch (err) {
    console.error("login error", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
}

module.exports = { register, login };
