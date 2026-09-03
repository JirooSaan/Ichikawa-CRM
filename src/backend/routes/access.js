import express from "express";
import prisma from "../src/lib/prisma.js";
import { getAuth } from "@clerk/express";
import { getCurrentPrincipal } from "../src/auth/access.js";

const router = express.Router();

/*
 * =========================================================
 * GET CURRENT USER ACCESS
 * =========================================================
 */

router.get("/me", async (req, res) => {
  try {
    const principal = await getCurrentPrincipal(req, prisma);

    res.json({
      user: {
        id: principal.id,
        name: principal.name,
        email: principal.email,
        role: principal.role,
        clerkUserId: principal.clerkUserId,
      },

      memberships: principal.memberships.map((membership) => ({
        id: membership.id,
        organizationId: membership.organizationId,
        role: membership.role,
        status: membership.status,

        organization: membership.organization
          ? {
              id: membership.organization.id,
              name: membership.organization.name,
              type: membership.organization.type,
              companyId: membership.organization.companyId,
            }
          : null,
      })),
    });
  } catch (error) {
    console.error("Access /me error:", error);

    res.status(error.status || 500).json({
      error:
        error.message ||
        "Unable to determine CRM access",
    });
  }
});


/*
 * =========================================================
 * PROVISION CLIENT ACCOUNT
 * =========================================================
 *
 * Called AFTER Clerk has successfully created/authenticated
 * the user.
 *
 * The Clerk user ID comes ONLY from the authenticated session.
 * The browser cannot choose it.
 * =========================================================
 */

router.post("/provision-client", async (req, res) => {
  try {
    const { isAuthenticated, userId: clerkUserId } = getAuth(req);

    if (!isAuthenticated || !clerkUserId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const {
      companyName,
      name,
      email,
    } = req.body || {};

    if (!companyName?.trim()) {
      return res.status(400).json({
        error: "Company name is required",
      });
    }

    if (!name?.trim()) {
      return res.status(400).json({
        error: "Name is required",
      });
    }

    /*
     * We deliberately use the authenticated Clerk ID
     * as the source of identity.
     */
    const normalizedCompanyName =
      companyName.trim();

    const normalizedName =
      name.trim();

    const normalizedEmail =
      email?.trim().toLowerCase() || null;

    const result = await prisma.$transaction(
      async (tx) => {

        /*
         * ---------------------------------------------------
         * 1. Find existing CRM user by Clerk ID
         * ---------------------------------------------------
         */

        let user = await tx.user.findUnique({
          where: {
            clerkUserId,
          },
        });

        /*
         * ---------------------------------------------------
         * 2. Find or create client company
         * ---------------------------------------------------
         */

        let company =
          await tx.company.findFirst({
            where: {
              name: normalizedCompanyName,
            },
          });

        if (!company) {
          company =
            await tx.company.create({
              data: {
                name:
                  normalizedCompanyName,
              },
            });
        }

        /*
         * ---------------------------------------------------
         * 3. Create/update CRM user
         * ---------------------------------------------------
         */

        if (user) {

          user =
            await tx.user.update({
              where: {
                id: user.id,
              },

              data: {
                name:
                  normalizedName,

                email:
                  normalizedEmail ||
                  user.email,

                role: "CLIENT",

                companyId:
                  company.id,

                companyAdmin: true,
              },
            });

        } else {

          if (!normalizedEmail) {
            throw new Error(
              "Email is required for client account provisioning"
            );
          }

          user =
            await tx.user.create({
              data: {
                name:
                  normalizedName,

                email:
                  normalizedEmail,

                role: "CLIENT",

                clerkUserId,

                companyId:
                  company.id,

                companyAdmin: true,
              },
            });
        }

        /*
         * ---------------------------------------------------
         * 4. Find or create CLIENT organization
         * ---------------------------------------------------
         */

        let organization =
          await tx.organization.findFirst({
            where: {
              companyId: company.id,
              type: "CLIENT",
            },
          });

        if (!organization) {
          organization =
            await tx.organization.create({
              data: {
                name:
                  normalizedCompanyName,

                type: "CLIENT",

                companyId:
                  company.id,
              },
            });
        }

        /*
         * ---------------------------------------------------
         * 5. Create/update CLIENT_ADMIN membership
         * ---------------------------------------------------
         */

        const membership =
          await tx.membership.upsert({
            where: {
              userId_organizationId: {
                userId: user.id,
                organizationId:
                  organization.id,
              },
            },

            update: {
              role: "CLIENT_ADMIN",
              status: "ACTIVE",
            },

            create: {
              userId: user.id,

              organizationId:
                organization.id,

              role: "CLIENT_ADMIN",

              status: "ACTIVE",
            },
          });

        return {
          user,
          company,
          organization,
          membership,
        };
      }
    );

    console.log(
      "[CLIENT PROVISION] Created:",
      {
        clerkUserId,
        userId: result.user.id,
        companyId: result.company.id,
        organizationId:
          result.organization.id,
      }
    );

    return res.status(201).json({
      success: true,

      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        clerkUserId:
          result.user.clerkUserId,
      },

      company: {
        id: result.company.id,
        name: result.company.name,
      },

      organization: {
        id: result.organization.id,
        name: result.organization.name,
        type: result.organization.type,
        companyId:
          result.organization.companyId,
      },

      membership: {
        id: result.membership.id,
        role: result.membership.role,
        status:
          result.membership.status,
      },
    });

  } catch (error) {

    console.error(
      "Access /provision-client error:",
      error
    );

    /*
     * Prisma unique constraint.
     */
    if (error.code === "P2002") {
      return res.status(409).json({
        error:
          "A CRM account already exists for this email or Clerk account.",
      });
    }

    return res.status(
      error.status || 500
    ).json({
      error:
        error.message ||
        "Unable to provision client account",
    });
  }
});


export default router;