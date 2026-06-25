// SWEA MI6 — Analyzer Page (Plan C Redesign)
// Design: Financial Professional Deep Blue
// Layout: Two-column indicator grid + sticky verdict panel (desktop)

import { useState, useCallback, useRef } from "react";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import {
  Save, RotateCcw, Download, Calendar, ChevronDown, ChevronUp,
  ImagePlus, X, ZoomIn,
} from "lucide-react";
import {
  INDICATOR_DEFINITIONS,
  COMMON_PAIRS,
  TIMEFRAMES,
  createDefaultIndicators,
  calculateVerdict,
  getVerdictColor,
  type AnalysisRecord,
  type IndicatorValue,
} from "@/lib/swea-data";
import { apiSaveRecord } from "@/lib/api";
import IndicatorCard from "@/components/IndicatorCard";
import VerdictCard from "@/components/VerdictCard";

const PA_INDICATORS = ["candlestick", "chartPattern", "trendPattern"] as const;
const TA_INDICATORS = ["fibonacci", "bollingerBand", "movingAverage"] as const;

const SIGNAL_LABELS: Record<string, string> = {
  strong_bullish: "强烈多头",
  bullish: "多头信号",
  strong_bearish: "强烈空头",
  bearish: "空头信号",
  mixed: "信号混合",
  no_signal: "无明确信号",
};

