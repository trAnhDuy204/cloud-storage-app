const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key";

async function authMiddleware(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Find user by id or email in token
    let user = null;
    if (payload.id) {
      user = await prisma.user.findUnique({ where: { id: payload.id } });
    } else if (payload.email) {
      user = await prisma.user.findUnique({ where: { email: payload.email } });
    }

    if (!user) return res.status(401).json({ message: "Unauthorized" });

    req.user = { id: user.id, email: user.email, name: user.name ?? null };
    next();
  } catch (err) {
    console.error("auth middleware error:", err);
    return res.status(401).json({ message: "Unauthorized" });
  }
}

module.exports = authMiddleware;