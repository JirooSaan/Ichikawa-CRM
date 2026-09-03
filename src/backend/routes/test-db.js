import express from "express";
import prisma from "../src/lib/prisma.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await prisma.$queryRaw`SELECT NOW() AS time`;

    res.json({
      connected: true,
      database: "PostgreSQL",
      time: result[0].time,
    });
  } catch (error) {
    console.error("Database connection error:", error);

    res.status(500).json({
      connected: false,
      error: error.message,
    });
  }
});

export default router;