export default function AnalyzerPage() {
  const [pair, setPair] = useState("EURUSD");
  const [customPair, setCustomPair] = useState("");
  const [showCustomPair, setShowCustomPair] = useState(false);
  const [timeframe, setTimeframe] = useState("H4");
  const [notes, setNotes] = useState("");
  const [indicators, setIndicators] = useState(createDefaultIndicators());
  const [chartImage, setChartImage] = useState<string | undefined>(undefined);
  const [mobileVerdictOpen, setMobileVerdictOpen] = useState(false);
  const [chartLightbox, setChartLightbox] = useState(false);
  const chartFileRef = useRef<HTMLInputElement>(null);

  const activePair = showCustomPair && customPair ? customPair.toUpperCase() : pair;
  const verdict = calculateVerdict(indicators);

  const handleIndicatorChange = useCallback(
    (id: keyof typeof indicators, value: IndicatorValue) => {
      setIndicators((prev) => ({ ...prev, [id]: value }));
    },
    []
  );

  const handleReset = () => {
    setIndicators(createDefaultIndicators());
    setNotes("");
    setChartImage(undefined);
    toast.info("已重置所有指标");
  };

  const handleSave = async () => {
    const record: AnalysisRecord = {
      id: nanoid(),
      pair: activePair,
      timeframe,
      date: new Date().toISOString(),
      indicators,
      verdict,
      chartImage,
      notes: notes.trim() || undefined,
    };
    try {
      await apiSaveRecord(record);
      toast.success(`已保存 ${activePair} ${timeframe} 分析记录`);
    } catch {
      toast.error("保存失败，请重试");
    }
  };

  const handleChartUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { toast.error("图片大小不能超过 8MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setChartImage(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleExportPDF = () => {
    const content = buildPrintContent(activePair, timeframe, indicators, verdict, notes, chartImage);
    const w = window.open("", "_blank");
    if (w) { w.document.write(content); w.document.close(); w.focus(); setTimeout(() => w.print(), 600); }
  };

  const verdictColorClass = getVerdictColor(verdict.signal);

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Sticky Header ── */}
      <div className="border-b border-white/8 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-1 flex-wrap">
              {showCustomPair ? (
                <input
                  type="text"
                  value={customPair}
                  onChange={(e) => setCustomPair(e.target.value)}
                  placeholder="输入交易对..."
                  className="h-9 px-3 rounded-lg border border-white/10 bg-slate-800 text-slate-100 text-sm font-mono w-32 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
                  onBlur={() => { if (!customPair) setShowCustomPair(false); }}
                  autoFocus
                />
              ) : (
                <select
                  value={pair}
                  onChange={(e) => { if (e.target.value === "__custom__") setShowCustomPair(true); else setPair(e.target.value); }}
                  className="h-9 px-3 rounded-lg border border-white/10 bg-slate-800 text-slate-100 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-amber-500/40"
                >
                  {COMMON_PAIRS.map((p) => <option key={p} value={p}>{p}</option>)}
                  <option value="__custom__">+ 自定义...</option>
                </select>
              )}
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="h-9 px-3 rounded-lg border border-white/10 bg-slate-800 text-slate-100 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              >
                {TIMEFRAMES.map((tf) => <option key={tf} value={tf}>{tf}</option>)}
              </select>
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono">
                <Calendar size={11} />
                {new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleReset} className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-white/10 text-slate-500 hover:text-slate-300 hover:bg-slate-800 text-xs transition-all duration-150 active:scale-[0.97]">
                <RotateCcw size={12} />
                <span className="hidden sm:inline">重置</span>
              </button>
              <button onClick={handleExportPDF} className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-white/10 text-slate-500 hover:text-slate-300 hover:bg-slate-800 text-xs transition-all duration-150 active:scale-[0.97]">
                <Download size={12} />
                <span className="hidden sm:inline">导出 PDF</span>
              </button>
              <button onClick={handleSave} className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-amber-500 text-slate-900 text-xs font-bold hover:bg-amber-400 transition-all duration-150 active:scale-[0.97]">
                <Save size={12} />
                保存记录
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-5">
        <div className="flex gap-6">

          {/* Left: Indicators */}
          <div className="flex-1 min-w-0 space-y-6 pb-28 xl:pb-6">

            {/* Overall Chart Upload */}
            <div className="rounded-xl border border-white/8 bg-slate-800/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold text-amber-500/80" style={{ fontFamily: "'Sora', sans-serif" }}>整体行情图表</span>
                <span className="text-[10px] text-slate-600">（可选）上传当前行情截图，随记录一起保存</span>
              </div>
              {chartImage ? (
                <div className="relative group rounded-lg overflow-hidden border border-white/10">
                  <img src={chartImage} alt="行情图表" className="w-full h-40 object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button onClick={() => setChartLightbox(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors">
                      <ZoomIn size={13} />查看
                    </button>
                    <button onClick={() => setChartImage(undefined)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-medium transition-colors">
                      <X size={13} />删除
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => chartFileRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-5 rounded-lg border border-dashed border-white/10 text-slate-600 hover:border-amber-500/30 hover:text-amber-500/60 text-sm transition-all duration-150"
                >
                  <ImagePlus size={16} />
                  <span>点击上传整体行情图表截图</span>
                </button>
              )}
              <input ref={chartFileRef} type="file" accept="image/*" className="hidden" onChange={handleChartUpload} />
            </div>

            {/* PA Section */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[10px] font-bold px-2 py-1 rounded border text-sky-400 bg-sky-500/10 border-sky-500/20 font-mono tracking-wider">PA</span>
                <h2 className="text-sm font-bold text-slate-200" style={{ fontFamily: "'Sora', sans-serif" }}>
                  价格行为 · Price Action
                </h2>
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-[10px] text-slate-600">3 项指标</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {PA_INDICATORS.map((id, i) => (
                  <IndicatorCard
                    key={id}
                    indicator={INDICATOR_DEFINITIONS[id] as any}
                    value={indicators[id]}
                    onChange={(v) => handleIndicatorChange(id, v)}
                    index={i}
                  />
                ))}
              </div>
            </div>

            {/* TA Section */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[10px] font-bold px-2 py-1 rounded border text-violet-400 bg-violet-500/10 border-violet-500/20 font-mono tracking-wider">TA</span>
                <h2 className="text-sm font-bold text-slate-200" style={{ fontFamily: "'Sora', sans-serif" }}>
                  技术分析 · Technical Analysis
                </h2>
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-[10px] text-slate-600">3 项指标</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {TA_INDICATORS.map((id, i) => (
                  <IndicatorCard
                    key={id}
                    indicator={INDICATOR_DEFINITIONS[id] as any}
                    value={indicators[id]}
                    onChange={(v) => handleIndicatorChange(id, v)}
                    index={i + 3}
                  />
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>
                交易备注 <span className="text-slate-700 font-normal">（可选）</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="记录你的分析思路、入场理由、风险提示、目标价位等..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-white/8 bg-slate-800/40 text-sm text-slate-200 placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500/30 resize-none"
              />
            </div>
          </div>

          {/* Right: Verdict Panel (desktop xl+) */}
          <div className="hidden xl:block w-72 flex-shrink-0">
            <div className="sticky top-24 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-sm font-bold text-slate-300" style={{ fontFamily: "'Sora', sans-serif" }}>MI6 信号判断</h2>
                <div className="flex-1 h-px bg-white/5" />
              </div>

              <VerdictCard verdict={verdict} />

              {/* Quick summary */}
              <div className="rounded-xl border border-white/8 bg-slate-800/30 p-4 space-y-2">
                <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">指标状态摘要</h3>
                <div className="space-y-2">
                  {[...PA_INDICATORS, ...TA_INDICATORS].map((id) => {
                    const def = INDICATOR_DEFINITIONS[id];
                    const val = indicators[id];
                    return (
                      <div key={id} className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <span className="text-[11px] text-slate-500 truncate block">{def.name}</span>
                          {val.notes && (
                            <span className="text-[10px] text-slate-700 truncate block">{val.notes}</span>
                          )}
                        </div>
                        <span className={`text-[11px] font-bold flex-shrink-0 ${
                          val.state === "bullish" ? "text-emerald-400" :
                          val.state === "bearish" ? "text-red-400" : "text-slate-600"
                        }`}>
                          {val.state === "bullish" ? "▲" : val.state === "bearish" ? "▼" : "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* MI6 Signal Rule */}
              <div className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-4">
                <h3 className="text-[10px] font-bold text-amber-500/80 mb-2.5 tracking-wider">MI6 信号触发标准</h3>
                <div className="space-y-1.5 text-[11px] text-slate-500">
                  <div className="flex gap-2"><span className="text-emerald-400">●</span><span>5-6 项看涨 → 强烈多头 ★★★</span></div>
                  <div className="flex gap-2"><span className="text-emerald-600">●</span><span>4 项看涨 → 多头信号 ★★</span></div>
                  <div className="flex gap-2"><span className="text-red-400">●</span><span>5-6 项看跌 → 强烈空头 ★★★</span></div>
                  <div className="flex gap-2"><span className="text-red-600">●</span><span>4 项看跌 → 空头信号 ★★</span></div>
                  <div className="flex gap-2"><span className="text-amber-400">●</span><span>多空相近 → 信号混合，观望</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile: Floating verdict bar ── */}
      <div className="xl:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-white/8 bg-slate-900/95 backdrop-blur-sm">
        {mobileVerdictOpen && (
          <div className="p-4 border-b border-white/8 max-h-[65vh] overflow-y-auto">
            <VerdictCard verdict={verdict} />
            <div className="mt-4 rounded-xl border border-amber-500/15 bg-amber-500/5 p-4">
              <h3 className="text-[10px] font-bold text-amber-500/80 mb-2 tracking-wider">MI6 信号触发标准</h3>
              <div className="space-y-1.5 text-[11px] text-slate-500">
                <div className="flex gap-2"><span className="text-emerald-400">●</span><span>5-6 项看涨 → 强烈多头 ★★★</span></div>
                <div className="flex gap-2"><span className="text-emerald-600">●</span><span>4 项看涨 → 多头信号 ★★</span></div>
                <div className="flex gap-2"><span className="text-red-400">●</span><span>5-6 项看跌 → 强烈空头 ★★★</span></div>
                <div className="flex gap-2"><span className="text-red-600">●</span><span>4 项看跌 → 空头信号 ★★</span></div>
                <div className="flex gap-2"><span className="text-amber-400">●</span><span>多空相近 → 信号混合，观望</span></div>
              </div>
            </div>
          </div>
        )}
        <button
          onClick={() => setMobileVerdictOpen(!mobileVerdictOpen)}
          className="w-full flex items-center gap-3 px-4 py-3"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className={`text-sm font-bold ${verdictColorClass}`}>{SIGNAL_LABELS[verdict.signal]}</span>
            <span className="text-xs text-slate-600 font-mono">↑{verdict.bullishCount} ↓{verdict.bearishCount}</span>
            <span className="text-xs text-amber-500/70 font-mono">{verdict.confidence}%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {Array.from({ length: 6 }).map((_, i) => {
                let dotColor = "bg-slate-700";
                if (i < verdict.bullishCount) dotColor = "bg-emerald-500";
                else if (i < verdict.bullishCount + verdict.bearishCount) dotColor = "bg-red-500";
                return <div key={i} className={`w-2 h-2 rounded-full ${dotColor}`} />;
              })}
            </div>
            {mobileVerdictOpen ? <ChevronDown size={15} className="text-slate-500" /> : <ChevronUp size={15} className="text-slate-500" />}
          </div>
        </button>
      </div>

      {/* Chart lightbox */}
      {chartLightbox && chartImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setChartLightbox(false)}>
          <button className="absolute top-4 right-4 text-white/60 hover:text-white" onClick={() => setChartLightbox(false)}><X size={24} /></button>
          <img src={chartImage} alt="行情图表" className="max-w-full max-h-full rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

// ─── PDF Export ───────────────────────────────────────────────────────────────

function buildPrintContent(
  pair: string, timeframe: string,
  indicators: AnalysisRecord["indicators"],
  verdict: ReturnType<typeof calculateVerdict>,
  notes: string, chartImage?: string
): string {
  const date = new Date().toLocaleString("zh-CN");
  const indicatorNames: Record<string, string> = {
    candlestick: "蜡烛形态 (Candlestick Pattern)",
    chartPattern: "图表形态 (Chart Pattern)",
    trendPattern: "趋势形态 (Trend Pattern)",
    fibonacci: "斐波那契 (Fibonacci)",
    bollingerBand: "布林带 (Bollinger Band)",
    movingAverage: "均线 MA20 (Moving Average 20)",
  };
  const indicatorRows = Object.entries(indicators).map(([key, val]) => {
    const stateLabel = val.state === "bullish" ? "▲ 看涨" : val.state === "bearish" ? "▼ 看跌" : "— 中性";
    const stateColor = val.state === "bullish" ? "#10b981" : val.state === "bearish" ? "#ef4444" : "#6b7280";
    return `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-weight:600;">${indicatorNames[key] ?? key}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:${stateColor};font-weight:bold;">${stateLabel}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:12px;">${val.notes || "—"}</td>
    </tr>`;
  }).join("");

  const verdictColor = verdict.signal.includes("bullish") ? "#10b981" : verdict.signal.includes("bearish") ? "#ef4444" : "#f59e0b";
  const stars = verdict.signal === "strong_bullish" || verdict.signal === "strong_bearish" ? "★★★" :
    verdict.signal === "bullish" || verdict.signal === "bearish" ? "★★☆" :
    verdict.signal === "mixed" ? "★☆☆" : "☆☆☆";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>SWEA MI6 分析报告 — ${pair} ${timeframe}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 750px; margin: 0 auto; padding: 32px; color: #111; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .meta { color: #6b7280; font-size: 13px; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { background: #f9fafb; padding: 10px 12px; text-align: left; font-size: 11px; color: #6b7280; border-bottom: 2px solid #e5e7eb; text-transform: uppercase; letter-spacing: 0.05em; }
    .verdict-box { border: 2px solid ${verdictColor}; border-radius: 10px; padding: 20px; margin-bottom: 24px; }
    .verdict-title { font-size: 22px; font-weight: bold; color: ${verdictColor}; }
    .verdict-stars { font-size: 18px; color: ${verdictColor}; margin-bottom: 8px; }
    .score-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 16px; }
    .score-item { text-align: center; padding: 12px; border-radius: 8px; }
    .notes { background: #f9fafb; border-radius: 8px; padding: 14px; font-size: 13px; color: #374151; margin-bottom: 20px; }
    .chart-img { width: 100%; border-radius: 8px; margin-bottom: 24px; border: 1px solid #e5e7eb; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <h1>SWEA MI6 信号分析报告</h1>
  <div class="meta">交易对：<strong>${pair}</strong> &nbsp;|&nbsp; 时间框架：<strong>${timeframe}</strong> &nbsp;|&nbsp; 分析时间：${date}</div>
  ${chartImage ? `<img src="${chartImage}" class="chart-img" alt="行情图表" />` : ""}
  <div class="verdict-box">
    <div class="verdict-stars">${stars}</div>
    <div class="verdict-title">${verdict.label}</div>
    <div style="color:#6b7280;font-size:13px;margin-top:6px;">${verdict.description}</div>
    <div class="score-grid">
      <div class="score-item" style="background:#d1fae5;color:#065f46;"><div style="font-size:28px;font-weight:bold;">${verdict.bullishCount}</div><div style="font-size:11px;margin-top:4px;">看涨 BULL</div></div>
      <div class="score-item" style="background:#fee2e2;color:#991b1b;"><div style="font-size:28px;font-weight:bold;">${verdict.bearishCount}</div><div style="font-size:11px;margin-top:4px;">看跌 BEAR</div></div>
      <div class="score-item" style="background:#f3f4f6;color:#6b7280;"><div style="font-size:28px;font-weight:bold;">${verdict.neutralCount}</div><div style="font-size:11px;margin-top:4px;">中性 NEU</div></div>
    </div>
    <div style="margin-top:12px;font-size:13px;color:#6b7280;">净值：<strong style="color:${verdictColor}">${verdict.netScore > 0 ? "+" : ""}${verdict.netScore}</strong> &nbsp;|&nbsp; 可信度：<strong style="color:${verdictColor}">${verdict.confidence}%</strong></div>
  </div>
  <table>
    <thead><tr><th>指标</th><th>方向</th><th>分析备注</th></tr></thead>
    <tbody>${indicatorRows}</tbody>
  </table>
  ${notes ? `<div><strong>交易备注：</strong><div class="notes">${notes}</div></div>` : ""}
  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;">由 SWEA MI6 Signal Analyzer 生成 · Traderpreneur Community · 本工具仅供学习参考，不构成投资建议</div>
</body>
</html>`;
}
