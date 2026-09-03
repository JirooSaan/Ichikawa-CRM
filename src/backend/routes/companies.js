import express from "express";
import prisma from "../src/lib/prisma.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      include: {
        contacts: true,
        deals: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    res.json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error);

    res.status(500).json({
      error: "Failed to fetch companies",
      message: error.message,
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const company = await prisma.company.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        contacts: true,
        deals: {
          include: {
            stage: true,
            contact: true,
          },
        },
      },
    });

    if (!company) {
      return res.status(404).json({
        error: "Company not found",
      });
    }

    res.json(company);
  } catch (error) {
    console.error("Error fetching company:", error);

    res.status(500).json({
      error: "Failed to fetch company",
      message: error.message,
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      name,
      industry,
      phone,
      email,
      website,
      address,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        error: "Company name is required",
      });
    }

    const company = await prisma.company.create({
      data: {
        name: name.trim(),
        industry: industry?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        website: website?.trim() || null,
        address: address?.trim() || null,
      },
    });

    res.status(201).json(company);
  } catch (error) {
    console.error("Error creating company:", error);

    res.status(500).json({
      error: "Failed to create company",
      message: error.message,
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const {
      name,
      industry,
      phone,
      email,
      website,
      address,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        error: "Company name is required",
      });
    }

    const company = await prisma.company.update({
      where: {
        id: req.params.id,
      },
      data: {
        name: name.trim(),
        industry: industry?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        website: website?.trim() || null,
        address: address?.trim() || null,
      },
    });

    res.json(company);
  } catch (error) {
    console.error("Error updating company:", error);

    if (error.code === "P2025") {
      return res.status(404).json({
        error: "Company not found",
      });
    }

    res.status(500).json({
      error: "Failed to update company",
      message: error.message,
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await prisma.company.delete({
      where: {
        id: req.params.id,
      },
    });

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting company:", error);

    if (error.code === "P2025") {
      return res.status(404).json({
        error: "Company not found",
      });
    }

    res.status(500).json({
      error: "Failed to delete company",
      message: error.message,
    });
  }
});

export default router;
