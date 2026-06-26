import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import recordsRouter from "./routes/records.js";
import authRouter from "./routes/auth.js";
import { requireAuth } from "./middleware/auth.js";
import { db, schema } from "./db/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json({ limit: "20mb" }));

  // Health check — shows DB status and record count
  app.get("/api/health", async (_req, res) => {
    if (!db) return res.json({ db: false, error: "DATABASE_URL not set" });
    try {
      const rows = await db.select({ id: schema.analysisRecords.id }).from(schema.analysisRecords);
      res.json({ db: true, recordCount: rows.length });
    } catch (err: any) {
      res.json({ db: false, error: err?.message });
    }
  });

  // API routes
  app.use("/api/auth", authRouter);
  app.use("/api/records", requireAuth, recordsRouter);

  // In production: this file is dist/index.js, so __dirname = dist/
  // Vite builds to dist/public, so staticPath = dist/public ✓
  // In dev (tsx server/index.ts): __dirname = server/, staticPath = dist/public ✓
  const candidates = [
    path.resolve(__dirname, "public"),               // production: dist/public
    path.resolve(__dirname, "..", "dist", "public"), // dev: project/dist/public
  ];
  const staticPath = candidates.find((p) => fs.existsSync(p)) ?? candidates[0];

  app.use(express.static(staticPath));

  app.get("*", (_req, res) => {
    const indexHtml = path.join(staticPath, "index.html");
    res.sendFile(indexHtml, (err) => {
      if (err) res.status(404).send("App not built. Run pnpm build first.");
    });
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
