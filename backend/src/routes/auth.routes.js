// backend/src/routes/auth.routes.js
const express = require("express");
const { register, login } = require("../controllers/auth.controller");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middlewares/auth.middleware");
const prisma = require("../prisma/client");

const router = express.Router();

// register & login
router.post("/register", register);
router.post("/login", login);

// protected endpoint to get current user
router.get("/me", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// GOOGLE LOGIN endpoint (keeps your existing logic but upserts user)
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "811435489538-mj43vmh6u6jrkas2grdg26le7ac3vk23.apps.googleusercontent.com";
const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret";
const client = new OAuth2Client(CLIENT_ID);

// ================= GOOGLE LOGIN =================
router.post("/google", async (req, res) => {
  try {
    const { id_token } = req.body;
    if (!id_token) {
      return res.status(400).json({ message: "Missing id_token" });
    }

    // 1) Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload.email;
    const name = payload.name;
    const picture = payload.picture;
    const googleId = payload.sub;

    if (!email) {
      return res.status(400).json({ message: "Tài khoản Google không có email" });
    }

    // 2) Tìm user theo email
    let user = await prisma.user.findUnique({
      where: { email },
      include: { organization: true },
    });

    // 3) Nếu user chưa tồn tại → tạo Organization + User
    if (!user) {
      const org = await prisma.organization.create({
        data: { name: `${name || "User"}'s Workspace` },
      });

      user = await prisma.user.create({
        data: {
          email,
          password: "",               // Google login không có password
          name: name || null,
          googleId,
          avatarUrl: picture || null,
          organizationId: org.id,
        },
        include: { organization: true },
      });
    } else {
      // 4) Nếu user đã có → cập nhật thông tin Google
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: name || user.name,
          googleId: googleId || user.googleId,
          avatarUrl: picture || user.avatarUrl,
        },
        include: { organization: true },
      });

      // Nếu email/password user cũ nhưng CHƯA có organization → tạo mới
      if (!user.organizationId) {
        const org = await prisma.organization.create({
          data: { name: `${user.name || "User"}'s Workspace` },
        });

        user = await prisma.user.update({
          where: { id: user.id },
          data: { organizationId: org.id },
          include: { organization: true },
        });
      }
    }

    // 5) Tạo JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        organizationId: user.organizationId,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Google login OK",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        organizationId: user.organizationId,
      },
    });

  } catch (err) {
    console.error("Google auth error:", err);
    return res.status(500).json({ message: "Google login failed" });
  }
});


module.exports = router;
