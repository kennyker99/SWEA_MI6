import type { AnalysisRecord } from "./swea-data";

const W = 1080;
const H = 1920;

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

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function truncate(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 0 && ctx.measureText(t + "…").width > maxW) t = t.slice(0, -1);
  return t + "…";
}

export async function generateShareImage(record: AnalysisRecord): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const isBull = record.verdict.signal.includes("bullish");
  const isBear = record.verdict.signal.includes("bearish");
  const accent = isBull ? "#10b981" : isBear ? "#ef4444" : "#f59e0b";
  const accentAlpha = isBull ? "rgba(16,185,129," : isBear ? "rgba(239,68,68," : "rgba(245,158,11,";

  // ── Background ──────────────────────────────────────────────────────────────
  const bgGrad = ctx.createLinearGradient(0, 0, W * 0.5, H);
  bgGrad.addColorStop(0,   "#0a0f1e");
  bgGrad.addColorStop(0.4, "#0d1a2e");
  bgGrad.addColorStop(1,   "#0a0a1a");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = "rgba(255,255,255,0.022)";
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // Top accent bar
  const topGrad = ctx.createLinearGradient(0, 0, W * 0.6, 0);
  topGrad.addColorStop(0, accent);
  topGrad.addColorStop(1, "transparent");
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, W, 6);

  let curY = 80;

  // ── Header ──────────────────────────────────────────────────────────────────
  // M6 badge
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  roundRect(ctx, 80, curY, 60, 60, 14); ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.12)"; ctx.lineWidth = 1.5;
  roundRect(ctx, 80, curY, 60, 60, 14); ctx.stroke();
  ctx.fillStyle = accent;
  ctx.font = "bold 22px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("M6", 110, curY + 39);

  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "bold 22px Arial, sans-serif";
  ctx.fillText("SWEA MI6", 158, curY + 26);
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.font = "16px Arial, sans-serif";
  ctx.fillText("Signal Analyzer", 158, curY + 50);

  const dateStr = new Date(record.date).toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" });
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.font = "16px Arial, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(dateStr, W - 80, curY + 38);
  ctx.textAlign = "left";

  curY += 96;

  // ── Pair + timeframe ────────────────────────────────────────────────────────
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 100px Arial, sans-serif";
  ctx.fillText(record.pair, 80, curY + 88);
  const pairW = ctx.measureText(record.pair).width;

  const tfX = 80 + pairW + 24;
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  roundRect(ctx, tfX, curY + 44, 110, 48, 10); ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.15)"; ctx.lineWidth = 1;
  roundRect(ctx, tfX, curY + 44, 110, 48, 10); ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "bold 28px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(record.timeframe, tfX + 55, curY + 76);
  ctx.textAlign = "left";

  curY += 128;

  // ── Signal verdict ──────────────────────────────────────────────────────────
  const sigText = SIGNAL_LABELS[record.verdict.signal] || "";
  ctx.font = "bold 56px Arial, sans-serif";
  const sigW = ctx.measureText(sigText).width + 80;
  ctx.fillStyle = accentAlpha + "0.12)";
  roundRect(ctx, 80, curY, sigW, 94, 16); ctx.fill();
  ctx.strokeStyle = accent; ctx.lineWidth = 2;
  roundRect(ctx, 80, curY, sigW, 94, 16); ctx.stroke();
  ctx.fillStyle = accent;
  ctx.fillText(sigText, 120, curY + 64);

  curY += 120;

  // ── Chart image ─────────────────────────────────────────────────────────────
  if (record.chartImage) {
    try {
      const img = await loadImage(record.chartImage);
      const imgH = 440;
      ctx.save();
      roundRect(ctx, 80, curY, W - 160, imgH, 20);
      ctx.clip();
      ctx.drawImage(img, 80, curY, W - 160, imgH);
      ctx.restore();
      // Subtle border
      ctx.strokeStyle = "rgba(255,255,255,0.1)"; ctx.lineWidth = 1.5;
      roundRect(ctx, 80, curY, W - 160, imgH, 20); ctx.stroke();
      curY += imgH + 52;
    } catch { /* skip image on error */ }
  }

  // ── Score boxes ─────────────────────────────────────────────────────────────
  const scoreData = [
    { label: "看涨 BULL", val: record.verdict.bullishCount, color: "#10b981", bg: "rgba(16,185,129,0.12)" },
    { label: "看跌 BEAR", val: record.verdict.bearishCount, color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
    { label: "中性 NEU",  val: record.verdict.neutralCount,  color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
  ];
  const sbW = (W - 160 - 40) / 3;
  scoreData.forEach(({ label, val, color, bg }, i) => {
    const bx = 80 + i * (sbW + 20);
    ctx.fillStyle = bg;
    roundRect(ctx, bx, curY, sbW, 140, 16); ctx.fill();
    ctx.fillStyle = color;
    ctx.font = "900 76px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(val), bx + sbW / 2, curY + 102);
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "18px Arial, sans-serif";
    ctx.fillText(label, bx + sbW / 2, curY + 128);
  });
  ctx.textAlign = "left";
  curY += 168;

  // ── Confidence bar ──────────────────────────────────────────────────────────
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "20px Arial, sans-serif";
  ctx.fillText("信号可信度", 80, curY + 22);
  ctx.fillStyle = accent;
  ctx.font = "bold 20px Arial, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(`${record.verdict.confidence}%`, W - 80, curY + 22);
  ctx.textAlign = "left";

  const barW = W - 160;
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  roundRect(ctx, 80, curY + 34, barW, 12, 6); ctx.fill();
  const fillGrad = ctx.createLinearGradient(80, 0, 80 + barW, 0);
  fillGrad.addColorStop(0, accent);
  fillGrad.addColorStop(1, accentAlpha + "0.5)");
  ctx.fillStyle = fillGrad;
  roundRect(ctx, 80, curY + 34, barW * record.verdict.confidence / 100, 12, 6); ctx.fill();
  curY += 80;

  // ── Indicators grid ─────────────────────────────────────────────────────────
  const indEntries = Object.entries(record.indicators);
  const COLS = 3;
  const indW = (W - 160 - (COLS - 1) * 20) / COLS;
  const indH = 128;

  indEntries.forEach(([key, val], i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const bx = 80 + col * (indW + 20);
    const by = curY + row * (indH + 18);

    ctx.fillStyle = "rgba(255,255,255,0.03)";
    roundRect(ctx, bx, by, indW, indH, 14); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.07)"; ctx.lineWidth = 1;
    roundRect(ctx, bx, by, indW, indH, 14); ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = "17px Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(INDICATOR_NAMES[key] || key, bx + 18, by + 34);

    const arrow = val.state === "bullish" ? "▲" : val.state === "bearish" ? "▼" : "—";
    const arrowColor = val.state === "bullish" ? "#10b981" : val.state === "bearish" ? "#ef4444" : "#6b7280";
    ctx.fillStyle = arrowColor;
    ctx.font = "bold 30px Arial, sans-serif";
    ctx.fillText(arrow, bx + 18, by + 74);

    if (val.notes) {
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "14px Arial, sans-serif";
      ctx.fillText(truncate(ctx, val.notes, indW - 36), bx + 18, by + 104);
    }
  });

  curY += Math.ceil(indEntries.length / COLS) * (indH + 18) + 28;

  // ── Trade record ─────────────────────────────────────────────────────────────
  const tr = record.tradeRecord;
  if (tr && (tr.entryPrice !== undefined || tr.actualPnl !== undefined)) {
    ctx.fillStyle = "rgba(20,184,166,0.08)";
    roundRect(ctx, 80, curY, W - 160, 152, 20); ctx.fill();
    ctx.strokeStyle = "rgba(20,184,166,0.2)"; ctx.lineWidth = 1;
    roundRect(ctx, 80, curY, W - 160, 152, 20); ctx.stroke();

    ctx.fillStyle = "rgba(20,184,166,0.7)";
    ctx.font = "bold 18px Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("交易记录", 120, curY + 38);

    if (tr.status) {
      const statusTxt = tr.status === "closed" ? "已完结" : "进行中";
      const statusColor = tr.status === "closed" ? "#14b8a6" : "#f59e0b";
      ctx.fillStyle = statusColor;
      ctx.font = "bold 16px Arial, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(statusTxt, W - 120, curY + 38);
    }

    const fields = [
      { label: "入场价位", val: tr.entryPrice, color: "#ffffff" },
      { label: "止盈 TP",  val: tr.takeProfit,  color: "#ffffff" },
      { label: "止损 SL",  val: tr.stopLoss,    color: "#ef4444" },
      { label: "实际盈亏", val: tr.actualPnl,   color: (tr.actualPnl ?? 0) >= 0 ? "#10b981" : "#ef4444" },
    ];
    const fW = (W - 200) / 4;
    fields.forEach(({ label, val, color }, i) => {
      const fx = 100 + i * fW;
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.font = "16px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(label, fx + fW / 2, curY + 80);
      ctx.fillStyle = color;
      ctx.font = "bold 28px Arial, sans-serif";
      const display = val !== undefined
        ? (label === "实际盈亏" && (val as number) >= 0 ? `+${val}` : String(val))
        : "—";
      ctx.fillText(display, fx + fW / 2, curY + 120);
    });
    ctx.textAlign = "left";
    curY += 176;
  }

  // ── Notes ───────────────────────────────────────────────────────────────────
  if (record.notes && curY < H - 200) {
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    roundRect(ctx, 80, curY, W - 160, 96, 16); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.07)"; ctx.lineWidth = 1;
    roundRect(ctx, 80, curY, W - 160, 96, 16); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "17px Arial, sans-serif";
    ctx.fillText("备注", 112, curY + 32);
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "22px Arial, sans-serif";
    ctx.fillText(truncate(ctx, record.notes, W - 280), 112, curY + 70);
  }

  // ── Footer ──────────────────────────────────────────────────────────────────
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(80, H - 100, W - 160, 1);
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.font = "20px Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("SWEA MI6 · Signal Analyzer", 80, H - 56);
  ctx.textAlign = "right";
  ctx.fillText("Traderpreneur Community", W - 80, H - 56);
  ctx.textAlign = "left";

  // Bottom accent bar
  const botGrad = ctx.createLinearGradient(W * 0.4, 0, W, 0);
  botGrad.addColorStop(0, "transparent");
  botGrad.addColorStop(1, accent);
  ctx.fillStyle = botGrad;
  ctx.fillRect(0, H - 6, W, 6);

  return canvas.toDataURL("image/png");
}
