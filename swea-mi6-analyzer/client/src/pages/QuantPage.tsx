// SWEA MI6 — Quantitative Analysis Page
// 10 大量化指标: 胜率、最大回撤、仓位管理、期望值、盈亏比、风险框架、夏普比率、杠杆倍数、凯利公式、复利增长

import { useState, useEffect, useRef, useCallback } from "react";
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, XCircle,
  RotateCcw, ChevronDown, ChevronUp, Info,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface IndicatorState {
  // 1. 胜率
  winTrades: number;
  totalTrades: number;
  // 2. 最大回撤
  peakValue: number;
  troughValue: number;
  // 3. 仓位管理
  accountFunds: number;
  riskPercent: number;
  stopLoss: number;
  // 4. 期望值
  expWinRate: number;
  avgProfit: number;
  avgLoss: number;
  // 5. 盈亏比
  rrProfit: number;
  rrLoss: number;
  // 6. 风险框架
  singleRisk: number;
  trailingStop: string;
  fixedSystem: string;
  // 7. 夏普比率
  annualReturn: number;
  riskFreeRate: number;
  volatility: number;
  // 8. 杠杆倍数
  netValue: number;
  totalPosition: number;
  assetType: string;
  // 9. 凯利公式
  kellyWinRate: number;
  kellyRatio: number;
  // 10. 复利增长
  principal: number;
  annualRate: number;
  compoundFreq: number;
  investYears: number;
}

const DEFAULT_STATE: IndicatorState = {
  winTrades: 60, totalTrades: 100,
  peakValue: 10000, troughValue: 8500,
  accountFunds: 10000, riskPercent: 1, stopLoss: 50,
  expWinRate: 55, avgProfit: 200, avgLoss: 100,
  rrProfit: 200, rrLoss: 100,
  singleRisk: 1, trailingStop: "yes", fixedSystem: "yes",
  annualReturn: 20, riskFreeRate: 4, volatility: 15,
  netValue: 10000, totalPosition: 15000, assetType: "stock",
  kellyWinRate: 55, kellyRatio: 2,
  principal: 10000, annualRate: 15, compoundFreq: 1, investYears: 10,
};

// ─── Calculations ─────────────────────────────────────────────────────────────

function calcAll(s: IndicatorState) {
  const winRate = s.totalTrades > 0 ? s.winTrades / s.totalTrades : 0;
  const mdd = s.peakValue > 0 ? ((s.peakValue - s.troughValue) / s.peakValue) * 100 : 0;
  const positionSize = s.stopLoss > 0 ? (s.accountFunds * s.riskPercent / 100) / s.stopLoss : 0;
  const expectancy = (s.expWinRate / 100) * s.avgProfit - (1 - s.expWinRate / 100) * s.avgLoss;
  const rr = s.rrLoss > 0 ? s.rrProfit / s.rrLoss : 0;
  const sharpe = s.volatility > 0 ? (s.annualReturn - s.riskFreeRate) / s.volatility : 0;
  const leverage = s.netValue > 0 ? s.totalPosition / s.netValue : 0;
  const kellyF = s.kellyRatio > 0
    ? ((s.kellyWinRate / 100) * s.kellyRatio - (1 - s.kellyWinRate / 100)) / s.kellyRatio
    : 0;
  const finalAmount = s.principal * Math.pow(1 + s.annualRate / 100, s.investYears);
  const totalReturn = s.principal > 0 ? ((finalAmount - s.principal) / s.principal) * 100 : 0;
  const profitFactor = s.avgLoss > 0 ? s.avgProfit / s.avgLoss : 0;

  return { winRate, mdd, positionSize, expectancy, rr, sharpe, leverage, kellyF, totalReturn, finalAmount, profitFactor };
}

