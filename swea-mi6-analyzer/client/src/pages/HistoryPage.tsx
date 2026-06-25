import React, { useState, useEffect, useRef } from "react";
import {
  Search, Trash2, TrendingUp, TrendingDown, Minus,
  Calendar, Clock, X, ZoomIn, FileText, BarChart2, Pencil, ImagePlus,
} from "lucide-react";
import {
  getVerdictColor,
  TIMEFRAMES,
  type AnalysisRecord,
  type TradeRecord,
} from "@/lib/swea-data";
import { apiLoadRecords, apiDeleteRecord, apiUpdateRecord } from "@/lib/api";
import { toast } from "sonner";
import StatsDashboard from "@/components/StatsDashboard";

const SIGNAL_LABELS: Record<string, string> = {
  strong_bullish: "强烈多头",
  bullish:        "多头信号",
  strong_bearish: "强烈空头",
  bearish:        "空头信号",
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

export default function HistoryPage() {
  const [records, setRecords] = useState<AnalysisRecord[]>([]);
  const [activeTab, setActiveTab] = useState<"records" | "stats">("records");
  const [searchPair, setSearchPair] = useState("");
  const [filterSignal, setFilterSignal] = useState("all");
  const [filterTimeframe, setFilterTimeframe] = useState("all");
  const [selectedRecord, setSelectedRecord] = useState<AnalysisRecord | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<AnalysisRecord | null>(null);

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
    } catch {
      toast.error("更新失败，请重试");
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("确认删除这条记录？")) return;
    try {
      await apiDeleteRecord(id);
      const updated = await apiLoadRecords();
      setRecords(updated);
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

  const signalOptions = [
    { value: "all",            label: "全部信号" },
    { value: "strong_bullish", label: "强烈多头" },
    { value: "bullish",        label: "多头信号" },
    { value: "strong_bearish", label: "强烈空头" },
    { value: "bearish",        label: "空头信号" },
    { value: "mixed",          label: "信号混合" },
    { value: "no_signal",      label: "无明确信号" },
  ];

  return (
    <div className="min-h-screen">
      {/* ── Sticky Header ── */}
      <div className="border-b border-white/8 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-1 pt-3">
            <button
              onClick={() => setActiveTab("records")}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-semibold transition-all duration-150 border-b-2 ${
                activeTab === "records"
                  ? "border-amber-400 text-amber-400 bg-amber-400/5"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              <FileText size={14} />
              历史记录
              {records.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-slate-700 text-slate-400">
                  {records.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("stats")}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-semibold transition-all duration-150 border-b-2 ${
                activeTab === "stats"
                  ? "border-amber-400 text-amber-400 bg-amber-400/5"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              <BarChart2 size={14} />
              统计仪表盘
            </button>
          </div>

          {activeTab === "records" && (
            <div className="flex flex-wrap gap-2 py-2.5">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                <input
                  type="text"
                  value={searchPair}
                  onChange={(e) => setSearchPair(e.target.value)}
                  placeholder="搜索交易对..."
                  className="w-full h-8 pl-8 pr-3 rounded-lg border border-white/10 bg-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-amber-500/40 placeholder:text-slate-600"
                />
              </div>
              <select
                value={filterTimeframe}
                onChange={(e) => setFilterTimeframe(e.target.value)}
                className="h-8 px-2.5 rounded-lg border border-white/10 bg-slate-800 text-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              >
                <option value="all">全部时间框架</option>
                {TIMEFRAMES.map((tf) => <option key={tf} value={tf}>{tf}</option>)}
              </select>
              <select
                value={filterSignal}
                onChange={(e) => setFilterSignal(e.target.value)}
                className="h-8 px-2.5 rounded-lg border border-white/10 bg-slate-800 text-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              >
                {signalOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <div className="flex items-center text-[11px] text-slate-600 font-mono px-1 self-center">
                {filtered.length} / {records.length} 条
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
        {activeTab === "stats" ? (
          <StatsDashboard records={records} />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-700">
            <FileText size={40} className="mb-4 opacity-30" />
            <p className="text-sm">暂无记录</p>
            <p className="text-xs mt-1 text-slate-800">
              {records.length === 0
                ? "在「信号分析」页面完成分析后点击「保存记录」"
                : "没有符合筛选条件的记录"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((record) => (
              <RecordRow
                key={record.id}
                record={record}
                isSelected={selectedRecord?.id === record.id}
                onSelect={() => setSelectedRecord(selectedRecord?.id === record.id ? null : record)}
                onDelete={(e) => handleDelete(record.id, e)}
                onImageClick={(src) => setLightboxSrc(src)}
                onEdit={(e) => { e.stopPropagation(); setEditingRecord(record); }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedRecord && (
        <RecordDetailModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onImageClick={(src) => setLightboxSrc(src)}
        />
      )}

      {/* Edit Modal */}
      {editingRecord && (
        <EditRecordModal
          record={editingRecord}
          onClose={() => setEditingRecord(null)}
          onSave={handleUpdate}
        />
      )}

      {/* Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxSrc(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
            onClick={() => setLightboxSrc(null)}
          >
            <X size={24} />
          </button>
          <img
            src={lightboxSrc}
            alt="图表截图"
            className="max-w-full max-h-full rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

// ─── Record Row ───────────────────────────────────────────────────────────────

function RecordRow({
  record, isSelected, onSelect, onDelete, onImageClick, onEdit,
}: {
  record: AnalysisRecord;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onImageClick: (src: string) => void;
  onEdit: (e: React.MouseEvent) => void;
}) {
  const colorClass = getVerdictColor(record.verdict.signal);
  const date = new Date(record.date);
  const isBull = record.verdict.signal.includes("bullish");
  const isBear = record.verdict.signal.includes("bearish");
  const isMixed = record.verdict.signal === "mixed";
  const pnl = record.tradeRecord?.actualPnl;

  const borderBg = isBull
    ? "border-emerald-500/20 bg-emerald-500/5"
    : isBear
    ? "border-red-500/20 bg-red-500/5"
    : isMixed
    ? "border-amber-500/20 bg-amber-500/5"
    : "border-white/8 bg-slate-800/30";

  return (
    <div
      className={`rounded-xl border cursor-pointer transition-all duration-150 ${borderBg} ${
        isSelected ? "ring-1 ring-amber-500/30" : ""
      }`}
      onClick={onSelect}
    >
      <div className="px-4 py-3 flex items-center gap-3 flex-wrap sm:flex-nowrap">
        {/* Pair + timeframe */}
        <div className="flex-shrink-0 min-w-[72px]">
          <div className="text-sm font-bold text-slate-100" style={{ fontFamily: "'Fira Code', monospace" }}>
            {record.pair}
          </div>
          <div className="text-[10px] text-slate-600 font-mono">{record.timeframe}</div>
        </div>

        {/* Signal */}
        <div className="flex-shrink-0">
          <div className={`text-sm font-bold ${colorClass}`}>{SIGNAL_LABELS[record.verdict.signal]}</div>
          <div className="text-[10px] text-slate-600 font-mono">{record.verdict.confidence}% 可信度</div>
        </div>

        {/* Score dots */}
        <div className="hidden sm:flex items-center gap-1">
          {Array.from({ length: 6 }).map((_, i) => {
            let dotClass = "bg-slate-700";
            if (i < record.verdict.bullishCount) dotClass = "bg-emerald-500";
            else if (i < record.verdict.bullishCount + record.verdict.bearishCount) dotClass = "bg-red-500";
            return <div key={i} className={`w-2 h-2 rounded-full ${dotClass}`} />;
          })}
          <span className="text-[10px] text-slate-600 ml-1 font-mono">
            ↑{record.verdict.bullishCount} ↓{record.verdict.bearishCount}
          </span>
        </div>

        {/* Chart thumbnail */}
        {record.chartImage && (
          <button
            className="flex-shrink-0 w-12 h-8 rounded overflow-hidden border border-white/10 hover:border-amber-500/30 transition-colors"
            onClick={(e) => { e.stopPropagation(); onImageClick(record.chartImage!); }}
          >
            <img src={record.chartImage} alt="图表" className="w-full h-full object-cover" />
          </button>
        )}

        {/* PnL badge */}
        {pnl !== undefined && (
          <span className={`flex-shrink-0 text-xs font-bold font-mono px-2 py-0.5 rounded-full border ${
            pnl >= 0
              ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
              : "text-red-400 bg-red-500/10 border-red-500/20"
          }`}>
            {pnl >= 0 ? "+" : ""}{pnl}
          </span>
        )}

        <div className="flex-1" />

        {/* Date */}
        <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-600 flex-shrink-0">
          <Calendar size={10} />
          {date.toLocaleDateString("zh-CN")}
          <Clock size={10} className="ml-1" />
          {date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
        </div>

        {/* Edit button */}
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-teal-500/30 bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 text-[11px] font-medium transition-colors flex-shrink-0"
        >
          <Pencil size={11} />
          <span>修改</span>
        </button>

        {/* Delete */}
        <button
          onClick={onDelete}
          className="p-1.5 rounded hover:bg-red-500/15 text-slate-700 hover:text-red-400 transition-colors flex-shrink-0"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Expanded inline detail */}
      {isSelected && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(record.indicators).map(([key, val]) => (
              <div key={key} className="rounded-lg border border-white/8 bg-slate-900/40 p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-slate-400">{INDICATOR_NAMES[key] ?? key}</span>
                  <span className={`flex-shrink-0 ${
                    val.state === "bullish" ? "text-emerald-400"
                    : val.state === "bearish" ? "text-red-400"
                    : "text-slate-500"
                  }`}>
                    {val.state === "bullish" ? <TrendingUp size={12} />
                     : val.state === "bearish" ? <TrendingDown size={12} />
                     : <Minus size={12} />}
                  </span>
                </div>
                {val.notes
                  ? <p className="text-[11px] text-slate-500 leading-relaxed">{val.notes}</p>
                  : <p className="text-[11px] text-slate-700 italic">无备注</p>
                }
                {val.imageData && (
                  <button
                    className="mt-2 w-full h-16 rounded overflow-hidden border border-white/8 hover:border-amber-500/30 transition-colors relative group"
                    onClick={(e) => { e.stopPropagation(); onImageClick(val.imageData!); }}
                  >
                    <img src={val.imageData} alt="K线图" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ZoomIn size={16} className="text-white" />
                    </div>
                  </button>
                )}
              </div>
            ))}
          </div>
          {record.notes && (
            <div className="rounded-lg border border-white/8 bg-slate-900/40 p-3">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">交易备注</span>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{record.notes}</p>
            </div>
          )}
          {record.tradeRecord && (record.tradeRecord.entryPrice !== undefined || record.tradeRecord.actualPnl !== undefined) && (
            <div className="rounded-lg border border-teal-500/20 bg-teal-500/5 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-teal-500/70 uppercase tracking-wider">交易记录</span>
                {record.tradeRecord.status && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    record.tradeRecord.status === "closed"
                      ? "text-teal-400 border-teal-500/30 bg-teal-500/10"
                      : "text-amber-400 border-amber-500/30 bg-amber-500/10"
                  }`}>
                    {record.tradeRecord.status === "closed" ? "已完结" : "进行中"}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { label: "入场价位", val: record.tradeRecord.entryPrice, color: "text-slate-200" },
                  { label: "止盈 TP",  val: record.tradeRecord.takeProfit, color: "text-slate-200" },
                  { label: "止损 SL",  val: record.tradeRecord.stopLoss,   color: "text-red-400" },
                  { label: "实际盈亏", val: record.tradeRecord.actualPnl,  color: (record.tradeRecord.actualPnl ?? 0) >= 0 ? "text-emerald-400" : "text-red-400" },
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

// ─── Edit Record Modal ────────────────────────────────────────────────────────

function EditRecordModal({
  record, onClose, onSave,
}: {
  record: AnalysisRecord;
  onClose: () => void;
  onSave: (updated: AnalysisRecord) => Promise<void>;
}) {
  const [trade, setTrade] = useState<TradeRecord>(record.tradeRecord ?? { status: "open" });
  const [notes, setNotes] = useState(record.notes ?? "");
  const [chartImage, setChartImage] = useState<string | undefined>(record.chartImage);
  const [saving, setSaving] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
      notes: notes.trim() || undefined,
      chartImage,
      tradeRecord: (trade.entryPrice || trade.takeProfit || trade.stopLoss || trade.actualPnl !== undefined) ? trade : undefined,
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

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div>
            <div className="text-sm font-bold text-slate-100" style={{ fontFamily: "'Sora', sans-serif" }}>
              修改记录
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">{record.pair} · {record.timeframe}</div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Chart image */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">行情图表</label>
            {chartImage ? (
              <div className="relative group rounded-xl overflow-hidden border border-white/10">
                <img src={chartImage} alt="行情图表" className="w-full h-36 object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    onClick={() => setLightbox(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
                  >
                    <ZoomIn size={13} />查看
                  </button>
                  <button
                    onClick={() => setChartImage(undefined)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-medium transition-colors"
                  >
                    <X size={13} />删除
                  </button>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 text-xs font-medium transition-colors"
                  >
                    <ImagePlus size={13} />替换
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-6 rounded-xl border border-dashed border-white/10 text-slate-600 hover:border-teal-500/30 hover:text-teal-500/60 text-sm transition-all"
              >
                <ImagePlus size={16} />
                <span>点击上传图表截图</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>

          {/* Trade record */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-slate-500">交易记录</label>
              <div className="flex gap-1.5">
                {(["open", "closed"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setTrade((p) => ({ ...p, status: s }))}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all ${
                      trade.status === s
                        ? s === "closed"
                          ? "bg-teal-500/20 text-teal-400 border-teal-500/30"
                          : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                        : "text-slate-600 border-white/8 hover:text-slate-400"
                    }`}
                  >
                    {s === "closed" ? "已完结" : "进行中"}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {([
                { key: "entryPrice" as const, label: "入场价位", placeholder: "0.00000", color: "" },
                { key: "takeProfit"  as const, label: "止盈 (TP)", placeholder: "0.00000", color: "" },
                { key: "stopLoss"   as const, label: "止损 (SL)", placeholder: "0.00000", color: "text-red-400" },
                { key: "actualPnl"  as const, label: "实际盈亏",  placeholder: "+0.00",   color: "text-emerald-400" },
              ]).map(({ key, label, placeholder, color }) => (
                <div key={key}>
                  <label className="block text-[10px] text-slate-500 mb-1.5">{label}</label>
                  <input
                    type="number"
                    step="any"
                    value={trade[key] !== undefined ? String(trade[key]) : ""}
                    onChange={(e) => setTradeField(key, e.target.value)}
                    placeholder={placeholder}
                    className={`w-full px-3 py-2 rounded-lg border border-white/8 bg-slate-800/60 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-teal-500/30 placeholder:text-slate-700 transition-colors ${color || "text-slate-200"}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">交易备注</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="分析思路、入场理由、风险提示等..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-white/8 bg-slate-800/40 text-sm text-slate-200 placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500/30 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 h-10 rounded-xl border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-sm transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 h-10 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
            >
              {saving ? "保存中..." : "保存修改"}
            </button>
          </div>
        </div>
      </div>

      {lightbox && chartImage && (
        <div className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(false)}>
          <button className="absolute top-4 right-4 text-white/60 hover:text-white" onClick={() => setLightbox(false)}>
            <X size={24} />
          </button>
          <img src={chartImage} alt="行情图表" className="max-w-full max-h-full rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

// ─── Record Detail Modal ──────────────────────────────────────────────────────

function RecordDetailModal({
  record, onClose, onImageClick,
}: {
  record: AnalysisRecord;
  onClose: () => void;
  onImageClick: (src: string) => void;
}) {
  const colorClass = getVerdictColor(record.verdict.signal);
  const date = new Date(record.date);
  const isBull = record.verdict.signal.includes("bullish");
  const isBear = record.verdict.signal.includes("bearish");

  return (
    <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-slate-100" style={{ fontFamily: "'Fira Code', monospace" }}>
                {record.pair}
              </span>
              <span className="text-sm text-slate-500 font-mono">{record.timeframe}</span>
              <span className={`text-sm font-bold ${colorClass}`}>{SIGNAL_LABELS[record.verdict.signal]}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-600 mt-1">
              <Calendar size={10} />
              {date.toLocaleString("zh-CN")}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className={`rounded-xl border p-4 ${
            isBull ? "border-emerald-500/25 bg-emerald-500/5"
            : isBear ? "border-red-500/25 bg-red-500/5"
            : "border-amber-500/20 bg-amber-500/5"
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-xl font-bold ${colorClass}`} style={{ fontFamily: "'Sora', sans-serif" }}>
                  {SIGNAL_LABELS[record.verdict.signal]}
                </div>
                <div className="text-xs text-slate-500 mt-1">{record.verdict.description}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-amber-400" style={{ fontFamily: "'Fira Code', monospace" }}>
                  {record.verdict.confidence}%
                </div>
                <div className="text-[10px] text-slate-600">可信度</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="text-center p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-xl font-bold text-emerald-400 font-mono">{record.verdict.bullishCount}</div>
                <div className="text-[10px] text-emerald-400/60 mt-0.5">看涨</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="text-xl font-bold text-red-400 font-mono">{record.verdict.bearishCount}</div>
                <div className="text-[10px] text-red-400/60 mt-0.5">看跌</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-slate-700/30 border border-slate-600/20">
                <div className="text-xl font-bold text-slate-400 font-mono">{record.verdict.neutralCount}</div>
                <div className="text-[10px] text-slate-500/60 mt-0.5">中性</div>
              </div>
            </div>
          </div>

          {record.chartImage && (
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">整体行情图表</h3>
              <button
                className="w-full rounded-xl overflow-hidden border border-white/10 hover:border-amber-500/30 transition-colors relative group"
                onClick={() => onImageClick(record.chartImage!)}
              >
                <img src={record.chartImage} alt="行情图表" className="w-full max-h-48 object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ZoomIn size={24} className="text-white" />
                </div>
              </button>
            </div>
          )}

          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">6 大指标详情</h3>
            <div className="space-y-2">
              {Object.entries(record.indicators).map(([key, val]) => (
                <div key={key} className="rounded-xl border border-white/8 bg-slate-800/30 p-3">
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border ${
                      val.state === "bullish" ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                      : val.state === "bearish" ? "bg-red-500/15 border-red-500/30 text-red-400"
                      : "bg-slate-700/40 border-slate-600/30 text-slate-400"
                    }`}>
                      {val.state === "bullish" ? <TrendingUp size={14} />
                       : val.state === "bearish" ? <TrendingDown size={14} />
                       : <Minus size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-300">{INDICATOR_NAMES[key] ?? key}</span>
                        <span className={`text-[10px] font-bold ${
                          val.state === "bullish" ? "text-emerald-400"
                          : val.state === "bearish" ? "text-red-400"
                          : "text-slate-500"
                        }`}>
                          {val.state === "bullish" ? "看涨" : val.state === "bearish" ? "看跌" : "中性"}
                        </span>
                      </div>
                      {val.notes
                        ? <p className="text-xs text-slate-500 mt-1 leading-relaxed">{val.notes}</p>
                        : <p className="text-xs text-slate-700 italic mt-1">无备注</p>
                      }
                    </div>
                    {val.imageData && (
                      <button
                        className="flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border border-white/8 hover:border-amber-500/30 transition-colors relative group"
                        onClick={() => onImageClick(val.imageData!)}
                      >
                        <img src={val.imageData} alt="K线图" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ZoomIn size={12} className="text-white" />
                        </div>
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
