# Ichikawa CRM — Access Management Phase 1

This bundle implements the database/authorization foundation for:

- Ichikawa internal users with different roles
- multiple client organizations
- multiple members per client organization
- role-based membership
- Clerk authentication + application-level authorization
- organization isolation

## Important

The actual project files were not mounted in this session, so this bundle is deliberately provided as an applyable patch rather than pretending the live repository was modified.

The current schema recovered from the project already contains:
- UserRole = SALES / TECHNICAL / MANAGER / CLIENT
- User.companyId
- User.companyAdmin
- Company -> Users / Contacts / Deals

Keep those legacy fields during this phase. Remove them only after all routes have migrated to Membership.

## 1. Install Clerk Express backend SDK

From backend:

    npm install @clerk/express

The backend should use clerkMiddleware() before routes that call getAuth().

## 2. Update Prisma schema

Apply schema.patch.prisma to backend/prisma/schema.prisma.

Add:
- OrganizationType
- MembershipRole
- MembershipStatus
- Organization
- Membership
- User.clerkUserId
- User.memberships
- Company.organization

Do not manually edit generated Prisma files.

## 3. Run the migration

Recommended:

    npx prisma migrate dev --name add_access_management

If using the supplied SQL migration directly, run it against the database and then:

    npx prisma generate

## 4. Important migration behavior

The migration creates:
- one internal organization: Ichikawa Solutions Ltd.
- one CLIENT organization for every existing Company
- memberships for existing users

Mapping:
- companyAdmin=true + internal user -> INTERNAL_ADMIN
- MANAGER -> MANAGER
- TECHNICAL -> TECHNICAL
- other internal -> SALES
- companyAdmin=true + CLIENT -> CLIENT_ADMIN
- other CLIENT -> CLIENT_MEMBER

The old User.role and User.companyId are intentionally retained during the transition.

## 5. Clerk user linking

Add `clerkUserId` to existing User records.

For security, do not automatically grant access to an arbitrary first-time Clerk user.

A future provisioning flow should:
1. authenticate with Clerk
2. find the application User by clerkUserId
3. if absent, match/approve the user through an admin-controlled invitation
4. create Membership
5. only then allow CRM access

## 6. Server integration

Apply server.snippet.js.

The access routes expose:

    GET /api/access/me
    GET /api/access/organizations/:organizationId/members

## 7. Security rule

Never rely on React route hiding for authorization.

Every CRM endpoint must eventually resolve:

    Clerk identity
        -> application User
        -> active Membership
        -> Organization
        -> role
        -> resource ownership/tenant
        -> permission

Client users must never receive internal DealReview fields simply because the frontend hides them.

## 8. Next phase

After this schema is live, retrofit the existing:
- /api/companies
- /api/contacts
- /api/deals
- /api/deal-stages

routes with organization and role checks.

Then build the Team Members / Access Management UI.
