import React, { useState, useEffect, useRef, useCallback } from "react";
import html2canvas from "html2canvas";
import {
  Search, Trash2, TrendingUp, TrendingDown, Minus,
  Calendar, Clock, X, ZoomIn, FileText, BarChart2, Pencil,
  ImagePlus, Share2, Download,
} from "lucide-react";
import {
  getVerdictColor, TIMEFRAMES, INDICATOR_DEFINITIONS,
  type AnalysisRecord, type TradeRecord, type IndicatorValue, type SignalState,
} from "@/lib/swea-data";
import { apiLoadRecords, apiDeleteRecord, apiUpdateRecord } from "@/lib/api";
import { toast } from "sonner";
import StatsDashboard from "@/components/StatsDashboard";
import ShareCard from "@/components/ShareCard";

const SIGNAL_LABELS: Record<string, string> = {
  strong_bullish: "强烈多头", bullish: "多头信号",
  strong_bearish: "强烈空头", bearish: "空头信号",
  mixed: "信号混合",         no_signal: "无明确信号",
};

const INDICATOR_NAMES: Record<string, string> = {
  candlestick: "蜡烛形态", chartPattern: "图表形态", trendPattern: "趋势形态",
  fibonacci: "斐波那契",   bollingerBand: "布林带",  movingAverage: "均线 MA20",
};

const INDICATOR_KEYS = ["candlestick", "chartPattern", "trendPattern", "fibonacci", "bollingerBand", "movingAverage"] as const;

