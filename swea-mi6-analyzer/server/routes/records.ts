import { Router } from "express";
import { db, schema } from "../db/index.js";
import { eq } from "drizzle-orm";

const router = Router();

// GET /api/records
router.get("/", async (_req, res) => {
  try {
    const records = await db
      .select()
      .from(schema.analysisRecords)
      .orderBy(schema.analysisRecords.createdAt);
    // Return newest first
    res.json(records.reverse());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch records" });
  }
});

// POST /api/records
router.post("/", async (req, res) => {
  try {
    const { id, pair, timeframe, date, indicators, verdict, chartImage, notes } = req.body;
    const [record] = await db
      .insert(schema.analysisRecords)
      .values({ id, pair, timeframe, date, indicators, verdict, chartImage, notes })
      .onConflictDoUpdate({
        target: schema.analysisRecords.id,
        set: { pair, timeframe, date, indicators, verdict, chartImage, notes },
      })
      .returning();
    res.json(record);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save record" });
  }
});

// DELETE /api/records/:id
router.delete("/:id", async (req, res) => {
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
