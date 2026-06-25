import { pgTable, text, integer, real, timestamp, jsonb } from "drizzle-orm/pg-core";

export const analysisRecords = pgTable("analysis_records", {
  id:        text("id").primaryKey(),
  pair:      text("pair").notNull(),
  timeframe: text("timeframe").notNull(),
  date:      text("date").notNull(),
  indicators: jsonb("indicators").notNull(),
  verdict:   jsonb("verdict").notNull(),
  chartImage: text("chart_image"),
  notes:     text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type AnalysisRecordRow = typeof analysisRecords.$inferSelect;
export type NewAnalysisRecord = typeof analysisRecords.$inferInsert;
