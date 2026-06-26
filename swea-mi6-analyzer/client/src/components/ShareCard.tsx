import { forwardRef } from "react";
import type { AnalysisRecord } from "@/lib/swea-data";

const SIGNAL_LABELS: Record<string, string> = {
  strong_bullish: "强烈多头 ★★★",
  bullish:        "多头信号 ★★",
  strong_bearish: "强烈空头 ★★★",
  bearish:        "空头信号 ★★",
  mixed:          "信号混合",
  no_signal:      "无明确信号",
};

const INDICATOR_NAMES: Record<string, string> = {
  candlestick:   "蜡烛形态",
  chartPattern:  "图表形态",
  trendPattern:  "趋势形态",
  fibonacci:     "斐波那契",
  bollingerBand: "布林带",
  movingAverage: "均线 MA20",
};

interface ShareCardProps {
  record: AnalysisRecord;
}

// Fixed 1080×1920 card rendered at 0.25 scale in preview
const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(({ record }, ref) => {
  const isBull = record.verdict.signal.includes("bullish");
  const isBear = record.verdict.signal.includes("bearish");
  const pnl = record.tradeRecord?.actualPnl;

  const accentColor = isBull ? "#10b981" : isBear ? "#ef4444" : "#f59e0b";
  const accentBg   = isBull ? "rgba(16,185,129,0.12)" : isBear ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.12)";
  const date = new Date(record.date).toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" });

  return (
    <div
      ref={ref}
      style={{
        width: 1080,
        height: 1920,
        background: "linear-gradient(160deg, #0a0f1e 0%, #0d1a2e 40%, #0a0a1a 100%)",
        fontFamily: "'Sora', 'PingFang SC', 'Microsoft YaHei', sans-serif",
        position: "relative",
        overflow: "hidden",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Background grid lines */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />

      {/* Top accent bar */}
      <div style={{ height: 6, background: `linear-gradient(90deg, ${accentColor}, transparent)`, flexShrink: 0 }} />

      {/* Header */}
      <div style={{ padding: "60px 80px 40px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: "rgba(255,255,255,0.06)",
              border: "1.5px solid rgba(255,255,255,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, fontWeight: 900, color: accentColor,
            }}>M6</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: 3 }}>SWEA MI6</div>
              <div style={{ fontSize: 16, color: "rgba(255,255,255,0.3)", letterSpacing: 2 }}>Signal Analyzer</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 16, color: "rgba(255,255,255,0.3)" }}>{date}</div>
          </div>
        </div>

        {/* Pair + timeframe */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 96, fontWeight: 900, letterSpacing: -2, color: "#fff", fontFamily: "'Fira Code', monospace" }}>
            {record.pair}
          </div>
          <div style={{
            fontSize: 32, fontWeight: 600, color: "rgba(255,255,255,0.4)",
            border: "1.5px solid rgba(255,255,255,0.15)",
            padding: "6px 18px", borderRadius: 8,
          }}>{record.timeframe}</div>
        </div>

        {/* Signal verdict */}
        <div style={{
          display: "inline-block",
          background: accentBg,
          border: `2px solid ${accentColor}`,
          borderRadius: 16, padding: "20px 40px", marginBottom: 0,
        }}>
          <div style={{ fontSize: 56, fontWeight: 900, color: accentColor, letterSpacing: 2 }}>
            {SIGNAL_LABELS[record.verdict.signal]}
          </div>
        </div>
      </div>

      {/* Chart image */}
      {record.chartImage && (
        <div style={{ margin: "0 80px", flexShrink: 0 }}>
          <img
            src={record.chartImage}
            alt="chart"
            style={{
              width: "100%", height: 420, objectFit: "cover",
              borderRadius: 20,
              border: "1.5px solid rgba(255,255,255,0.1)",
            }}
            crossOrigin="anonymous"
          />
        </div>
      )}

      {/* Score bar */}
      <div style={{ padding: "50px 80px 0", flexShrink: 0 }}>
        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20, padding: "40px 50px",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 30, marginBottom: 40 }}>
            {[
              { label: "看涨 BULL", val: record.verdict.bullishCount, color: "#10b981", bg: "rgba(16,185,129,0.12)" },
              { label: "看跌 BEAR", val: record.verdict.bearishCount, color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
              { label: "中性 NEU",  val: record.verdict.neutralCount,  color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
            ].map(({ label, val, color, bg }) => (
              <div key={label} style={{ textAlign: "center", background: bg, borderRadius: 14, padding: "24px 0" }}>
                <div style={{ fontSize: 72, fontWeight: 900, color, fontFamily: "'Fira Code', monospace" }}>{val}</div>
                <div style={{ fontSize: 18, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Confidence bar */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 20, color: "rgba(255,255,255,0.4)" }}>信号可信度</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: accentColor, fontFamily: "'Fira Code', monospace" }}>
                {record.verdict.confidence}%
              </span>
            </div>
            <div style={{ height: 12, background: "rgba(255,255,255,0.08)", borderRadius: 6 }}>
              <div style={{
                height: "100%", width: `${record.verdict.confidence}%`,
                background: `linear-gradient(90deg, ${accentColor}, ${accentColor}88)`,
                borderRadius: 6,
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Indicators grid */}
      <div style={{ padding: "40px 80px 0", flexShrink: 0 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18 }}>
          {Object.entries(record.indicators).map(([key, val]) => {
            const color = val.state === "bullish" ? "#10b981" : val.state === "bearish" ? "#ef4444" : "#6b7280";
            const arrow = val.state === "bullish" ? "▲" : val.state === "bearish" ? "▼" : "—";
            return (
              <div key={key} style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 14, padding: "22px 24px",
                display: "flex", flexDirection: "column", gap: 8,
              }}>
                <div style={{ fontSize: 17, color: "rgba(255,255,255,0.45)" }}>{INDICATOR_NAMES[key]}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color }}>{arrow}</div>
                {val.notes && (
                  <div style={{
                    fontSize: 14, color: "rgba(255,255,255,0.3)",
                    overflow: "hidden", display: "-webkit-box",
                    WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                  }}>{val.notes}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Trade record */}
      {record.tradeRecord && (record.tradeRecord.entryPrice !== undefined || pnl !== undefined) && (
        <div style={{ padding: "40px 80px 0", flexShrink: 0 }}>
          <div style={{
            background: "rgba(20,184,166,0.08)",
            border: "1px solid rgba(20,184,166,0.2)",
            borderRadius: 20, padding: "36px 50px",
          }}>
            <div style={{ fontSize: 20, color: "rgba(20,184,166,0.7)", marginBottom: 24, letterSpacing: 2 }}>交易记录</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 24 }}>
              {[
                { label: "入场价位", val: record.tradeRecord.entryPrice, color: "#fff" },
                { label: "止盈 TP",  val: record.tradeRecord.takeProfit,  color: "#fff" },
                { label: "止损 SL",  val: record.tradeRecord.stopLoss,    color: "#ef4444" },
                { label: "实际盈亏", val: pnl, color: pnl !== undefined && pnl >= 0 ? "#10b981" : "#ef4444" },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 17, color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>{label}</div>
                  <div style={{ fontSize: 30, fontWeight: 800, color, fontFamily: "'Fira Code', monospace" }}>
                    {val !== undefined ? (label === "实际盈亏" && (val as number) >= 0 ? `+${val}` : String(val)) : "—"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      {record.notes && (
        <div style={{ padding: "32px 80px 0", flexShrink: 0 }}>
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16, padding: "28px 36px",
          }}>
            <div style={{ fontSize: 18, color: "rgba(255,255,255,0.3)", marginBottom: 12 }}>备注</div>
            <div style={{ fontSize: 22, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>{record.notes}</div>
          </div>
        </div>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Footer */}
      <div style={{
        padding: "40px 80px 60px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        flexShrink: 0,
      }}>
        <div style={{ fontSize: 20, color: "rgba(255,255,255,0.2)" }}>SWEA MI6 · Signal Analyzer</div>
        <div style={{ fontSize: 20, color: "rgba(255,255,255,0.2)" }}>Traderpreneur Community</div>
      </div>

      {/* Bottom accent */}
      <div style={{ height: 6, background: `linear-gradient(90deg, transparent, ${accentColor})`, flexShrink: 0 }} />
    </div>
  );
});

ShareCard.displayName = "ShareCard";
export default ShareCard;
