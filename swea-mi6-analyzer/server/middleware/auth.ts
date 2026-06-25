import type { Request, Response, NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword) return next(); // No password set — open access

  const token = req.headers.authorization?.replace("Bearer ", "");
  if (token === appPassword) return next();

  res.status(401).json({ error: "Unauthorized" });
}
