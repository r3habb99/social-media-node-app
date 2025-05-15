import express, { Request, Response } from "express";
import indexRoutes from "../routes/indexRoutes";

/**
 * Configure API routes for the Express application
 * @param app Express application instance
 */
export const setupRoutes = (app: express.Application): void => {
  // Health check endpoint
  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ status: "OK" });
  });

  // Main API routes
  app.use("/api", indexRoutes);
};
