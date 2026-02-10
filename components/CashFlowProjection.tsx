
import React from 'react';
import { YearProjection } from '../types';

interface CashFlowProjectionProps {
  projections: YearProjection[];
  stationCost: number;
}

const CashFlowProjection: React.FC<CashFlowProjectionProps> = ({ projections, stationCost }) => {
  // Show first 10 years for the chart display
  const displayData = projections.slice(0, 10);
  const maxCumulative = Math.max(...displayData.map(d => d.cumulativeRevenue));
  const maxNet = maxCumulative - stationCost;
  
  // Use a balanced scale to ensure zero line is centered if possible, 
  // or relative to the actual range of values.
  const maxAbsValue = Math.max(stationCost, maxNet);
  
  const getNetValue = (cumulative: number) => cumulative - stationCost;

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex-1 flex flex-col overflow-hidden">
      <h2 className="text-lg font-bold mb-6 text-slate-800 dark:text-slate-100">Cash Flow Projection</h2>
      
      <div className="flex-1 min-h-[420px] flex relative pt-12 pb-12">
        {/* Grid Guidelines (Horizontal & Vertical) */}
        <div className="absolute inset-0 flex flex-col justify-between py-12 pointer-events-none px-2">
          {/* Horizontal Lines */}
          <div className="border-t border-slate-200 dark:border-slate-800 w-full h-0 opacity-50"></div>
          <div className="border-t border-slate-200 dark:border-slate-800 w-full h-0 opacity-50"></div>
          <div className="border-t border-slate-200 dark:border-slate-800 w-full h-0 opacity-50"></div>
          <div className="border-t border-slate-200 dark:border-slate-800 w-full h-0 opacity-50"></div>
          <div className="border-t border-slate-200 dark:border-slate-800 w-full h-0 opacity-50"></div>

          {/* Zero Baseline Line - Centered within the vertical flex container */}
          <div className="absolute top-1/2 left-0 right-0 border-t-2 border-slate-300 dark:border-slate-700 z-20"></div>

          {/* Vertical Lines */}
          <div className="absolute inset-0 flex justify-between px-2">
             {displayData.map((_, i) => (
               <div key={`v-line-${i}`} className="h-full w-px bg-slate-200 dark:bg-slate-800 opacity-50"></div>
             ))}
          </div>
        </div>

        {/* Bars Container */}
        <div className="flex-1 flex items-stretch gap-2 px-2 z-10">
          {displayData.map((d, i) => {
            const netValue = getNetValue(d.cumulativeRevenue);
            const isPositive = netValue >= 0;
            
            // Heights are calculated as % of the 50% available space (above or below center)
            const barHeightPercent = (Math.abs(netValue) / maxAbsValue) * 100;

            const greenShade = isPositive ? `rgba(16, 185, 129, ${0.4 + (i / 10) * 0.6})` : 'transparent';
            const roseShade = !isPositive ? `rgba(244, 63, 94, ${0.3 + (i / 10) * 0.4})` : 'transparent';

            return (
              <div key={i} className="flex-1 flex flex-col group transition-all relative">
                {/* Upper Half (Positive Revenue) */}
                <div className="flex-1 flex flex-col justify-end relative">
                   {isPositive && (
                     <div 
                       className="w-full rounded-t-sm transition-all duration-700 ease-out relative group-hover:brightness-110"
                       style={{ height: `${barHeightPercent}%`, backgroundColor: greenShade }}
                     >
                       {/* Label at the absolute tip of the positive bar */}
                       <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap">
                         <span className="text-[10px] font-bold text-emerald-600">
                           ${(netValue / 1000).toFixed(0)}k
                         </span>
                       </div>
                     </div>
                   )}
                </div>

                {/* Lower Half (Initial Deficit) */}
                <div className="flex-1 flex flex-col justify-start relative">
                   {!isPositive && (
                     <div 
                       className="w-full rounded-b-sm transition-all duration-700 ease-out relative group-hover:brightness-110"
                       style={{ height: `${barHeightPercent}%`, backgroundColor: roseShade }}
                     >
                       {/* Label at the absolute tip of the negative bar */}
                       <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap">
                         <span className="text-[10px] font-bold text-rose-500">
                           -${(Math.abs(netValue) / 1000).toFixed(0)}k
                         </span>
                       </div>
                     </div>
                   )}
                </div>
                
                {/* Year Label */}
                <div className="absolute bottom-[-36px] left-0 right-0 text-center">
                  <span className="text-[10px] text-slate-400 font-bold group-hover:text-primary transition-colors">{d.year}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-16 flex justify-center gap-8 text-[10px] font-bold uppercase tracking-widest text-slate-400 no-print">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-rose-200 dark:bg-rose-900/40"></div>
          <span>Growth Phase</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-emerald-500"></div>
          <span>Cumulative Flow</span>
        </div>
      </div>
    </div>
  );
};

export default CashFlowProjection;