function calcScore(s: IndicatorState): number {
  const c = calcAll(s);
  let score = 0;
  score += c.winRate >= 0.5 ? 10 : c.winRate >= 0.3 ? 5 : 0;
  score += c.mdd < 10 ? 10 : c.mdd < 20 ? 8 : c.mdd < 30 ? 5 : 0;
  score += c.sharpe > 3 ? 10 : c.sharpe > 2 ? 8 : c.sharpe > 1 ? 5 : 0;
  score += c.kellyF > 0.1 ? 10 : c.kellyF > 0 ? 5 : 0;
  score += c.rr >= 2 ? 10 : c.rr >= 1.5 ? 8 : c.rr >= 1 ? 5 : 0;
  score += c.expectancy > 0 ? 10 : 0;
  score += c.profitFactor >= 1.5 ? 10 : c.profitFactor >= 1 ? 8 : 0;
  score += c.leverage <= 2 ? 10 : c.leverage <= 3 ? 8 : c.leverage <= 5 ? 5 : 0;
  score += s.riskPercent <= 2 ? 10 : s.riskPercent <= 3 ? 8 : s.riskPercent <= 5 ? 5 : 0;
  score += c.totalReturn >= 500 ? 10 : c.totalReturn >= 200 ? 8 : c.totalReturn >= 50 ? 5 : 0;
  return Math.min(100, score);
}

// ─── Compound Growth Canvas ───────────────────────────────────────────────────

function CompoundChart({ principal, investYears }: { principal: number; investYears: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;
    const pad = { top: 30, right: 20, bottom: 40, left: 65 };
    const cW = W - pad.left - pad.right;
    const cH = H - pad.top - pad.bottom;

    // Background
    ctx.fillStyle = "#050d1a";
    ctx.fillRect(0, 0, W, H);

    const rates = [10, 15, 20];
    const colors = ["#38bdf8", "#f0b429", "#10b981"];
    const years = Math.max(1, Math.round(investYears));

    // Global max
    let maxVal = principal;
    rates.forEach((r) => {
      const v = principal * Math.pow(1 + r / 100, years);
      if (v > maxVal) maxVal = v;
    });
    const minVal = principal;
    const range = maxVal - minVal || 1;

    // Grid
    ctx.strokeStyle = "#1e3a5f";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = pad.top + cH - (i / 5) * cH;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + cW, y);
      ctx.stroke();
    }
    for (let i = 0; i <= Math.min(years, 10); i++) {
      const x = pad.left + (i / years) * cW;
      ctx.beginPath();
      ctx.moveTo(x, pad.top);
      ctx.lineTo(x, pad.top + cH);
      ctx.stroke();
    }

    // Curves
    rates.forEach((rate, ri) => {
      ctx.strokeStyle = colors[ri];
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let yr = 0; yr <= years; yr++) {
        const v = principal * Math.pow(1 + rate / 100, yr);
        const x = pad.left + (yr / years) * cW;
        const y = pad.top + cH - ((v - minVal) / range) * cH;
        yr === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();

      // End label
      const endV = principal * Math.pow(1 + rate / 100, years);
      const endX = pad.left + cW;
      const endY = pad.top + cH - ((endV - minVal) / range) * cH;
      ctx.fillStyle = colors[ri];
      ctx.font = "bold 10px Sora, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`${rate}%`, endX - 24, endY - 6);
    });

    // Axes
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top);
    ctx.lineTo(pad.left, pad.top + cH);
    ctx.lineTo(pad.left + cW, pad.top + cH);
    ctx.stroke();

    // X labels
    ctx.fillStyle = "#64748b";
    ctx.font = "10px Sora, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const step = Math.ceil(years / 5);
    for (let i = 0; i <= years; i += step) {
      const x = pad.left + (i / years) * cW;
      ctx.fillText(`${i}yr`, x, pad.top + cH + 8);
    }

    // Y labels
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let i = 0; i <= 5; i++) {
      const v = minVal + (range / 5) * i;
      const y = pad.top + cH - (i / 5) * cH;
      const label = v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M`
        : v >= 1000 ? `$${(v / 1000).toFixed(0)}k`
        : `$${v.toFixed(0)}`;
      ctx.fillStyle = "#64748b";
      ctx.font = "10px Sora, sans-serif";
      ctx.fillText(label, pad.left - 6, y);
    }

    // Legend
    rates.forEach((rate, ri) => {
      const lx = pad.left + ri * 70;
      const ly = 14;
      ctx.fillStyle = colors[ri];
      ctx.fillRect(lx, ly - 4, 18, 3);
      ctx.font = "10px Sora, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(`${rate}% 年化`, lx + 22, ly);
    });
  }, [principal, investYears]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%" }}
    />
  );
}

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 70 ? "#10b981" : score >= 50 ? "#f0b429" : "#ef4444";
  const label = score >= 70 ? "优秀" : score >= 50 ? "合格" : "不足";

  return (
    <div className="relative flex items-center justify-center w-36 h-36">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={r} fill="none" stroke="#1e3a5f" strokeWidth="10" />
        <circle
          cx="64" cy="64" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <div className="text-center z-10">
        <div className="text-3xl font-bold font-mono" style={{ color }}>{score}</div>
        <div className="text-xs font-semibold" style={{ color }}>{label}</div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number, dec = 2) {
  if (!isFinite(n)) return "—";
  return n.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function GradeChip({ level }: { level: "great" | "good" | "ok" | "bad" }) {
  const map = {
    great: { label: "优秀", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
    good:  { label: "良好", cls: "bg-sky-500/15 text-sky-400 border-sky-500/30" },
    ok:    { label: "一般", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
    bad:   { label: "需改进", cls: "bg-red-500/15 text-red-400 border-red-500/30" },
  }[level];
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${map.cls}`}>
      {map.label}
    </span>
  );
}

