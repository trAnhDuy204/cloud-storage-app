const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const authRoutes = require("./routes/auth.routes");
const filesRoutes = require("./routes/files");
const prisma = require("./prisma/client");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));

app.use(express.json());
app.use("/uploads", express.static("uploads"));

// auth routes
app.use("/api/auth", authRoutes);

// file routes
app.use("/api/files", filesRoutes);

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
