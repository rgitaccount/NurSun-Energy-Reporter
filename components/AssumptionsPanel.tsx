
import React from 'react';
import { ProjectAssumptions } from '../types';

interface AssumptionsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  assumptions: ProjectAssumptions;
  onChange: (newAssumptions: ProjectAssumptions) => void;
}

const AssumptionsPanel: React.FC<AssumptionsPanelProps> = ({ isOpen, onClose, assumptions, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onChange({
      ...assumptions,
      [name]: e.target.type === 'number' ? parseFloat(value) || 0 : value,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-md bg-white dark:bg-slate-950 shadow-2xl flex flex-col">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-950 sticky top-0">
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <span className="material-icons-outlined text-primary">settings</span>
              Project Settings
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
              <span className="material-icons-outlined">close</span>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            {/* Context Section */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Project Context</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Customer / Client</label>
                  <input 
                    type="text" name="customerName" value={assumptions.customerName} onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-primary focus:border-primary px-4 py-2.5"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Project Venue / Location</label>
                  <input 
                    type="text" name="projectLocation" value={assumptions.projectLocation} onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-primary focus:border-primary px-4 py-2.5"
                  />
                </div>
              </div>
            </div>

            {/* Profile Section */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Manager Profile</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Manager Name</label>
                  <input 
                    type="text" name="managerName" value={assumptions.managerName} onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-primary focus:border-primary px-4 py-2.5"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Manager Role</label>
                  <input 
                    type="text" name="managerRole" value={assumptions.managerRole} onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-primary focus:border-primary px-4 py-2.5"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Financials</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Station Cost (USD)</label>
                  <input 
                    type="number" name="stationCost" value={assumptions.stationCost} onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-primary focus:border-primary px-4 py-2.5"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">USD/SOM Exchange Rate</label>
                  <input 
                    type="number" name="usdSomExchange" value={assumptions.usdSomExchange} onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-primary focus:border-primary px-4 py-2.5"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Inflation Rate (Decimal)</label>
                  <input 
                    type="number" step="0.001" name="inflationRate" value={assumptions.inflationRate} onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-primary focus:border-primary px-4 py-2.5"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Technical Specs</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">System Capacity (kW)</label>
                  <input 
                    type="number" name="systemCapacity" value={assumptions.systemCapacity} onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-primary focus:border-primary px-4 py-2.5"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Year 1 Annual Yield (kWh)</label>
                  <input 
                    type="number" name="annualYieldYear1" value={assumptions.annualYieldYear1} onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-primary focus:border-primary px-4 py-2.5"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Panel Degradation (Decimal)</label>
                  <input 
                    type="number" step="0.0001" name="panelDegradation" value={assumptions.panelDegradation} onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-primary focus:border-primary px-4 py-2.5"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Grid & Policy</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Base Tariff (Som/kWh)</label>
                  <input 
                    type="number" step="0.01" name="baseTariff" value={assumptions.baseTariff} onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-primary focus:border-primary px-4 py-2.5"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Project Lifetime (Years)</label>
                  <input 
                    type="number" name="projectLifetime" value={assumptions.projectLifetime} onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-primary focus:border-primary px-4 py-2.5"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <button 
              onClick={onClose}
              className="w-full py-3.5 bg-primary text-white rounded-2xl font-bold hover:bg-blue-800 transition-all shadow-lg shadow-primary/20"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssumptionsPanel;
