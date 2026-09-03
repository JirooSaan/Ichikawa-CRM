import { getAuth } from "@clerk/express";

export async function getCurrentPrincipal(req, prisma) {
  const { isAuthenticated, userId: clerkUserId } = getAuth(req);

  console.log("[ACCESS DEBUG] Clerk user:", clerkUserId);

  if (!isAuthenticated || !clerkUserId) {
    const error = new Error("Authentication required");
    error.status = 401;
    throw error;
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId },
    include: {
      memberships: {
        where: { status: "ACTIVE" },
        include: {
          organization: true,
        },
      },
    },
  });

  if (!user) {
    const error = new Error(
      "Authenticated user is not provisioned for this CRM"
    );
    error.status = 403;
    throw error;
  }

  return user;
}

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

export function hasRole(principal, ...roles) {
  return principal.memberships.some((membership) =>
    roles.includes(membership.role)
  );
}

export function isInternalUser(principal) {
  return principal.memberships.some(
    (membership) =>
      membership.organization?.type === "INTERNAL" &&
      INTERNAL_ROLES.includes(membership.role)
  );
}

export function canAccessCompany(principal, companyId) {
  // Internal users can access all companies.
  if (isInternalUser(principal)) {
    return true;
  }

  // Client users can only access their own company's data.
  return principal.memberships.some(
    (membership) =>
      membership.organization?.type === "CLIENT" &&
      membership.organization?.companyId === companyId &&
      CLIENT_ROLES.includes(membership.role)
  );
}

export function canReadCRM(principal) {
  return principal.memberships.some(
    (membership) =>
      INTERNAL_ROLES.includes(membership.role) ||
      CLIENT_ROLES.includes(membership.role)
  );
}

export function canWriteCRM(principal) {
  return principal.memberships.some(
    (membership) =>
      [
        "INTERNAL_ADMIN",
        "MANAGER",
        "SALES",
        "TECHNICAL",
        "CLIENT_ADMIN",
        "CLIENT_MEMBER",
      ].includes(membership.role)
  );
}

export function canDeleteCRM(principal) {
  return principal.memberships.some(
    (membership) =>
      [
        "INTERNAL_ADMIN",
        "MANAGER",
      ].includes(membership.role)
  );
}

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

export function getAccessibleCompanyIds(principal) {
  // Internal users don't need a company filter.
  if (isInternalUser(principal)) {
    return [];
  }

  return principal.memberships
    .filter(
      (membership) =>
        membership.organization?.type === "CLIENT" &&
        membership.organization?.companyId
    )
    .map((membership) => membership.organization.companyId);
}

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
