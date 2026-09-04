import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { authMiddleware } from "./auth/middleware.js";
import prisma from "./lib/prisma.js";

import hubspotRoutes from "../routes/hubspot.js";
import testDbRoutes from "../routes/test-db.js";
import companiesRoutes from "../routes/companies.js";
import contactsRoutes from "../routes/contacts.js";
import dealStageRoutes from "../routes/deal-stages.js";
import dealsRoutes from "../routes/deals.js";
import accessRoutes from "../routes/access.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

/*
  ============================================================
  PRISMA
  ============================================================
*/

app.locals.prisma = prisma;

/*
  ============================================================
  CORS
  ============================================================
*/

app.use(
  cors({
    origin:
      process.env.FRONTEND_URL ||
      "http://localhost:5173",
    credentials: true,
  })
);

/*
  ============================================================
  BODY PARSER
  ============================================================
*/

app.use(express.json());

/*
  ============================================================
  CLERK AUTHENTICATION
  ============================================================
*/

app.use(authMiddleware);

/*
  ============================================================
  ROUTES
  ============================================================
*/

app.use("/api/hubspot", hubspotRoutes);

app.use("/api/test-db", testDbRoutes);

app.use("/api/companies", companiesRoutes);

app.use("/api/contacts", contactsRoutes);

app.use("/api/deal-stages", dealStageRoutes);

app.use("/api/deals", dealsRoutes);

app.use("/api/access", accessRoutes);

/*
  ============================================================
  HEALTH
  ============================================================
*/

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "ICHIKAWA SOLUTIONS LTD. CRM Manager Backend",
    timestamp: new Date().toISOString(),
  });
});

/*
  ============================================================
  ERROR HANDLER
  ============================================================
*/

app.use((error, req, res, next) => {
  console.error("API Error:", error);

  const status = error.status || 500;

  res.status(status).json({
    error:
      status === 500
        ? "Internal server error"
        : error.message,

    message: error.message,
  });
});

/*
  ============================================================
  LOCAL SERVER
  ============================================================
*/

if (process.env.NETLIFY !== "true") {
  app.listen(PORT, () => {
    console.log("======================================");
    console.log(
      `ICHIKAWA SOLUTIONS LTD. CRM Manager backend running on ${PORT}`
    );
    console.log("Access management: ENABLED");
    console.log("======================================");
  });
}

/*
  ============================================================
  EXPORT FOR NETLIFY FUNCTIONS
  ============================================================
*/

export default app;
