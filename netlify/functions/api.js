import serverless from "serverless-http";
import app from "../../src/backend/src/server.js";

export const handler = serverless(app);
