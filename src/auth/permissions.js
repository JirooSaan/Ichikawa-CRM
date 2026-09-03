export const PERMISSIONS = {
  "company:read": [
    "INTERNAL_ADMIN",
    "MANAGER",
    "SALES",
    "TECHNICAL",
    "CLIENT_ADMIN",
    "CLIENT_MEMBER",
    "CLIENT_VIEWER",
  ],

  "company:write": [
    "INTERNAL_ADMIN",
    "MANAGER",
    "SALES",
    "CLIENT_ADMIN",
    "CLIENT_MEMBER",
  ],

  "deal:read": [
    "INTERNAL_ADMIN",
    "MANAGER",
    "SALES",
    "TECHNICAL",
    "CLIENT_ADMIN",
    "CLIENT_MEMBER",
    "CLIENT_VIEWER",
  ],

  "deal:write": [
    "INTERNAL_ADMIN",
    "MANAGER",
    "SALES",
    "TECHNICAL",
    "CLIENT_ADMIN",
    "CLIENT_MEMBER",
  ],

  "deal-review:read": [
    "INTERNAL_ADMIN",
    "MANAGER",
    "TECHNICAL",
  ],

  "deal-review:write": [
    "INTERNAL_ADMIN",
    "MANAGER",
    "TECHNICAL",
  ],

  "members:manage": [
    "INTERNAL_ADMIN",
    "CLIENT_ADMIN",
  ],
};

export function hasPermission(membership, permission) {
  return (PERMISSIONS[permission] || []).includes(membership.role);
}
