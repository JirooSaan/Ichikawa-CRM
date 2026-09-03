import express from "express";
import prisma from "../src/lib/prisma.js";

import {
  getCurrentPrincipal,
  canReadCRM,
  canManageDeals,
  canChangeDealStage,
  canDeleteCRM,
  canAccessCompany,
} from "../src/auth/access.js";

const router = express.Router();

/**
 * =========================================================
 * GET /api/deals
 * =========================================================
 *
 * Internal users:
 *   See all CRM deals.
 *
 * Client users:
 *   See only deals belonging to their company.
 */
router.get("/", async (req, res) => {
  try {
    const principal = await getCurrentPrincipal(req, prisma);

    if (!canReadCRM(principal)) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You do not have access to CRM data.",
      });
    }

    const isInternal = principal.memberships.some(
      (membership) =>
        membership.organization?.type === "INTERNAL" &&
        [
          "INTERNAL_ADMIN",
          "MANAGER",
          "SALES",
          "TECHNICAL",
        ].includes(membership.role)
    );

    const where = isInternal
      ? {}
      : {
          companyId: {
            in: principal.memberships
              .filter(
                (membership) =>
                  membership.organization?.type === "CLIENT" &&
                  membership.organization?.companyId
              )
              .map(
                (membership) =>
                  membership.organization.companyId
              ),
          },
        };

    const deals = await prisma.deal.findMany({
      where,

      include: {
        company: true,
        contact: true,
        stage: true,
        owner: true,
        review: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(deals);
  } catch (error) {
    console.error("Error fetching deals:", error);

    res.status(error.status || 500).json({
      error: error.status
        ? error.message
        : "Failed to fetch deals",
      message: error.status
        ? undefined
        : error.message,
    });
  }
});

/**
 * =========================================================
 * GET /api/deals/:id
 * =========================================================
 *
 * A client may only retrieve a deal belonging to their
 * own company.
 */
router.get("/:id", async (req, res) => {
  try {
    const principal = await getCurrentPrincipal(req, prisma);

    if (!canReadCRM(principal)) {
      return res.status(403).json({
        error: "Forbidden",
      });
    }

    const deal = await prisma.deal.findUnique({
      where: {
        id: req.params.id,
      },

      include: {
        company: true,
        contact: true,
        stage: true,
        owner: true,
        review: true,

        history: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!deal) {
      return res.status(404).json({
        error: "Deal not found",
      });
    }

    if (!canAccessCompany(principal, deal.companyId)) {
      return res.status(403).json({
        error: "Forbidden",
        message:
          "You do not have access to this company's deal.",
      });
    }

    res.json(deal);
  } catch (error) {
    console.error("Error fetching deal:", error);

    res.status(error.status || 500).json({
      error: error.status
        ? error.message
        : "Failed to fetch deal",
      message: error.status
        ? undefined
        : error.message,
    });
  }
});

/**
 * =========================================================
 * POST /api/deals
 * =========================================================
 *
 * Only Ichikawa internal users can create deals.
 */
router.post("/", async (req, res) => {
  try {
    const principal = await getCurrentPrincipal(req, prisma);

    if (!canManageDeals(principal)) {
      return res.status(403).json({
        error: "Forbidden",
        message:
          "Only Ichikawa Solutions users can create deals.",
      });
    }

    const {
      title,
      description,
      companyId,
      contactId,
      stageId,
      ownerId,
      amount,
      currency,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        error: "Deal title is required",
      });
    }

    if (!companyId || !companyId.trim()) {
      return res.status(400).json({
        error: "Company is required",
      });
    }

    if (!stageId || !stageId.trim()) {
      return res.status(400).json({
        error: "Deal stage is required",
      });
    }

    const company = await prisma.company.findUnique({
      where: {
        id: companyId.trim(),
      },
    });

    if (!company) {
      return res.status(400).json({
        error: "Selected company does not exist",
      });
    }

    if (!canAccessCompany(principal, company.id)) {
      return res.status(403).json({
        error: "Forbidden",
        message:
          "You do not have access to the selected company.",
      });
    }

    const stage = await prisma.dealStage.findUnique({
      where: {
        id: stageId.trim(),
      },
    });

    if (!stage) {
      return res.status(400).json({
        error: "Selected deal stage does not exist",
      });
    }

    if (contactId) {
      const contact = await prisma.contact.findUnique({
        where: {
          id: contactId.trim(),
        },
      });

      if (!contact) {
        return res.status(400).json({
          error: "Selected contact does not exist",
        });
      }

      if (contact.companyId !== company.id) {
        return res.status(400).json({
          error:
            "Selected contact does not belong to the selected company",
        });
      }
    }

    const deal = await prisma.deal.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,

        companyId: company.id,

        contactId: contactId?.trim() || null,

        stageId: stage.id,

        ownerId: ownerId?.trim() || null,

        amount:
          amount !== undefined &&
          amount !== null &&
          amount !== ""
            ? amount
            : null,

        currency: currency?.trim() || "INR",
      },

      include: {
        company: true,
        contact: true,
        stage: true,
        owner: true,
        review: true,
      },
    });

    res.status(201).json(deal);
  } catch (error) {
    console.error("Error creating deal:", error);

    res.status(error.status || 500).json({
      error: error.status
        ? error.message
        : "Failed to create deal",
      message: error.status
        ? undefined
        : error.message,
    });
  }
});

/**
 * =========================================================
 * PUT /api/deals/:id
 * =========================================================
 *
 * Only Ichikawa internal users can edit deals.
 */
