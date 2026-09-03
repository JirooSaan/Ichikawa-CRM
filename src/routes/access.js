import express from "express";
import { getAuth } from "@clerk/express";
import {
  getCurrentPrincipal,
  canManageMembers,
} from "../auth/access.js";

const router = express.Router();

/**
 * GET /api/access/me
 *
 * Returns the application identity, organizations and memberships.
 */
router.get("/me", async (req, res, next) => {
  try {
    const principal = await getCurrentPrincipal(req, req.app.locals.prisma);

    res.json({
      user: {
        id: principal.id,
        name: principal.name,
        email: principal.email,
      },
      memberships: principal.memberships.map((membership) => ({
        id: membership.id,
        role: membership.role,
        status: membership.status,
        organization: {
          id: membership.organization.id,
          name: membership.organization.name,
          type: membership.organization.type,
          companyId: membership.organization.companyId,
        },
      })),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/access/organizations/:organizationId/members
 */
router.get("/organizations/:organizationId/members", async (req, res, next) => {
  try {
    const principal = await getCurrentPrincipal(req, req.app.locals.prisma);
    const { organizationId } = req.params;

    const membership = principal.memberships.find(
      (m) => m.organizationId === organizationId
    );

    if (!membership) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const members = await req.app.locals.prisma.membership.findMany({
      where: {
        organizationId,
        status: { not: "SUSPENDED" },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    res.json({
      organizationId,
      members: members.map((m) => ({
        id: m.id,
        role: m.role,
        status: m.status,
        user: m.user,
      })),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
