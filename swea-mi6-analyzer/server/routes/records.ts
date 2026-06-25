import { Router } from "express";
import { db, schema } from "../db/index.js";
import { eq } from "drizzle-orm";

const router = Router();

const noDb = (_req: any, res: any) =>
  res.status(503).json({ error: "Database not configured" });

// GET /api/records
router.get("/", async (_req, res) => {
  if (!db) return noDb(_req, res);
  try {
    const records = await db.select().from(schema.analysisRecords).orderBy(schema.analysisRecords.createdAt);
    res.json(records.reverse());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch records" });
  }
});

// POST /api/records — upsert via insert then update on duplicate key
router.post("/", async (req, res) => {
  if (!db) return noDb(req, res);
  const { id, pair, timeframe, date, indicators, verdict, chartImage, notes } = req.body;
  try {
    await db
      .insert(schema.analysisRecords)
      .values({ id, pair, timeframe, date, indicators, verdict, chartImage, notes });
    res.json({ id });
  } catch (err: any) {
    if (err?.code === "ER_DUP_ENTRY") {
      try {
        await db!
          .update(schema.analysisRecords)
          .set({ pair, timeframe, date, indicators, verdict, chartImage, notes })
          .where(eq(schema.analysisRecords.id, id));
        return res.json({ id });
      } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "Failed to update record" });
      }
    }
    console.error(err);
    res.status(500).json({ error: "Failed to save record" });
  }
});

// DELETE /api/records/:id
router.delete("/:id", async (req, res) => {
  if (!db) return noDb(req, res);
  try {
    await db.delete(schema.analysisRecords).where(eq(schema.analysisRecords.id, req.params.id));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete record" });
  }
});

// GET /api/records/:id
router.get("/:id", async (req, res) => {
  if (!db) return noDb(req, res);
  try {
    const [record] = await db
      .select()
      .from(schema.analysisRecords)
      .where(eq(schema.analysisRecords.id, req.params.id));
    if (!record) return res.status(404).json({ error: "Not found" });
    res.json(record);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch record" });
  }
});

export default router;
