
import React from 'react';

interface SummaryCardsProps {
  cost: number;
  capacity: number;
  yield: number;
  payback: number;
  totalRoi: number;
  onEdit: () => void;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ cost, capacity, yield: annualYield, payback, totalRoi, onEdit }) => {
  const cardClass = "bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all active:scale-[0.98]";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      {/* CAPEX Card */}
      <div className={cardClass} onClick={onEdit}>
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <span className="material-icons-outlined text-blue-600">account_balance_wallet</span>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-full uppercase tracking-wider">CAPEX</span>
        </div>
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">Station Cost</p>
          <h3 className="text-xl font-bold mt-1 tracking-tight text-slate-900 dark:text-white">
            ${cost.toLocaleString('en-US', { minimumFractionDigits: 0 }).replace(/,/g, ' ')}
          </h3>
        </div>
      </div>

      {/* Capacity Card */}
      <div className={cardClass} onClick={onEdit}>
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-500">
            <span className="material-icons-outlined">bolt</span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 bg-slate-50 dark:bg-slate-800 rounded-full uppercase tracking-wider">Installed</span>
        </div>
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">System Capacity</p>
          <h3 className="text-xl font-bold mt-1 tracking-tight text-slate-900 dark:text-white">
            {capacity.toLocaleString('en-US').replace(/,/g, ' ')} <span className="text-sm font-medium text-slate-400">kW</span>
          </h3>
        </div>
      </div>

      {/* Yield Card */}
      <div className={cardClass} onClick={onEdit}>
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-500">
            <span className="material-icons-outlined">settings_suggest</span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 bg-slate-50 dark:bg-slate-800 rounded-full uppercase tracking-wider">Year 1</span>
        </div>
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">Annual Yield</p>
          <h3 className="text-xl font-bold mt-1 tracking-tight text-slate-900 dark:text-white">
            {annualYield.toLocaleString('en-US').replace(/,/g, ' ')} <span className="text-sm font-medium text-slate-400">kWh</span>
          </h3>
        </div>
      </div>

      {/* Payback Card */}
      <div className={cardClass} onClick={onEdit}>
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-500">
            <span className="material-icons-outlined">trending_up</span>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-full uppercase tracking-wider">Estimated</span>
        </div>
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">Payback Period</p>
          <h3 className="text-xl font-bold mt-1 tracking-tight text-slate-900 dark:text-white">
            {payback.toFixed(1)} <span className="text-sm font-medium text-slate-400">Years</span>
          </h3>
        </div>
      </div>

      {/* ROI Card */}
      <div className={cardClass} onClick={onEdit}>
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-lg text-rose-500">
            <span className="material-icons-outlined">pie_chart</span>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-full uppercase tracking-wider">Projected</span>
        </div>
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">Total ROI</p>
          <h3 className="text-xl font-bold mt-1 tracking-tight text-slate-900 dark:text-white">
            {totalRoi.toFixed(0)} <span className="text-sm font-medium text-slate-400">%</span>
          </h3>
        </div>
      </div>
    </div>
  );
};

export default SummaryCards;
