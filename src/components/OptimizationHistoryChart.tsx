import React, { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from "recharts";
import { SavedPlan } from "../types";
import { TrendingDown, TrendingUp, Filter, BarChart2, Coins, Calendar } from "lucide-react";

interface OptimizationHistoryChartProps {
  savedPlans: SavedPlan[];
  activePlan: SavedPlan | null;
}

export const OptimizationHistoryChart: React.FC<OptimizationHistoryChartProps> = ({
  savedPlans,
  activePlan
}) => {
  const [filterMode, setFilterMode] = useState<"domain" | "all">("domain");

  if (savedPlans.length === 0) {
    return null;
  }

  // Filter plans based on selection and sort by date/time ascending to trace correct chronology
  const targetPlans = savedPlans
    .filter((p) => {
      if (filterMode === "domain" && activePlan) {
        return p.domain === activePlan.domain;
      }
      return true;
    })
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Format data specifically for Recharts mapping keys
  const chartData = targetPlans.map((plan, index) => {
    const dateObj = new Date(plan.createdAt);
    const dateFormatted = dateObj.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric"
    });
    const timeFormatted = dateObj.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
    
    return {
      index: index + 1,
      id: plan.id,
      title: plan.refinementResult.title || "Refined Plan",
      name: `v${index + 1} (${dateFormatted})`,
      shortTitle: (plan.refinementResult.title || "Refined").substring(0, 15) + "...",
      tokens: plan.refinementResult.estimatedTokens,
      rawDate: plan.createdAt,
      dateLabel: `${dateFormatted} ${timeFormatted}`,
      tier: plan.selectedTier,
      domain: plan.domain,
      isActive: activePlan?.id === plan.id
    };
  });

  // KPI Calculations
  const tokenList = targetPlans.map((p) => p.refinementResult.estimatedTokens);
  const avgTokens = tokenList.length > 0 
    ? Math.round(tokenList.reduce((sum, val) => sum + val, 0) / tokenList.length) 
    : 0;
  
  const minTokens = tokenList.length > 0 ? Math.min(...tokenList) : 0;
  const maxTokens = tokenList.length > 0 ? Math.max(...tokenList) : 0;
  
  // Calculate potential credit shield / maximum saving ratio relative to peak consumption
  const maxSavingsPercent = maxTokens > 0 && maxTokens > minTokens
    ? Math.round(((maxTokens - minTokens) / maxTokens) * 100) 
    : 0;

  // Custom tooltips match the custom minimalist theme styles perfectly
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl border border-slate-800 shadow-xl text-left max-w-xs space-y-2 font-sans" id="chart-custom-tooltip">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 gap-2">
            <span className="text-[10px] uppercase font-bold text-teal-400 bg-teal-950 px-2 py-0.5 rounded border border-teal-800/40">
              {data.domain}
            </span>
            <span className="text-[10px] text-slate-400 flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>{data.dateLabel}</span>
            </span>
          </div>
          
          <div className="space-y-1">
            <h5 className="text-xs font-bold font-sans text-white line-clamp-1">
              {data.title}
            </h5>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-slate-400 text-[11px]">Calculated Cost:</span>
              <span className="text-xs font-mono font-bold text-teal-400">
                {data.tokens.toLocaleString()} tokens
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-slate-400 text-[11px]">Selected Tier:</span>
              <span className="text-xs font-semibold text-slate-300">
                Tier {data.tier}
              </span>
            </div>
          </div>
          
          {data.isActive && (
            <div className="text-[9px] text-center font-bold text-indigo-400 bg-indigo-950/80 rounded py-1 border border-indigo-900 border-dashed">
              Currently Selected Active Blueprint
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6" id="optimization-performance-card">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
              <BarChart2 className="h-4 w-4" />
            </div>
            <h4 className="font-display font-semibold text-slate-950 text-sm">
              Specification Asset Optimization History
            </h4>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Track resource footprints and optimization trends across generated blueprints
          </p>
        </div>

        {/* View Toggle Controller */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-center border border-slate-200/60 font-sans">
          <button
            onClick={() => setFilterMode("domain")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
              filterMode === "domain"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
            id="btn-filter-domain"
          >
            <Filter className="h-3 w-3" />
            <span>Active Domain ({activePlan?.domain || "None"})</span>
          </button>
          
          <button
            onClick={() => setFilterMode("all")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
              filterMode === "all"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
            id="btn-filter-all"
          >
            <span>Show All Specs</span>
          </button>
        </div>
      </div>

      {chartData.length < 2 ? (
        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200/60 border-dashed text-center">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <Coins className="h-5 w-5" />
          </div>
          <p className="text-xs text-slate-600 font-semibold">Generating optimization metrics...</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Create and save another Tier specification for areawide footprint historical comparison trends.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Historical Micro KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 flex items-center justify-between" id="kpi-savings-rate">
              <div className="space-y-1">
                <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Potential Credit Saved</span>
                <span className="block text-lg font-bold text-emerald-600 font-mono">
                  {maxSavingsPercent > 0 ? `${maxSavingsPercent}%` : "0% Opt"}
                </span>
              </div>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <TrendingDown className="h-4 w-4" />
              </div>
            </div>

            <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 flex items-center justify-between" id="kpi-avg-footprint">
              <div className="space-y-1">
                <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Average Spec Footprint</span>
                <span className="block text-lg font-bold text-slate-800 font-mono">
                  {avgTokens.toLocaleString()} <span className="text-xs font-normal text-slate-500 font-sans">tokens</span>
                </span>
              </div>
              <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                <Coins className="h-4 w-4 text-slate-500" />
              </div>
            </div>

            <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 flex items-center justify-between" id="kpi-active-deviation">
              <div className="space-y-1">
                <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Deviation vs. Avg</span>
                {activePlan ? (
                  (() => {
                    const deviationAmt = activePlan.refinementResult.estimatedTokens - avgTokens;
                    const deviationPercent = avgTokens > 0 ? Math.round((deviationAmt / avgTokens) * 100) : 0;
                    const isOver = deviationAmt > 0;
                    return (
                      <span className={`block text-lg font-bold ${isOver ? "text-amber-600" : "text-indigo-600"} font-mono`}>
                        {isOver ? "+" : ""}{deviationPercent}% {isOver ? "above avg" : "below avg"}
                      </span>
                    );
                  })()
                ) : (
                  <span className="block text-lg font-bold text-slate-400 font-mono">N/A</span>
                )}
              </div>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <TrendingUp className="h-4 w-4 text-indigo-500" />
              </div>
            </div>

          </div>

          {/* Line Chart Workspace Canvas */}
          <div className="h-64 sm:h-72 w-full pt-1" id="recharts-line-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 15, right: 20, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                
                <XAxis 
                  dataKey="name" 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                />
                
                <YAxis 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                  tickFormatter={(val) => `${val / 1000}k`}
                />

                <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#e2e8f0", strokeWidth: 1 }} />
                
                {/* Horizontal average guideline reference */}
                <ReferenceLine 
                  y={avgTokens} 
                  stroke="#94a3b8" 
                  strokeDasharray="4 4"
                  strokeWidth={1}
                  label={{ 
                    value: "Domain Avg", 
                    position: "insideBottomRight", 
                    fill: "#64748b",
                    fontSize: 8.5,
                    fontFamily: "monospace"
                  }} 
                />

                <Line
                  type="monotone"
                  dataKey="tokens"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    const isActive = payload.isActive;
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isActive ? 6 : 4}
                        fill={isActive ? "#14b8a6" : "#6366f1"}
                        stroke="#ffffff"
                        strokeWidth={2}
                        id={`chart-dot-${payload.id}`}
                      />
                    );
                  }}
                  activeDot={{ r: 8, strokeWidth: 0, fill: "#14b8a6" }}
                  legendType="none"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[10px] text-slate-400 italic text-center">
            * Teal dots (<span className="inline-block w-2 h-2 rounded-full bg-teal-500"></span>) denote currently selected Active specifications. Line chart tracks sequential compilation metrics.
          </p>

        </div>
      )}
      
    </div>
  );
};