export default function HistoryPage() {
  const [records, setRecords] = useState<AnalysisRecord[]>([]);
  const [activeTab, setActiveTab] = useState<"records" | "stats">("records");
  const [searchPair, setSearchPair] = useState("");
  const [filterSignal, setFilterSignal] = useState("all");
  const [filterTimeframe, setFilterTimeframe] = useState("all");
  const [selectedRecord, setSelectedRecord] = useState<AnalysisRecord | null>(null);
  const [editingRecord, setEditingRecord] = useState<AnalysisRecord | null>(null);
  const [sharingRecord, setSharingRecord] = useState<AnalysisRecord | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  useEffect(() => {
    apiLoadRecords().then(setRecords).catch(() => toast.error("加载记录失败"));
  }, []);

  const handleUpdate = async (updated: AnalysisRecord) => {
    try {
      await apiUpdateRecord(updated);
      setRecords((prev) => prev.map((r) => r.id === updated.id ? updated : r));
      if (selectedRecord?.id === updated.id) setSelectedRecord(updated);
      setEditingRecord(null);
      toast.success("记录已更新");
    } catch (err) {
      toast.error(`更新失败: ${err instanceof Error ? err.message : "请重试"}`);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("确认删除这条记录？")) return;
    try {
      await apiDeleteRecord(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
      if (selectedRecord?.id === id) setSelectedRecord(null);
      toast.success("记录已删除");
    } catch {
      toast.error("删除失败");
    }
  };

  const filtered = records.filter((r) => {
    const pairMatch = !searchPair || r.pair.toLowerCase().includes(searchPair.toLowerCase());
    const signalMatch = filterSignal === "all" || r.verdict.signal === filterSignal;
    const tfMatch = filterTimeframe === "all" || r.timeframe === filterTimeframe;
    return pairMatch && signalMatch && tfMatch;
  });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-white/8 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-1 pt-3">
            {[
              { key: "records" as const, icon: FileText, label: "历史记录", badge: records.length },
              { key: "stats" as const, icon: BarChart2, label: "统计仪表盘" },
            ].map(({ key, icon: Icon, label, badge }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-semibold transition-all duration-150 border-b-2 ${
                  activeTab === key ? "border-amber-400 text-amber-400 bg-amber-400/5" : "border-transparent text-slate-500 hover:text-slate-300"
                }`} style={{ fontFamily: "'Sora', sans-serif" }}>
                <Icon size={14} />{label}
                {badge ? <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-slate-700 text-slate-400">{badge}</span> : null}
              </button>
            ))}
          </div>
          {activeTab === "records" && (
            <div className="flex flex-wrap gap-2 py-2.5">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                <input type="text" value={searchPair} onChange={(e) => setSearchPair(e.target.value)}
                  placeholder="搜索交易对..."
                  className="h-8 pl-8 pr-3 rounded-lg border border-white/10 bg-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-amber-500/40 placeholder:text-slate-600" />
              </div>
              <select value={filterTimeframe} onChange={(e) => setFilterTimeframe(e.target.value)}
                className="h-8 px-2.5 rounded-lg border border-white/10 bg-slate-800 text-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500/40">
                <option value="all">全部时间框架</option>
                {TIMEFRAMES.map((tf) => <option key={tf} value={tf}>{tf}</option>)}
              </select>
              <select value={filterSignal} onChange={(e) => setFilterSignal(e.target.value)}
                className="h-8 px-2.5 rounded-lg border border-white/10 bg-slate-800 text-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500/40">
                {[
                  ["all","全部信号"],["strong_bullish","强烈多头"],["bullish","多头信号"],
                  ["strong_bearish","强烈空头"],["bearish","空头信号"],["mixed","信号混合"],["no_signal","无明确信号"],
                ].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <span className="text-[11px] text-slate-600 font-mono self-center px-1">{filtered.length} / {records.length} 条</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
        {activeTab === "stats" ? (
          <StatsDashboard records={records} />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-700">
            <FileText size={40} className="mb-4 opacity-30" />
            <p className="text-sm">{records.length === 0 ? "在「信号分析」页面保存记录后显示" : "没有符合筛选条件的记录"}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((record) => (
              <RecordRow key={record.id} record={record}
                isSelected={selectedRecord?.id === record.id}
                onSelect={() => setSelectedRecord(selectedRecord?.id === record.id ? null : record)}
                onDelete={(e) => handleDelete(record.id, e)}
                onImageClick={(src) => setLightboxSrc(src)}
                onEdit={(e) => { e.stopPropagation(); setEditingRecord(record); }}
                onShare={(e) => { e.stopPropagation(); setSharingRecord(record); }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedRecord && (
        <RecordDetailModal record={selectedRecord} onClose={() => setSelectedRecord(null)} onImageClick={setLightboxSrc} />
      )}

      {/* Edit Modal */}
      {editingRecord && (
        <EditRecordModal record={editingRecord} onClose={() => setEditingRecord(null)} onSave={handleUpdate} />
      )}

      {/* Share Modal */}
      {sharingRecord && (
        <ShareModal record={sharingRecord} onClose={() => setSharingRecord(null)} />
      )}

      {/* Lightbox */}
      {lightboxSrc && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightboxSrc(null)}>
          <button className="absolute top-4 right-4 text-white/60 hover:text-white" onClick={() => setLightboxSrc(null)}>
            <X size={24} />
          </button>
          <img src={lightboxSrc} alt="截图" className="max-w-full max-h-full rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

// ─── Record Row ───────────────────────────────────────────────────────────────

function RecordRow({ record, isSelected, onSelect, onDelete, onImageClick, onEdit, onShare }: {
  record: AnalysisRecord; isSelected: boolean;
  onSelect: () => void; onDelete: (e: React.MouseEvent) => void;
  onImageClick: (src: string) => void; onEdit: (e: React.MouseEvent) => void;
  onShare: (e: React.MouseEvent) => void;
}) {
  const colorClass = getVerdictColor(record.verdict.signal);
  const date = new Date(record.date);
  const isBull = record.verdict.signal.includes("bullish");
  const isBear = record.verdict.signal.includes("bearish");
  const isMixed = record.verdict.signal === "mixed";
  const pnl = record.tradeRecord?.actualPnl;

  const borderBg = isBull ? "border-emerald-500/20 bg-emerald-500/5"
    : isBear ? "border-red-500/20 bg-red-500/5"
    : isMixed ? "border-amber-500/20 bg-amber-500/5"
    : "border-white/8 bg-slate-800/30";

  return (
    <div className={`rounded-xl border cursor-pointer transition-all duration-150 ${borderBg} ${isSelected ? "ring-1 ring-amber-500/30" : ""}`} onClick={onSelect}>
      <div className="px-4 py-3 flex items-center gap-3 flex-wrap sm:flex-nowrap">
        <div className="flex-shrink-0 min-w-[72px]">
          <div className="text-sm font-bold text-slate-100" style={{ fontFamily: "'Fira Code', monospace" }}>{record.pair}</div>
          <div className="text-[10px] text-slate-600 font-mono">{record.timeframe}</div>
        </div>
        <div className="flex-shrink-0">
          <div className={`text-sm font-bold ${colorClass}`}>{SIGNAL_LABELS[record.verdict.signal]}</div>
          <div className="text-[10px] text-slate-600 font-mono">{record.verdict.confidence}% 可信度</div>
        </div>
        <div className="hidden sm:flex items-center gap-1">
          {Array.from({ length: 6 }).map((_, i) => {
            let c = "bg-slate-700";
            if (i < record.verdict.bullishCount) c = "bg-emerald-500";
            else if (i < record.verdict.bullishCount + record.verdict.bearishCount) c = "bg-red-500";
            return <div key={i} className={`w-2 h-2 rounded-full ${c}`} />;
          })}
          <span className="text-[10px] text-slate-600 ml-1 font-mono">↑{record.verdict.bullishCount} ↓{record.verdict.bearishCount}</span>
        </div>
        {record.chartImage && (
          <button className="flex-shrink-0 w-12 h-8 rounded overflow-hidden border border-white/10 hover:border-amber-500/30 transition-colors"
            onClick={(e) => { e.stopPropagation(); onImageClick(record.chartImage!); }}>
            <img src={record.chartImage} alt="图表" className="w-full h-full object-cover" />
          </button>
        )}
        {pnl !== undefined && (
          <span className={`flex-shrink-0 text-xs font-bold font-mono px-2 py-0.5 rounded-full border ${
            pnl >= 0 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-red-400 bg-red-500/10 border-red-500/20"
          }`}>{pnl >= 0 ? "+" : ""}{pnl}</span>
        )}
        <div className="flex-1" />
        <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-600 flex-shrink-0">
          <Calendar size={10} />{date.toLocaleDateString("zh-CN")}
          <Clock size={10} className="ml-1" />{date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
        </div>
        {/* Share button */}
        <button onClick={onShare}
          className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-violet-500/30 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 text-[11px] font-medium transition-colors flex-shrink-0">
          <Share2 size={11} /><span className="hidden sm:inline">分享</span>
        </button>
        {/* Edit button */}
        <button onClick={onEdit}
          className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-teal-500/30 bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 text-[11px] font-medium transition-colors flex-shrink-0">
          <Pencil size={11} /><span>修改</span>
        </button>
        <button onClick={onDelete} className="p-1.5 rounded hover:bg-red-500/15 text-slate-700 hover:text-red-400 transition-colors flex-shrink-0">
          <Trash2 size={13} />
        </button>
      </div>

      {/* Expanded detail */}
      {isSelected && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(record.indicators).map(([key, val]) => (
              <div key={key} className="rounded-lg border border-white/8 bg-slate-900/40 p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-slate-400">{INDICATOR_NAMES[key] ?? key}</span>
                  <span className={val.state === "bullish" ? "text-emerald-400" : val.state === "bearish" ? "text-red-400" : "text-slate-500"}>
                    {val.state === "bullish" ? <TrendingUp size={12} /> : val.state === "bearish" ? <TrendingDown size={12} /> : <Minus size={12} />}
                  </span>
                </div>
                {val.notes ? <p className="text-[11px] text-slate-500">{val.notes}</p> : <p className="text-[11px] text-slate-700 italic">无备注</p>}
              </div>
            ))}
          </div>
          {record.notes && (
            <div className="rounded-lg border border-white/8 bg-slate-900/40 p-3">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">备注</span>
              <p className="text-xs text-slate-400 mt-1">{record.notes}</p>
            </div>
          )}
          {record.tradeRecord && (record.tradeRecord.entryPrice !== undefined || record.tradeRecord.actualPnl !== undefined) && (
            <div className="rounded-lg border border-teal-500/20 bg-teal-500/5 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-teal-500/70 uppercase tracking-wider">交易记录</span>
                {record.tradeRecord.status && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    record.tradeRecord.status === "closed" ? "text-teal-400 border-teal-500/30 bg-teal-500/10" : "text-amber-400 border-amber-500/30 bg-amber-500/10"
                  }`}>{record.tradeRecord.status === "closed" ? "已完结" : "进行中"}</span>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { label: "入场价位", val: record.tradeRecord.entryPrice, color: "text-slate-200" },
                  { label: "止盈 TP",  val: record.tradeRecord.takeProfit,  color: "text-slate-200" },
                  { label: "止损 SL",  val: record.tradeRecord.stopLoss,    color: "text-red-400" },
                  { label: "实际盈亏", val: record.tradeRecord.actualPnl,   color: (record.tradeRecord.actualPnl ?? 0) >= 0 ? "text-emerald-400" : "text-red-400" },
                ].map(({ label, val, color }) => (
                  <div key={label} className="rounded-lg bg-slate-900/50 p-2">
                    <div className="text-[10px] text-slate-600 mb-1">{label}</div>
                    <div className={`text-xs font-bold font-mono ${color}`}>
                      {val !== undefined ? (label === "实际盈亏" && (val as number) >= 0 ? `+${val}` : String(val)) : "—"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Edit Record Modal (full) ─────────────────────────────────────────────────

function EditRecordModal({ record, onClose, onSave }: {
  record: AnalysisRecord; onClose: () => void; onSave: (r: AnalysisRecord) => Promise<void>;
}) {
  const [pair, setPair] = useState(record.pair);
  const [timeframe, setTimeframe] = useState(record.timeframe);
  const [indicators, setIndicators] = useState<AnalysisRecord["indicators"]>({ ...record.indicators });
  const [trade, setTrade] = useState<TradeRecord>(record.tradeRecord ?? { status: "open" });
  const [notes, setNotes] = useState(record.notes ?? "");
  const [chartImage, setChartImage] = useState<string | undefined>(record.chartImage);
  const [saving, setSaving] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const setIndicatorField = useCallback((key: keyof AnalysisRecord["indicators"], field: keyof IndicatorValue, value: string) => {
    setIndicators((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { toast.error("图片大小不能超过 8MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setChartImage(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      ...record,
      pair: pair.trim() || record.pair,
      timeframe,
      indicators,
      notes: notes.trim() || undefined,
      chartImage,
      tradeRecord: (trade.entryPrice !== undefined || trade.takeProfit !== undefined || trade.stopLoss !== undefined || trade.actualPnl !== undefined) ? trade : undefined,
    });
    setSaving(false);
  };

  const setTradeField = (key: keyof TradeRecord, raw: string) => {
    if (key === "status") {
      setTrade((p) => ({ ...p, status: raw as "open" | "closed" }));
    } else {
      const val = raw === "" ? undefined : parseFloat(raw);
      setTrade((p) => ({ ...p, [key]: isNaN(val as number) ? undefined : val }));
    }
  };

  const STATE_OPTS: { state: SignalState; label: string; cls: string }[] = [
    { state: "bullish", label: "看涨 ▲", cls: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300" },
    { state: "neutral", label: "中性 —", cls: "border-slate-500/40 bg-slate-700/30 text-slate-300" },
    { state: "bearish", label: "看跌 ▼", cls: "border-red-500/40 bg-red-500/15 text-red-300" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-2xl my-4 rounded-2xl border border-white/10 bg-slate-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 sticky top-0 bg-slate-900 rounded-t-2xl z-10">
          <div>
            <div className="text-sm font-bold text-slate-100" style={{ fontFamily: "'Sora', sans-serif" }}>修改记录</div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">{record.pair} · {record.timeframe}</div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-6">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2">交易对</label>
              <input type="text" value={pair} onChange={(e) => setPair(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 rounded-lg border border-white/8 bg-slate-800/60 text-sm font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2">时间框架</label>
              <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}
                className="w-full h-[38px] px-3 rounded-lg border border-white/8 bg-slate-800/60 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500/30">
                {TIMEFRAMES.map((tf) => <option key={tf} value={tf}>{tf}</option>)}
              </select>
            </div>
          </div>

          {/* Chart image */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">行情图表</label>
            {chartImage ? (
              <div className="relative group rounded-xl overflow-hidden border border-white/10">
                <img src={chartImage} alt="行情图表" className="w-full h-36 object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button onClick={() => setLightbox(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs transition-colors"><ZoomIn size={13} />查看</button>
                  <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 text-xs transition-colors"><ImagePlus size={13} />替换</button>
                  <button onClick={() => setChartImage(undefined)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs transition-colors"><X size={13} />删除</button>
                </div>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-6 rounded-xl border border-dashed border-white/10 text-slate-600 hover:border-teal-500/30 hover:text-teal-500/60 text-sm transition-all">
                <ImagePlus size={16} /><span>点击上传图表截图</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>

          {/* 6 Indicators */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-3">6 大指标</label>
            <div className="space-y-3">
              {INDICATOR_KEYS.map((key) => {
                const def = INDICATOR_DEFINITIONS[key];
                const val = indicators[key];
                return (
                  <div key={key} className="rounded-xl border border-white/8 bg-slate-800/30 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-xs font-bold text-slate-200">{def.name}</span>
                        <span className="text-[10px] text-slate-600 ml-2">{def.nameEn}</span>
                      </div>
                      <div className="flex gap-1.5">
                        {STATE_OPTS.map(({ state, label, cls }) => (
                          <button key={state} type="button"
                            onClick={() => setIndicatorField(key, "state", state)}
                            className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${
                              val.state === state ? cls : "border-white/8 text-slate-600 hover:text-slate-400"
                            }`}>{label}</button>
                        ))}
                      </div>
                    </div>
                    <textarea value={val.notes}
                      onChange={(e) => setIndicatorField(key, "notes", e.target.value)}
                      placeholder={def.placeholder} rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-white/8 bg-slate-900/60 text-xs text-slate-200 placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500/30 resize-none" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trade record */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-slate-500">交易记录</label>
              <div className="flex gap-1.5">
                {(["open","closed"] as const).map((s) => (
                  <button key={s} type="button" onClick={() => setTrade((p) => ({ ...p, status: s }))}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all ${
                      trade.status === s
                        ? s === "closed" ? "bg-teal-500/20 text-teal-400 border-teal-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                        : "text-slate-600 border-white/8 hover:text-slate-400"
                    }`}>{s === "closed" ? "已完结" : "进行中"}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {([
                { key: "entryPrice" as const, label: "入场价位", color: "" },
                { key: "takeProfit"  as const, label: "止盈 (TP)", color: "" },
                { key: "stopLoss"   as const, label: "止损 (SL)", color: "text-red-400" },
                { key: "actualPnl"  as const, label: "实际盈亏",  color: "text-emerald-400" },
              ]).map(({ key, label, color }) => (
                <div key={key}>
                  <label className="block text-[10px] text-slate-500 mb-1.5">{label}</label>
                  <input type="number" step="any" value={trade[key] !== undefined ? String(trade[key]) : ""}
                    onChange={(e) => setTradeField(key, e.target.value)} placeholder="0.00000"
                    className={`w-full px-3 py-2 rounded-lg border border-white/8 bg-slate-800/60 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-teal-500/30 placeholder:text-slate-700 ${color || "text-slate-200"}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">交易备注</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="分析思路、入场理由、风险提示等..." rows={3}
              className="w-full px-4 py-3 rounded-xl border border-white/8 bg-slate-800/40 text-sm text-slate-200 placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500/30 resize-none" />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-sm transition-colors">取消</button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 h-10 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors">
              {saving ? "保存中..." : "保存修改"}
            </button>
          </div>
        </div>
      </div>

      {lightbox && chartImage && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(false)}>
          <button className="absolute top-4 right-4 text-white/60 hover:text-white" onClick={() => setLightbox(false)}><X size={24} /></button>
          <img src={chartImage} alt="行情图表" className="max-w-full max-h-full rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

// ─── Share Modal ──────────────────────────────────────────────────────────────

function ShareModal({ record, onClose }: { record: AnalysisRecord; onClose: () => void }) {
  // offscreenRef: full-size card rendered off-screen for html2canvas
  const offscreenRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const handleDownload = async () => {
    if (!offscreenRef.current) return;
    setExporting(true);
    try {
      // Capture the full 1080×1920 off-screen element directly
      const canvas = await html2canvas(offscreenRef.current, {
        scale: 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#0a0f1e",
        width: 1080,
        height: 1920,
        windowWidth: 1080,
        windowHeight: 1920,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
      });
      const link = document.createElement("a");
      link.download = `MI6_${record.pair}_${record.timeframe}_${new Date(record.date).toLocaleDateString("zh-CN").replace(/\//g, "-")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("图片已下载，可直接分享至各社群");
    } catch (e) {
      console.error(e);
      toast.error("导出失败，请截图保存");
    } finally {
      setExporting(false);
    }
  };

  // Calculate preview scale to fit card width into ~320px container
  const previewScale = 320 / 1080;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex flex-col items-center justify-start overflow-y-auto p-4" onClick={onClose}>
      {/* Off-screen full-size card for html2canvas — must be in DOM but invisible */}
      <div style={{ position: "fixed", left: -2000, top: 0, width: 1080, height: 1920, overflow: "hidden", zIndex: -1 }}>
        <ShareCard ref={offscreenRef} record={record} />
      </div>

      <div className="w-full max-w-sm my-4" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-bold text-white" style={{ fontFamily: "'Sora', sans-serif" }}>分享卡片</div>
            <div className="text-[11px] text-slate-500 mt-0.5">TikTok / Instagram / Facebook 尺寸 (9:16)</div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"><X size={16} /></button>
        </div>

        {/* Card preview — CSS scaled to fit */}
        <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl mb-4 bg-slate-950"
          style={{ width: "100%", height: Math.round(320 / (9/16) * (16/9)) + "px", /* 9:16 height */ paddingBottom: "177.78%" }}>
          <div className="absolute inset-0 overflow-hidden">
            <div style={{
              transform: `scale(${previewScale})`,
              transformOrigin: "top left",
              width: 1080,
              height: 1920,
              pointerEvents: "none",
            }}>
              <ShareCard record={record} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button onClick={handleDownload} disabled={exporting}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-semibold text-sm transition-colors">
            <Download size={16} />
            {exporting ? "生成中 (1080×1920)..." : "下载 PNG (1080×1920)"}
          </button>
          <p className="text-center text-[11px] text-slate-600 px-4">
            下载后可直接上传至 TikTok、Instagram、Facebook 等平台
          </p>
          <div className="grid grid-cols-3 gap-2 pt-1">
            {[
              { name: "TikTok", color: "bg-black border-slate-700 text-slate-300" },
              { name: "Instagram", color: "bg-gradient-to-br from-purple-600/30 to-pink-600/30 border-pink-500/30 text-pink-300" },
              { name: "Facebook", color: "bg-blue-600/20 border-blue-500/30 text-blue-300" },
            ].map(({ name, color }) => (
              <div key={name} className={`flex items-center justify-center h-8 rounded-lg border text-[11px] font-semibold ${color}`}>{name}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Record Detail Modal ──────────────────────────────────────────────────────

function RecordDetailModal({ record, onClose, onImageClick }: {
  record: AnalysisRecord; onClose: () => void; onImageClick: (src: string) => void;
}) {
  const colorClass = getVerdictColor(record.verdict.signal);
  const date = new Date(record.date);
  const isBull = record.verdict.signal.includes("bullish");
  const isBear = record.verdict.signal.includes("bearish");

  return (
    <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-slate-100" style={{ fontFamily: "'Fira Code', monospace" }}>{record.pair}</span>
              <span className="text-sm text-slate-500 font-mono">{record.timeframe}</span>
              <span className={`text-sm font-bold ${colorClass}`}>{SIGNAL_LABELS[record.verdict.signal]}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-600 mt-1">
              <Calendar size={10} />{date.toLocaleString("zh-CN")}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className={`rounded-xl border p-4 ${isBull ? "border-emerald-500/25 bg-emerald-500/5" : isBear ? "border-red-500/25 bg-red-500/5" : "border-amber-500/20 bg-amber-500/5"}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-xl font-bold ${colorClass}`} style={{ fontFamily: "'Sora', sans-serif" }}>{SIGNAL_LABELS[record.verdict.signal]}</div>
                <div className="text-xs text-slate-500 mt-1">{record.verdict.description}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-amber-400 font-mono">{record.verdict.confidence}%</div>
                <div className="text-[10px] text-slate-600">可信度</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { label: "看涨", val: record.verdict.bullishCount, cls: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" },
                { label: "看跌", val: record.verdict.bearishCount, cls: "bg-red-500/10 border-red-500/20 text-red-400" },
                { label: "中性", val: record.verdict.neutralCount, cls: "bg-slate-700/30 border-slate-600/20 text-slate-400" },
              ].map(({ label, val, cls }) => (
                <div key={label} className={`text-center p-2 rounded-lg border ${cls}`}>
                  <div className="text-xl font-bold font-mono">{val}</div>
                  <div className="text-[10px] mt-0.5 opacity-60">{label}</div>
                </div>
              ))}
            </div>
          </div>
          {record.chartImage && (
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">整体行情图表</h3>
              <button className="w-full rounded-xl overflow-hidden border border-white/10 hover:border-amber-500/30 transition-colors relative group" onClick={() => onImageClick(record.chartImage!)}>
                <img src={record.chartImage} alt="行情图表" className="w-full max-h-48 object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><ZoomIn size={24} className="text-white" /></div>
              </button>
            </div>
          )}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">6 大指标详情</h3>
            <div className="space-y-2">
              {Object.entries(record.indicators).map(([key, val]) => (
                <div key={key} className="rounded-xl border border-white/8 bg-slate-800/30 p-3">
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border ${val.state === "bullish" ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" : val.state === "bearish" ? "bg-red-500/15 border-red-500/30 text-red-400" : "bg-slate-700/40 border-slate-600/30 text-slate-400"}`}>
                      {val.state === "bullish" ? <TrendingUp size={14} /> : val.state === "bearish" ? <TrendingDown size={14} /> : <Minus size={14} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-300">{INDICATOR_NAMES[key] ?? key}</span>
                        <span className={`text-[10px] font-bold ${val.state === "bullish" ? "text-emerald-400" : val.state === "bearish" ? "text-red-400" : "text-slate-500"}`}>
                          {val.state === "bullish" ? "看涨" : val.state === "bearish" ? "看跌" : "中性"}
                        </span>
                      </div>
                      {val.notes ? <p className="text-xs text-slate-500 mt-1">{val.notes}</p> : <p className="text-xs text-slate-700 italic mt-1">无备注</p>}
                    </div>
                    {val.imageData && (
                      <button className="flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border border-white/8 hover:border-amber-500/30 relative group" onClick={() => onImageClick(val.imageData!)}>
                        <img src={val.imageData} alt="K线图" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><ZoomIn size={12} className="text-white" /></div>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {record.notes && (
            <div className="rounded-xl border border-white/8 bg-slate-800/30 p-4">
              <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">交易备注</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{record.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