function NumInput({
  label, value, onChange, unit, step = "any", min,
}: {
  label: string; value: number; onChange: (v: number) => void;
  unit?: string; step?: string; min?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] text-slate-500 mb-1">{label}</label>
      <div className="relative">
        <input
          type="number" step={step} min={min ?? "0"}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full h-8 px-2.5 pr-8 rounded-lg border border-white/8 bg-slate-800/60 text-xs font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
        />
        {unit && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-600 pointer-events-none">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

function SelectInput({
  label, value, onChange, options,
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-[10px] text-slate-500 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-8 px-2.5 rounded-lg border border-white/8 bg-slate-800/60 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ─── Indicator Card ───────────────────────────────────────────────────────────

function IndicatorCard({
  num, title, titleEn, result, grade, description, open, onToggle, children,
}: {
  num: number; title: string; titleEn: string;
  result: React.ReactNode; grade: "great" | "good" | "ok" | "bad";
  description: string; open: boolean; onToggle: () => void;
  children: React.ReactNode;
}) {
  const borderColor = {
    great: "border-emerald-500/20",
    good:  "border-sky-500/20",
    ok:    "border-amber-500/20",
    bad:   "border-red-500/20",
  }[grade];

  return (
    <div className={`rounded-xl border ${borderColor} bg-slate-900/60 overflow-hidden`}>
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/3 transition-colors"
        onClick={onToggle}
      >
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-700/60 text-[10px] font-bold text-slate-400 flex items-center justify-center">
          {num}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-slate-100" style={{ fontFamily: "'Sora', sans-serif" }}>
            {title}
            <span className="ml-2 text-[10px] text-slate-500 font-normal">{titleEn}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm font-bold font-mono text-slate-100">{result}</span>
          <GradeChip level={grade} />
          {open ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-white/5 px-4 py-4">
          <p className="text-[11px] text-slate-500 mb-4 flex items-start gap-1.5">
            <Info size={11} className="flex-shrink-0 mt-0.5 text-slate-600" />{description}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "quantitativeAnalyzerData";

export default function QuantPage() {
  const [s, setS] = useState<IndicatorState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...DEFAULT_STATE, ...JSON.parse(saved) } : DEFAULT_STATE;
    } catch { return DEFAULT_STATE; }
  });

  const [openCards, setOpenCards] = useState<Set<number>>(new Set([1]));

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  }, [s]);

  const set = useCallback(<K extends keyof IndicatorState>(key: K, val: IndicatorState[K]) => {
    setS((prev) => ({ ...prev, [key]: val }));
  }, []);

  const toggleCard = useCallback((n: number) => {
    setOpenCards((prev) => {
      const next = new Set(prev);
      next.has(n) ? next.delete(n) : next.add(n);
      return next;
    });
  }, []);

  const handleReset = () => {
    setS(DEFAULT_STATE);
    setOpenCards(new Set([1]));
  };

  const c = calcAll(s);
  const score = calcScore(s);

  // Grade helpers
  const winRateGrade = c.winRate >= 0.5 ? "great" : c.winRate >= 0.3 ? "ok" : "bad";
  const mddGrade = c.mdd < 10 ? "great" : c.mdd < 20 ? "good" : c.mdd < 30 ? "ok" : "bad";
  const expectancyGrade = c.expectancy > 0 ? "great" : "bad";
  const rrGrade = c.rr >= 2 ? "great" : c.rr >= 1.5 ? "good" : c.rr >= 1 ? "ok" : "bad";
  const riskFrameGrade = s.singleRisk <= 2 ? "great" : s.singleRisk <= 3 ? "good" : s.singleRisk <= 5 ? "ok" : "bad";
  const sharpeGrade = c.sharpe > 3 ? "great" : c.sharpe > 2 ? "good" : c.sharpe > 1 ? "ok" : "bad";
  const leverageGrade = c.leverage <= 2 ? "great" : c.leverage <= 3 ? "good" : c.leverage <= 5 ? "ok" : "bad";
  const kellyGrade = c.kellyF > 0.1 ? "great" : c.kellyF > 0 ? "ok" : "bad";
  const compoundGrade = c.totalReturn >= 500 ? "great" : c.totalReturn >= 200 ? "good" : c.totalReturn >= 50 ? "ok" : "bad";

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-white/8 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-3">
            <div>
              <h1 className="text-sm font-bold text-slate-100" style={{ fontFamily: "'Sora', sans-serif" }}>
                量化分析
              </h1>
              <p className="text-[11px] text-slate-500">10 大量化指标 · 综合评分</p>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-white/10 bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 text-xs transition-colors"
            >
              <RotateCcw size={12} />重置
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Score panel */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <ScoreRing score={score} />
            <div className="flex-1 space-y-3">
              <div>
                <div className="text-xs font-semibold text-slate-500 mb-1">综合评分说明</div>
                <div className="text-sm text-slate-300 leading-relaxed">
                  {score >= 70
                    ? "交易系统完整、风险控制良好、期望值为正——具备长期盈利能力。"
                    : score >= 50
                    ? "基础指标达标，但部分维度有改进空间，建议重点优化红色项。"
                    : "需要重新审视交易系统和风险管理，多个核心指标处于危险区。"}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { range: "70–100", label: "优秀", color: "text-emerald-400" },
                  { range: "50–70",  label: "合格", color: "text-amber-400" },
                  { range: "0–50",   label: "不足", color: "text-red-400" },
                ].map((g) => (
                  <div key={g.range} className="text-center p-2 rounded-lg bg-slate-800/40 border border-white/5">
                    <div className={`text-xs font-bold ${g.color}`}>{g.label}</div>
                    <div className="text-[10px] text-slate-600 font-mono">{g.range}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick summary row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { label: "胜率", val: `${(c.winRate * 100).toFixed(1)}%`, grade: winRateGrade },
            { label: "最大回撤", val: `${fmt(c.mdd, 1)}%`, grade: mddGrade },
            { label: "夏普比率", val: fmt(c.sharpe, 2), grade: sharpeGrade },
            { label: "盈亏比", val: `${fmt(c.rr, 2)}:1`, grade: rrGrade },
            { label: "凯利仓位", val: `${fmt(c.kellyF * 100, 1)}%`, grade: kellyGrade },
          ].map((item) => {
            const borderCls = { great: "border-emerald-500/20", good: "border-sky-500/20", ok: "border-amber-500/20", bad: "border-red-500/20" }[item.grade];
            const textCls   = { great: "text-emerald-400", good: "text-sky-400", ok: "text-amber-400", bad: "text-red-400" }[item.grade];
            return (
              <div key={item.label} className={`rounded-xl border ${borderCls} bg-slate-900/40 p-3 text-center`}>
                <div className={`text-lg font-bold font-mono ${textCls}`}>{item.val}</div>
                <div className="text-[10px] text-slate-600 mt-0.5">{item.label}</div>
              </div>
            );
          })}
        </div>

        {/* Indicator cards */}
        <div className="space-y-2">

          {/* 1. 胜率 */}
          <IndicatorCard num={1} title="胜率" titleEn="Win Rate"
            result={`${(c.winRate * 100).toFixed(1)}%`} grade={winRateGrade}
            open={openCards.has(1)} onToggle={() => toggleCard(1)}
            description="盈利交易次数占总交易次数的比例。胜率 ≥50% 为优秀，≥30% 为良好。高胜率不代表高盈利，需结合盈亏比综合评估。">
            <NumInput label="盈利交易次数" value={s.winTrades} onChange={(v) => set("winTrades", v)} unit="次" step="1" />
            <NumInput label="总交易次数" value={s.totalTrades} onChange={(v) => set("totalTrades", v)} unit="次" step="1" />
            <div className="flex items-center justify-center rounded-lg bg-slate-800/40 border border-white/5 p-3">
              <div className="text-center">
                <div className="text-[10px] text-slate-500 mb-1">计算结果</div>
                <div className="text-2xl font-bold font-mono text-amber-400">{(c.winRate * 100).toFixed(1)}%</div>
              </div>
            </div>
          </IndicatorCard>

          {/* 2. 最大回撤 */}
          <IndicatorCard num={2} title="最大回撤" titleEn="Max Drawdown"
            result={`${fmt(c.mdd, 1)}%`} grade={mddGrade}
            open={openCards.has(2)} onToggle={() => toggleCard(2)}
            description="账户从峰值到谷值的最大跌幅百分比。MDD <10% 为优秀，<20% 良好，<30% 一般，≥30% 需立即改进风险管理。">
            <NumInput label="账户峰值" value={s.peakValue} onChange={(v) => set("peakValue", v)} unit="$" />
            <NumInput label="最低账户值" value={s.troughValue} onChange={(v) => set("troughValue", v)} unit="$" />
            <div className="flex items-center justify-center rounded-lg bg-slate-800/40 border border-white/5 p-3">
              <div className="text-center">
                <div className="text-[10px] text-slate-500 mb-1">最大回撤</div>
                <div className="text-2xl font-bold font-mono text-amber-400">{fmt(c.mdd, 2)}%</div>
              </div>
            </div>
          </IndicatorCard>

          {/* 3. 仓位管理 */}
          <IndicatorCard num={3} title="仓位管理" titleEn="Position Size"
            result={`${fmt(c.positionSize, 2)} 手`} grade={s.riskPercent <= 2 ? "great" : s.riskPercent <= 3 ? "good" : s.riskPercent <= 5 ? "ok" : "bad"}
            open={openCards.has(3)} onToggle={() => toggleCard(3)}
            description="根据账户资金、风险比例和止损幅度计算最优仓位大小。公式：账户资金 × 风险比例 ÷ 止损幅度。建议单笔风险不超过账户的 1-2%。">
            <NumInput label="账户资金" value={s.accountFunds} onChange={(v) => set("accountFunds", v)} unit="$" />
            <NumInput label="风险比例" value={s.riskPercent} onChange={(v) => set("riskPercent", v)} unit="%" />
            <NumInput label="止损幅度 (点)" value={s.stopLoss} onChange={(v) => set("stopLoss", v)} unit="pts" />
            <div className="col-span-2 sm:col-span-3 flex items-center justify-center rounded-lg bg-slate-800/40 border border-white/5 p-3">
              <div className="text-center">
                <div className="text-[10px] text-slate-500 mb-1">最优仓位</div>
                <div className="text-2xl font-bold font-mono text-amber-400">{fmt(c.positionSize, 2)} 手</div>
                <div className="text-[10px] text-slate-600 mt-1">风险金额: ${fmt(s.accountFunds * s.riskPercent / 100, 2)}</div>
              </div>
            </div>
          </IndicatorCard>

          {/* 4. 期望值 */}
          <IndicatorCard num={4} title="期望值" titleEn="Expectancy"
            result={`$${fmt(c.expectancy, 2)}`} grade={expectancyGrade}
            open={openCards.has(4)} onToggle={() => toggleCard(4)}
            description="每笔交易平均期望获利金额。期望值 >0 表示系统长期盈利。公式：胜率 × 平均盈利 − 败率 × 平均亏损。">
            <NumInput label="胜率" value={s.expWinRate} onChange={(v) => set("expWinRate", v)} unit="%" />
            <NumInput label="平均盈利" value={s.avgProfit} onChange={(v) => set("avgProfit", v)} unit="$" />
            <NumInput label="平均亏损" value={s.avgLoss} onChange={(v) => set("avgLoss", v)} unit="$" />
            <div className="col-span-2 sm:col-span-3 flex items-center justify-center rounded-lg bg-slate-800/40 border border-white/5 p-3">
              <div className="text-center">
                <div className="text-[10px] text-slate-500 mb-1">每笔期望值</div>
                <div className={`text-2xl font-bold font-mono ${c.expectancy > 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {c.expectancy >= 0 ? "+" : ""}{fmt(c.expectancy, 2)} $
                </div>
              </div>
            </div>
          </IndicatorCard>

          {/* 5. 盈亏比 */}
          <IndicatorCard num={5} title="盈亏比" titleEn="Risk-Reward Ratio"
            result={`${fmt(c.rr, 2)}:1`} grade={rrGrade}
            open={openCards.has(5)} onToggle={() => toggleCard(5)}
            description="平均盈利与平均亏损之比。≥2:1 为优秀，≥1.5:1 良好，≥1:1 一般。即使胜率低，高盈亏比也能保持整体盈利。">
            <NumInput label="平均盈利" value={s.rrProfit} onChange={(v) => set("rrProfit", v)} unit="$" />
            <NumInput label="平均亏损" value={s.rrLoss} onChange={(v) => set("rrLoss", v)} unit="$" />
            <div className="flex items-center justify-center rounded-lg bg-slate-800/40 border border-white/5 p-3">
              <div className="text-center">
                <div className="text-[10px] text-slate-500 mb-1">盈亏比</div>
                <div className="text-2xl font-bold font-mono text-amber-400">{fmt(c.rr, 2)}:1</div>
              </div>
            </div>
          </IndicatorCard>

          {/* 6. 风险框架 */}
          <IndicatorCard num={6} title="风险框架" titleEn="Risk Framework"
            result={`${s.singleRisk}%`} grade={riskFrameGrade}
            open={openCards.has(6)} onToggle={() => toggleCard(6)}
            description="系统化风险管理框架评估。单笔风险 ≤2% 为优秀标准。结合追踪止损和固定交易系统，有助于降低情绪化操作风险。">
            <NumInput label="单笔风险" value={s.singleRisk} onChange={(v) => set("singleRisk", v)} unit="%" />
            <SelectInput label="追踪止损" value={s.trailingStop} onChange={(v) => set("trailingStop", v)}
              options={[{ value: "yes", label: "已启用" }, { value: "no", label: "未启用" }]} />
            <SelectInput label="固定系统" value={s.fixedSystem} onChange={(v) => set("fixedSystem", v)}
              options={[{ value: "yes", label: "已启用" }, { value: "no", label: "未启用" }]} />
            <div className="col-span-2 sm:col-span-3 grid grid-cols-3 gap-2">
              {[
                { label: "单笔风险", val: `${s.singleRisk}%`, ok: s.singleRisk <= 2 },
                { label: "追踪止损", val: s.trailingStop === "yes" ? "已启用 ✓" : "未启用 ✗", ok: s.trailingStop === "yes" },
                { label: "固定系统", val: s.fixedSystem === "yes" ? "已启用 ✓" : "未启用 ✗", ok: s.fixedSystem === "yes" },
              ].map((item) => (
                <div key={item.label} className={`rounded-lg border p-2 text-center ${item.ok ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5"}`}>
                  <div className="text-[10px] text-slate-500 mb-1">{item.label}</div>
                  <div className={`text-xs font-bold ${item.ok ? "text-emerald-400" : "text-red-400"}`}>{item.val}</div>
                </div>
              ))}
            </div>
          </IndicatorCard>

          {/* 7. 夏普比率 */}
          <IndicatorCard num={7} title="夏普比率" titleEn="Sharpe Ratio"
            result={fmt(c.sharpe, 2)} grade={sharpeGrade}
            open={openCards.has(7)} onToggle={() => toggleCard(7)}
            description="每单位风险获得的超额回报。>3 为卓越，>2 优秀，>1 良好，≤1 需改进。公式：(年化收益 − 无风险利率) ÷ 波动率。">
            <NumInput label="年化收益" value={s.annualReturn} onChange={(v) => set("annualReturn", v)} unit="%" />
            <NumInput label="无风险利率" value={s.riskFreeRate} onChange={(v) => set("riskFreeRate", v)} unit="%" />
            <NumInput label="年化波动率" value={s.volatility} onChange={(v) => set("volatility", v)} unit="%" />
            <div className="col-span-2 sm:col-span-3 flex items-center justify-center rounded-lg bg-slate-800/40 border border-white/5 p-3">
              <div className="text-center">
                <div className="text-[10px] text-slate-500 mb-1">夏普比率</div>
                <div className="text-2xl font-bold font-mono text-amber-400">{fmt(c.sharpe, 2)}</div>
              </div>
            </div>
          </IndicatorCard>

          {/* 8. 杠杆倍数 */}
          <IndicatorCard num={8} title="杠杆倍数" titleEn="Leverage"
            result={`${fmt(c.leverage, 2)}x`} grade={leverageGrade}
            open={openCards.has(8)} onToggle={() => toggleCard(8)}
            description="总头寸价值与账户净值之比。≤2x 为安全，≤3x 可接受，≤5x 警告，>5x 高度危险。过高杠杆会放大亏损风险。">
            <NumInput label="账户净值" value={s.netValue} onChange={(v) => set("netValue", v)} unit="$" />
            <NumInput label="总头寸价值" value={s.totalPosition} onChange={(v) => set("totalPosition", v)} unit="$" />
            <SelectInput label="交易品种" value={s.assetType} onChange={(v) => set("assetType", v)}
              options={[
                { value: "stock", label: "股票" },
                { value: "bond", label: "债券" },
                { value: "crypto", label: "加密货币" },
                { value: "forex", label: "外汇/贵金属" },
              ]} />
            <div className="col-span-2 sm:col-span-3 flex items-center justify-center rounded-lg bg-slate-800/40 border border-white/5 p-3">
              <div className="text-center">
                <div className="text-[10px] text-slate-500 mb-1">实际杠杆</div>
                <div className={`text-2xl font-bold font-mono ${
                  c.leverage <= 2 ? "text-emerald-400" : c.leverage <= 3 ? "text-sky-400" : c.leverage <= 5 ? "text-amber-400" : "text-red-400"
                }`}>{fmt(c.leverage, 2)}x</div>
              </div>
            </div>
          </IndicatorCard>

          {/* 9. 凯利公式 */}
          <IndicatorCard num={9} title="凯利公式" titleEn="Kelly Criterion"
            result={`${fmt(c.kellyF * 100, 1)}%`} grade={kellyGrade}
            open={openCards.has(9)} onToggle={() => toggleCard(9)}
            description="数学最优仓位百分比。>10% 优秀，>0% 良好，≤0% 表示期望值为负，不应入场。实操中建议使用 1/2 凯利以降低波动。">
            <NumInput label="胜率" value={s.kellyWinRate} onChange={(v) => set("kellyWinRate", v)} unit="%" />
            <NumInput label="盈亏比 (b)" value={s.kellyRatio} onChange={(v) => set("kellyRatio", v)} />
            <div className="flex items-center justify-center rounded-lg bg-slate-800/40 border border-white/5 p-3">
              <div className="text-center">
                <div className="text-[10px] text-slate-500 mb-1">最优仓位</div>
                <div className={`text-2xl font-bold font-mono ${c.kellyF > 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {fmt(c.kellyF * 100, 1)}%
                </div>
                <div className="text-[10px] text-slate-600 mt-1">½ 凯利: {fmt(c.kellyF * 50, 1)}%</div>
              </div>
            </div>
          </IndicatorCard>

          {/* 10. 复利增长 */}
          <IndicatorCard num={10} title="复利增长" titleEn="Compound Growth"
            result={`${fmt(c.totalReturn, 0)}%`} grade={compoundGrade}
            open={openCards.has(10)} onToggle={() => toggleCard(10)}
            description="按当前年化收益率复利增长的最终金额和总收益。≥500% 优秀，≥200% 良好，≥50% 一般。复利时间越长，效果越显著。">
            <NumInput label="本金" value={s.principal} onChange={(v) => set("principal", v)} unit="$" />
            <NumInput label="年化收益率" value={s.annualRate} onChange={(v) => set("annualRate", v)} unit="%" />
            <NumInput label="投资年限" value={s.investYears} onChange={(v) => set("investYears", v)} unit="年" step="1" min="1" />
            <div className="col-span-2 sm:col-span-3 grid grid-cols-2 gap-2 mb-2">
              <div className="rounded-lg bg-slate-800/40 border border-white/5 p-3 text-center">
                <div className="text-[10px] text-slate-500 mb-1">最终金额</div>
                <div className="text-lg font-bold font-mono text-emerald-400">
                  ${c.finalAmount >= 1_000_000
                    ? `${fmt(c.finalAmount / 1_000_000, 2)}M`
                    : c.finalAmount >= 1000
                    ? `${fmt(c.finalAmount / 1000, 1)}k`
                    : fmt(c.finalAmount, 0)}
                </div>
              </div>
              <div className="rounded-lg bg-slate-800/40 border border-white/5 p-3 text-center">
                <div className="text-[10px] text-slate-500 mb-1">总收益率</div>
                <div className="text-lg font-bold font-mono text-amber-400">+{fmt(c.totalReturn, 1)}%</div>
              </div>
            </div>
            {/* Canvas chart */}
            <div className="col-span-2 sm:col-span-3 rounded-xl overflow-hidden border border-white/8" style={{ height: "200px" }}>
              <CompoundChart principal={s.principal} investYears={Math.max(1, Math.round(s.investYears))} />
            </div>
          </IndicatorCard>

        </div>

        {/* Bottom legend */}
        <div className="text-center text-[11px] text-slate-700 pb-4">
          所有数据自动保存至本地浏览器 · 刷新页面后仍可恢复
        </div>
      </div>
    </div>
  );
}
