import express from "express";

import prisma from "../src/lib/prisma.js";

import {
  getCurrentPrincipal,
  isInternalUser,
  getAccessibleCompanyIds,
  canAccessCompany,
  canWriteCRM,
  canDeleteCRM,
} from "../src/auth/access.js";

const router = express.Router();


/*
 * =========================================================
 * GET /api/contacts
 * Get contacts accessible to the current user
 * =========================================================
 */

router.get("/", async (req, res) => {
  try {

    const principal =
      await getCurrentPrincipal(
        req,
        prisma
      );

    const where = isInternalUser(principal)
      ? {}
      : {
          companyId: {
            in: getAccessibleCompanyIds(
              principal
            ),
          },
        };

    const contacts =
      await prisma.contact.findMany({

        where,

        include: {
          company: true,
          deals: true,
        },

        orderBy: [
          {
            firstName: "asc",
          },
          {
            lastName: "asc",
          },
        ],

      });

    res.json(contacts);

  } catch (error) {

    console.error(
      "Error fetching contacts:",
      error
    );

    res.status(
      error.status || 500
    ).json({
      error:
        error.message ||
        "Failed to fetch contacts",
    });
  }
});


/*
 * =========================================================
 * GET /api/contacts/:id
 * Get one contact
 * =========================================================
 */

router.get("/:id", async (req, res) => {
  try {

    const principal =
      await getCurrentPrincipal(
        req,
        prisma
      );

    const contact =
      await prisma.contact.findUnique({

        where: {
          id: req.params.id,
        },

        include: {
          company: true,

          deals: {
            include: {
              stage: true,
            },
          },
        },

      });

    if (!contact) {
      return res.status(404).json({
        error: "Contact not found",
      });
    }


    /*
     * Make sure the user can access
     * the contact's company.
     */

    if (
      !canAccessCompany(
        principal,
        contact.companyId
      )
    ) {
      return res.status(403).json({
        error:
          "You do not have access to this contact",
      });
    }


    res.json(contact);

  } catch (error) {

    console.error(
      "Error fetching contact:",
      error
    );

    res.status(
      error.status || 500
    ).json({
      error:
        error.message ||
        "Failed to fetch contact",
    });
  }
});


/*
 * =========================================================
 * POST /api/contacts
 * Create contact
 * =========================================================
 */

router.post("/", async (req, res) => {
  try {

    const principal =
      await getCurrentPrincipal(
        req,
        prisma
      );


    /*
     * CLIENT_VIEWER cannot create contacts.
     */

    if (!canWriteCRM(principal)) {
      return res.status(403).json({
        error:
          "You do not have permission to create contacts",
      });
    }


    const {
      firstName,
      lastName,
      email,
      phone,
      jobTitle,
      companyId,
    } = req.body;


    if (
      !firstName ||
      !firstName.trim()
    ) {
      return res.status(400).json({
        error:
          "First name is required",
      });
    }


    if (
      !companyId ||
      !companyId.trim()
    ) {
      return res.status(400).json({
        error:
          "Company is required",
      });
    }


    const company =
      await prisma.company.findUnique({
        where: {
          id: companyId.trim(),
        },
      });


    if (!company) {
      return res.status(400).json({
        error:
          "Selected company does not exist",
      });
    }


    /*
     * Prevent a client user from creating
     * a contact under another company.
     */

    if (
      !canAccessCompany(
        principal,
        company.id
      )
    ) {
      return res.status(403).json({
        error:
          "You do not have access to this company",
      });
    }


    const contact =
      await prisma.contact.create({

        data: {

          firstName:
            firstName.trim(),

          lastName:
            lastName?.trim() ||
            null,

          email:
            email?.trim() ||
            null,

          phone:
            phone?.trim() ||
            null,

          jobTitle:
            jobTitle?.trim() ||
            null,

          companyId:
            company.id,

        },

        include: {
          company: true,
        },

      });


    res.status(201).json(contact);

  } catch (error) {

    console.error(
      "Error creating contact:",
      error
    );

    res.status(
      error.status || 500
    ).json({
      error:
        error.message ||
        "Failed to create contact",
    });
  }
});


