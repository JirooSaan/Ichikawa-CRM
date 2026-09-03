// server.js integration

import { authMiddleware } from "./auth/middleware.js";
import accessRoutes from "./routes/access.js";

// IMPORTANT: put clerkMiddleware() before routes that call getAuth().
app.use(authMiddleware);

// After Prisma is initialized:
app.locals.prisma = prisma;

// Access-management API:
app.use("/api/access", accessRoutes);