router.put("/:id", async (req, res) => {
  try {
    const principal = await getCurrentPrincipal(req, prisma);

    if (!canManageDeals(principal)) {
      return res.status(403).json({
        error: "Forbidden",
        message:
          "Only Ichikawa Solutions users can modify deals.",
      });
    }

    const existingDeal = await prisma.deal.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!existingDeal) {
      return res.status(404).json({
        error: "Deal not found",
      });
    }

    if (!canAccessCompany(principal, existingDeal.companyId)) {
      return res.status(403).json({
        error: "Forbidden",
      });
    }

    const {
      title,
      description,
      companyId,
      contactId,
      stageId,
      ownerId,
      amount,
      currency,
      status,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        error: "Deal title is required",
      });
    }

    if (!companyId || !companyId.trim()) {
      return res.status(400).json({
        error: "Company is required",
      });
    }

    if (!stageId || !stageId.trim()) {
      return res.status(400).json({
        error: "Deal stage is required",
      });
    }

    const company = await prisma.company.findUnique({
      where: {
        id: companyId.trim(),
      },
    });

    if (!company) {
      return res.status(400).json({
        error: "Selected company does not exist",
      });
    }

    if (!canAccessCompany(principal, company.id)) {
      return res.status(403).json({
        error: "Forbidden",
        message:
          "You do not have access to the selected company.",
      });
    }

    const stage = await prisma.dealStage.findUnique({
      where: {
        id: stageId.trim(),
      },
    });

    if (!stage) {
      return res.status(400).json({
        error: "Selected deal stage does not exist",
      });
    }

    if (contactId) {
      const contact = await prisma.contact.findUnique({
        where: {
          id: contactId.trim(),
        },
      });

      if (!contact) {
        return res.status(400).json({
          error: "Selected contact does not exist",
        });
      }

      if (contact.companyId !== company.id) {
        return res.status(400).json({
          error:
            "Selected contact does not belong to the selected company",
        });
      }
    }

    const deal = await prisma.deal.update({
      where: {
        id: req.params.id,
      },

      data: {
        title: title.trim(),

        description:
          description?.trim() || null,

        companyId: company.id,

        contactId:
          contactId?.trim() || null,

        stageId: stage.id,

        ownerId:
          ownerId?.trim() || null,

        amount:
          amount !== undefined &&
          amount !== null &&
          amount !== ""
            ? amount
            : null,

        currency:
          currency?.trim() || "INR",

        ...(status ? { status } : {}),
      },

      include: {
        company: true,
        contact: true,
        stage: true,
        owner: true,
        review: true,
      },
    });

    res.json(deal);
  } catch (error) {
    console.error("Error updating deal:", error);

    if (error.code === "P2025") {
      return res.status(404).json({
        error: "Deal not found",
      });
    }

    res.status(error.status || 500).json({
      error: error.status
        ? error.message
        : "Failed to update deal",
      message: error.status
        ? undefined
        : error.message,
    });
  }
});

/**
 * =========================================================
 * PATCH /api/deals/:id/stage
 * =========================================================
 *
 * Used by the drag/drop pipeline.
 *
 * ONLY Ichikawa internal users can change stages.
 */
router.patch("/:id/stage", async (req, res) => {
  try {
    const principal = await getCurrentPrincipal(req, prisma);

    if (!canChangeDealStage(principal)) {
      return res.status(403).json({
        error: "Forbidden",
        message:
          "Only Ichikawa Solutions users can change deal stages.",
      });
    }

    const { stageId } = req.body;

    if (!stageId || !stageId.trim()) {
      return res.status(400).json({
        error: "stageId is required",
      });
    }

    const existingDeal = await prisma.deal.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        stage: true,
        company: true,
      },
    });

    if (!existingDeal) {
      return res.status(404).json({
        error: "Deal not found",
      });
    }

    if (!canAccessCompany(principal, existingDeal.companyId)) {
      return res.status(403).json({
        error: "Forbidden",
      });
    }

    const newStage = await prisma.dealStage.findUnique({
      where: {
        id: stageId.trim(),
      },
    });

    if (!newStage) {
      return res.status(400).json({
        error: "Selected deal stage does not exist",
      });
    }

    const updatedDeal = await prisma.deal.update({
      where: {
        id: existingDeal.id,
      },

      data: {
        stageId: newStage.id,
      },

      include: {
        company: true,
        contact: true,
        stage: true,
        owner: true,
        review: true,
      },
    });

    res.json(updatedDeal);
  } catch (error) {
    console.error("Error updating deal stage:", error);

    res.status(error.status || 500).json({
      error: error.status
        ? error.message
        : "Failed to update deal stage",
      message: error.status
        ? undefined
        : error.message,
    });
  }
});

/**
 * =========================================================
 * DELETE /api/deals/:id
 * =========================================================
 *
 * Only Manager / Internal Admin.
 */
router.delete("/:id", async (req, res) => {
  try {
    const principal = await getCurrentPrincipal(req, prisma);

    if (!canDeleteCRM(principal)) {
      return res.status(403).json({
        error: "Forbidden",
        message:
          "Only managers can delete deals.",
      });
    }

    const deal = await prisma.deal.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!deal) {
      return res.status(404).json({
        error: "Deal not found",
      });
    }

    if (!canAccessCompany(principal, deal.companyId)) {
      return res.status(403).json({
        error: "Forbidden",
      });
    }

    await prisma.deal.delete({
      where: {
        id: req.params.id,
      },
    });

    res.json({
      success: true,
      message: "Deal deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting deal:", error);

    if (error.code === "P2025") {
      return res.status(404).json({
        error: "Deal not found",
      });
    }

    res.status(error.status || 500).json({
      error: error.status
        ? error.message
        : "Failed to delete deal",
      message: error.status
        ? undefined
        : error.message,
    });
  }
});

export default router;
