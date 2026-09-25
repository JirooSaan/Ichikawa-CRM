import { getAuth } from "@clerk/express";

/**
 * =========================================================
 * LOAD CURRENT CRM PRINCIPAL
 * =========================================================
 *
 * Clerk answers:
 *   "Who is authenticated?"
 *
 * Prisma answers:
 *   "What can that person access?"
 */
export async function getCurrentPrincipal(req, prisma) {
  const { isAuthenticated, userId: clerkUserId } = getAuth(req);

  if (!isAuthenticated || !clerkUserId) {
    const error = new Error("Authentication required");
    error.status = 401;
    throw error;
  }

  console.log("[ACCESS DEBUG] Clerk user:", clerkUserId);

  const user = await prisma.user.findUnique({
    where: {
      clerkUserId,
    },
    include: {
      memberships: {
        where: {
          status: "ACTIVE",
        },
        include: {
          organization: true,
        },
      },
    },
  });

  console.log(
    "[ACCESS DEBUG] CRM user:",
    user?.email || "NOT PROVISIONED"
  );

  if (!user) {
    const error = new Error(
      "Authenticated user is not provisioned for this CRM"
    );
    error.status = 403;
    throw error;
  }

  return user;
}

/**
 * =========================================================
 * ROLE CONSTANTS
 * =========================================================
 */

export const INTERNAL_ROLES = [
  "INTERNAL_ADMIN",
  "MANAGER",
  "SALES",
  "TECHNICAL",
];

export const CLIENT_ROLES = [
  "CLIENT_ADMIN",
  "CLIENT_MEMBER",
  "CLIENT_VIEWER",
];

/**
 * =========================================================
 * ROLE CHECK
 * =========================================================
 */

export function hasRole(principal, ...roles) {
  return principal.memberships.some((membership) =>
    roles.includes(membership.role)
  );
}

/**
 * =========================================================
 * INTERNAL USER
 * =========================================================
 */

export function isInternalUser(principal) {
  return principal.memberships.some(
    (membership) =>
      membership.organization?.type === "INTERNAL" &&
      INTERNAL_ROLES.includes(membership.role)
  );
}

/**
 * =========================================================
 * CLIENT USER
 * =========================================================
 */

export function isClientUser(principal) {
  return principal.memberships.some(
    (membership) =>
      membership.organization?.type === "CLIENT" &&
      CLIENT_ROLES.includes(membership.role)
  );
}

/**
 * =========================================================
 * READ CRM
 * =========================================================
 */

export function canReadCRM(principal) {
  return principal.memberships.some(
    (membership) =>
      INTERNAL_ROLES.includes(membership.role) ||
      CLIENT_ROLES.includes(membership.role)
  );
}

/**
 * =========================================================
 * WRITE INTERNAL CRM DATA
 * =========================================================
 *
 * Client users do NOT get general CRM write access.
 *
 * Client portal is read-only for deal tracking.
 */
export function canWriteCRM(principal) {
  return principal.memberships.some(
    (membership) =>
      membership.organization?.type === "INTERNAL" &&
      [
        "INTERNAL_ADMIN",
        "MANAGER",
        "SALES",
        "TECHNICAL",
      ].includes(membership.role)
  );
}

/**
 * =========================================================
 * DEAL MANAGEMENT
 * =========================================================
 *
 * Only Ichikawa internal users can modify deals.
 */
export function canManageDeals(principal) {
  return principal.memberships.some(
    (membership) =>
      membership.organization?.type === "INTERNAL" &&
      [
        "INTERNAL_ADMIN",
        "MANAGER",
        "SALES",
        "TECHNICAL",
      ].includes(membership.role)
  );
}

/**
 * =========================================================
 * DEAL STAGE CHANGES
 * =========================================================
 *
 * Only Ichikawa controls pipeline progression.
 *
 * Client users can NEVER:
 * - move a deal
 * - change a stage
 * - drag/drop a deal
 */
export function canChangeDealStage(principal) {
  return principal.memberships.some(
    (membership) =>
      membership.organization?.type === "INTERNAL" &&
      [
        "INTERNAL_ADMIN",
        "MANAGER",
        "SALES",
        "TECHNICAL",
      ].includes(membership.role)
  );
}

/**
 * =========================================================
 * DELETE CRM DATA
 * =========================================================
 *
 * Only managers/admins can delete.
 */

export function canDeleteCRM(principal) {
  return principal.memberships.some(
    (membership) =>
      membership.organization?.type === "INTERNAL" &&
      [
        "INTERNAL_ADMIN",
        "MANAGER",
        "SALES",
        "TECHNICAL",
      ].includes(membership.role)
  );
}

/**
 * =========================================================
 * COMPANY ACCESS
 * =========================================================
 *
 * Internal Ichikawa users:
 *   Can access all companies.
 *
 * Client users:
 *   Can access ONLY their organization's company.
 */
export function canAccessCompany(principal, companyId) {
  const internalAccess = principal.memberships.some(
    (membership) =>
      membership.organization?.type === "INTERNAL" &&
      INTERNAL_ROLES.includes(membership.role)
  );

  if (internalAccess) {
    return true;
  }

  return principal.memberships.some(
    (membership) =>
      membership.organization?.type === "CLIENT" &&
      membership.organization?.companyId === companyId &&
      CLIENT_ROLES.includes(membership.role)
  );
}

/**
 * =========================================================
 * ACCESSIBLE CLIENT COMPANY IDS
 * =========================================================
 */

export function getAccessibleCompanyIds(principal) {
  return [
    ...new Set(
      principal.memberships
        .filter(
          (membership) =>
            membership.organization?.type === "CLIENT" &&
            membership.organization?.companyId
        )
        .map(
          (membership) =>
            membership.organization.companyId
        )
    ),
  ];
}

/**
 * =========================================================
 * MEMBER MANAGEMENT
 * =========================================================
 *
 * Internal admins can manage organizations.
 * Client admins can manage members of their own organization.
 */
export function canManageMembers(principal, organizationId) {
  return principal.memberships.some(
    (membership) =>
      membership.organizationId === organizationId &&
      [
        "INTERNAL_ADMIN",
        "MANAGER",
        "CLIENT_ADMIN",
      ].includes(membership.role)
  );
}

/**
 * =========================================================
 * REQUIRE ROLE MIDDLEWARE
 * =========================================================
 */

export function requireRole(...allowedRoles) {
  return async (req, res, next) => {
    try {
      const principal = await getCurrentPrincipal(
        req,
        req.app.locals.prisma
      );

      const allowed = principal.memberships.some(
        (membership) =>
          allowedRoles.includes(membership.role)
      );

      if (!allowed) {
        return res.status(403).json({
          error: "Forbidden",
          message:
            "Your role does not have access to this operation.",
        });
      }

      req.principal = principal;
      next();
    } catch (error) {
      next(error);
    }
  };
}
