// backend/src/server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const authRoutes = require("./routes/auth.routes");
const prisma = require("./prisma/client"); // để kiểm tra kết nối DB

const app = express();
const PORT = process.env.PORT || 5000;

// Cho phép frontend ở localhost:3000 gọi backend
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));

app.use(express.json());

// auth routes
app.use("/api/auth", authRoutes);

// route kiểm tra backend + database
app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.listen(PORT, () => {
  console.log("Backend đang chạy ở: http://localhost:" + PORT);
});
