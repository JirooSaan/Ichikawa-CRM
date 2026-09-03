import { clerkMiddleware } from "@clerk/express";

/**
 * Must run before any route that calls getAuth().
 *
 * Keep this middleware global; individual API routes decide whether
 * authentication is required.
 */
export const authMiddleware = clerkMiddleware();