/*
 * =========================================================
 * PUT /api/contacts/:id
 * Update contact
 * =========================================================
 */

router.put("/:id", async (req, res) => {
  try {

    const principal =
      await getCurrentPrincipal(
        req,
        prisma
      );


    if (!canWriteCRM(principal)) {
      return res.status(403).json({
        error:
          "You do not have permission to update contacts",
      });
    }


    /*
     * Find the existing contact first.
     */

    const existingContact =
      await prisma.contact.findUnique({
        where: {
          id: req.params.id,
        },
      });


    if (!existingContact) {
      return res.status(404).json({
        error: "Contact not found",
      });
    }


    /*
     * User must have access to the
     * contact's current company.
     */

    if (
      !canAccessCompany(
        principal,
        existingContact.companyId
      )
    ) {
      return res.status(403).json({
        error:
          "You do not have access to this contact",
      });
    }


    const {
      firstName,
      lastName,
      email,
      phone,
      jobTitle,
      companyId,
    } = req.body;


    if (
      !firstName ||
      !firstName.trim()
    ) {
      return res.status(400).json({
        error:
          "First name is required",
      });
    }


    if (
      !companyId ||
      !companyId.trim()
    ) {
      return res.status(400).json({
        error:
          "Company is required",
      });
    }


    const company =
      await prisma.company.findUnique({
        where: {
          id: companyId.trim(),
        },
      });


    if (!company) {
      return res.status(400).json({
        error:
          "Selected company does not exist",
      });
    }


    /*
     * User must also have access to the
     * new company.
     */

    if (
      !canAccessCompany(
        principal,
        company.id
      )
    ) {
      return res.status(403).json({
        error:
          "You do not have access to the selected company",
      });
    }


    const contact =
      await prisma.contact.update({

        where: {
          id: req.params.id,
        },

        data: {

          firstName:
            firstName.trim(),

          lastName:
            lastName?.trim() ||
            null,

          email:
            email?.trim() ||
            null,

          phone:
            phone?.trim() ||
            null,

          jobTitle:
            jobTitle?.trim() ||
            null,

          companyId:
            company.id,

        },

        include: {
          company: true,
        },

      });


    res.json(contact);

  } catch (error) {

    console.error(
      "Error updating contact:",
      error
    );


    if (
      error.code === "P2025"
    ) {
      return res.status(404).json({
        error:
          "Contact not found",
      });
    }


    res.status(
      error.status || 500
    ).json({
      error:
        error.message ||
        "Failed to update contact",
    });
  }
});


/*
 * =========================================================
 * DELETE /api/contacts/:id
 * Delete contact
 * =========================================================
 */

router.delete("/:id", async (req, res) => {
  try {

    const principal =
      await getCurrentPrincipal(
        req,
        prisma
      );


    /*
     * Only INTERNAL_ADMIN and MANAGER
     * can delete CRM data.
     */

    if (!canDeleteCRM(principal)) {
      return res.status(403).json({
        error:
          "You do not have permission to delete contacts",
      });
    }


    const contact =
      await prisma.contact.findUnique({
        where: {
          id: req.params.id,
        },
      });


    if (!contact) {
      return res.status(404).json({
        error:
          "Contact not found",
      });
    }


    if (
      !canAccessCompany(
        principal,
        contact.companyId
      )
    ) {
      return res.status(403).json({
        error:
          "You do not have access to this contact",
      });
    }


    await prisma.contact.delete({
      where: {
        id: req.params.id,
      },
    });


    res.status(204).send();

  } catch (error) {

    console.error(
      "Error deleting contact:",
      error
    );


    if (
      error.code === "P2025"
    ) {
      return res.status(404).json({
        error:
          "Contact not found",
      });
    }


    res.status(
      error.status || 500
    ).json({
      error:
        error.message ||
        "Failed to delete contact",
    });
  }
});


export default router;