import express from "express";
import prisma from "../src/lib/prisma.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const stages = await prisma.dealStage.findMany({
      orderBy: {
        order: "asc",
      },
    });

    res.json(stages);
  } catch (error) {
    console.error("Error fetching deal stages:", error);

    res.status(500).json({
      error: "Failed to fetch deal stages",
      message: error.message,
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const stage = await prisma.dealStage.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        deals: true,
      },
    });

    if (!stage) {
      return res.status(404).json({
        error: "Deal stage not found",
      });
    }

    res.json(stage);
  } catch (error) {
    console.error("Error fetching deal stage:", error);

    res.status(500).json({
      error: "Failed to fetch deal stage",
      message: error.message,
    });
  }
});

export default router;

