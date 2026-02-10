
import React, { useState, useMemo, useEffect } from 'react';
import { ProjectAssumptions, YearProjection } from './types';
import SummaryCards from './components/SummaryCards';
import CashFlowProjection from './components/CashFlowProjection';
import AssumptionsPanel from './components/AssumptionsPanel';
import PdfPreview from './components/PdfPreview';
import Sidebar from './components/Sidebar';
import PvPerformance from './components/PvPerformance';
import { storageService, SavedProject } from './services/storageService';

const DEFAULT_ASSUMPTIONS: ProjectAssumptions = {
  stationCost: 694000,
  systemCapacity: 1000,
  annualYieldYear1: 1683000,
  usdSomExchange: 87.50,
  panelDegradation: 0.0055,
  inflationRate: 0.07,
  baseTariff: 4.47,
  projectLifetime: 25,
  managerName: 'Milan Turdumambetov',
  managerRole: 'Project Manager',
  projectLocation: 'Bishkek, Kyrgyzstan',
  customerName: 'Standard Group Logistics'
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [assumptions, setAssumptions] = useState<ProjectAssumptions>(DEFAULT_ASSUMPTIONS);
  const [showFullDataset, setShowFullDataset] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // Database States
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  // Load database on mount
  useEffect(() => {
    setSavedProjects(storageService.getAllProjects());
  }, []);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSaveToDatabase = () => {
    storageService.saveProject({
      name: `${assumptions.customerName} - ${assumptions.systemCapacity}kW`,
      assumptions: assumptions,
      technicalResults: {
        monthlyData: [], // Placeholder or real data if available
        totalAnnual: assumptions.annualYieldYear1
      }
    });
    setSavedProjects(storageService.getAllProjects());
    showToast("Assessment saved to Local Database");
  };

  const handleLoadProject = (project: SavedProject) => {
    setAssumptions(project.assumptions);
    setActiveTab('dashboard');
    showToast(`Loaded scenario: ${project.name}`);
  };

  const handleDeleteProject = (id: string) => {
    storageService.deleteProject(id);
    setSavedProjects(storageService.getAllProjects());
    showToast("Project removed from Database");
  };

  const projections = useMemo(() => {
    const data: YearProjection[] = [];
    let currentCumulative = 0;
    let breakEvenYearFound = false;

    for (let i = 0; i < assumptions.projectLifetime; i++) {
      const year = 2026 + i;
      const degradationFactor = Math.pow(1 - assumptions.panelDegradation, i);
      const inflationFactor = Math.pow(1 + assumptions.inflationRate, i);
      
      const annualYield = assumptions.annualYieldYear1 * degradationFactor;
      const tariff = assumptions.baseTariff * inflationFactor;
      
      const revenue = (annualYield * tariff) / assumptions.usdSomExchange;
      currentCumulative += revenue;

      let isBreakEven = false;
      if (!breakEvenYearFound && currentCumulative >= assumptions.stationCost) {
        isBreakEven = true;
        breakEvenYearFound = true;
      }

      data.push({
        year,
        tariff: parseFloat(tariff.toFixed(2)),
        yield: Math.round(annualYield),
        revenue: Math.round(revenue),
        cumulativeRevenue: Math.round(currentCumulative),
        isBreakEven
      });
    }
    return data;
  }, [assumptions]);

  const paybackPeriod = useMemo(() => {
    const breakEven = projections.find(p => p.isBreakEven);
    if (!breakEven) return assumptions.projectLifetime;
    const idx = projections.indexOf(breakEven);
    if (idx === 0) return 1;
    const prevYear = projections[idx - 1];
    const needed = assumptions.stationCost - prevYear.cumulativeRevenue;
    return (breakEven.year - 2026) + (needed / breakEven.revenue);
  }, [projections, assumptions.stationCost, assumptions.projectLifetime]);

  const totalRoi = useMemo(() => {
    const finalCumulative = projections[projections.length - 1].cumulativeRevenue;
    return (finalCumulative / assumptions.stationCost) * 100;
  }, [projections, assumptions.stationCost]);

  const handleApplyYield = (newYield: number) => {
    setAssumptions(prev => ({ ...prev, annualYieldYear1: newYield }));
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('en-US', { minimumFractionDigits: 0 }).replace(/,/g, ' ');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'projections':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="space-y-2">
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Financial Projections</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">{assumptions.systemCapacity} kW Commercial PV Project</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={handleSaveToDatabase}
                  className="flex items-center gap-2 px-6 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm text-slate-600 dark:text-slate-300"
                >
                  <span className="material-icons-outlined text-lg text-emerald-500">save</span>
                  Save to Database
                </button>
                <button 
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm text-slate-600 dark:text-slate-300"
                >
                  <span className="material-icons-outlined text-lg text-primary">visibility</span>
                  Preview PDF
                </button>
              </div>
            </div>

            <SummaryCards 
              cost={assumptions.stationCost} 
              capacity={assumptions.systemCapacity} 
              yield={assumptions.annualYieldYear1} 
              payback={paybackPeriod} 
              totalRoi={totalRoi}
              onEdit={() => setIsPanelOpen(true)}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="p-8 pb-4 flex justify-between items-center bg-white dark:bg-slate-900">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Full Cash Flow Analysis</h2>
                    <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Inflation {(assumptions.inflationRate * 100).toFixed(1)}%
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        Degradation {(assumptions.panelDegradation * 100).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-slate-400 text-[10px] font-bold uppercase tracking-widest bg-slate-50/50 dark:bg-slate-800/30 border-y border-slate-100 dark:border-slate-800">
                          <th className="px-8 py-4">Year</th>
                          <th className="px-8 py-4 text-right">Tariff (Som)</th>
                          <th className="px-8 py-4 text-right">Yield (kWh)</th>
                          <th className="px-8 py-4 text-right">Revenue (USD)</th>
                          <th className="px-8 py-4 text-right">Cumulative USD</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                        {projections.map((row, index) => {
                          const isAfterPayback = row.cumulativeRevenue >= assumptions.stationCost;
                          const isHiddenOnWeb = !showFullDataset && index >= 10;
                          if (isHiddenOnWeb) return null;
                          
                          return (
                            <tr key={row.year} className={`group transition-colors ${row.isBreakEven ? 'bg-emerald-50/30 dark:bg-emerald-900/10' : ''}`}>
                              <td className={`px-8 py-5 font-bold text-sm ${row.isBreakEven ? 'text-emerald-600' : 'text-slate-500 dark:text-slate-400'}`}>{row.year}</td>
                              <td className="px-8 py-5 text-right font-bold text-sm text-slate-900 dark:text-slate-100">{row.tariff.toFixed(2)}</td>
                              <td className="px-8 py-5 text-right font-bold text-sm text-slate-900 dark:text-slate-100">{formatCurrency(row.yield)}</td>
                              <td className={`px-8 py-5 text-right font-bold text-sm ${isAfterPayback ? 'text-emerald-600' : 'text-slate-900 dark:text-slate-100'}`}>${formatCurrency(row.revenue)}</td>
                              <td className={`px-8 py-5 text-right font-black text-sm ${isAfterPayback ? 'text-emerald-600' : 'text-slate-300 dark:text-slate-600'}`}>${formatCurrency(row.cumulativeRevenue)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-6 text-center border-t border-slate-50 dark:border-slate-800">
                    <button type="button" onClick={() => setShowFullDataset(!showFullDataset)} className="text-primary font-bold text-xs uppercase tracking-widest hover:underline">
                      {showFullDataset ? 'View Condensed View' : `View All ${assumptions.projectLifetime} Projection Years`}
                    </button>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1 space-y-6">
                <CashFlowProjection projections={projections} stationCost={assumptions.stationCost} />
                <div className="bg-[#1B2952] p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group cursor-pointer" onClick={() => setIsPanelOpen(true)}>
                   <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
                   <h2 className="text-lg font-bold mb-6 flex items-center gap-3">
                     <span className="material-icons-outlined text-emerald-400">insights</span>
                     Sensitivity & Assumptions
                   </h2>
                   <div className="space-y-4">
                     {[
                       ['USD/SOM Exchange', assumptions.usdSomExchange.toFixed(2)],
                       ['Panel Degradation', `${(assumptions.panelDegradation * 100).toFixed(2)}% p.a.`],
                       ['Inflation Rate', `${(assumptions.inflationRate * 100).toFixed(1)}% p.a.`],
                       ['Project Lifetime', `${assumptions.projectLifetime} Years`],
                       ['Initial Tariff', `${assumptions.baseTariff} Som/kWh`]
                     ].map(([label, val]) => (
                       <div key={label} className="flex justify-between items-center border-b border-white/10 pb-3">
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
                         <span className="text-sm font-bold">{val}</span>
                       </div>
                     ))}
                   </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'performance':
        return <PvPerformance onApplyYield={handleApplyYield} initialCapacity={assumptions.systemCapacity} customerName={assumptions.customerName} />;
      case 'dashboard':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            <div className="mb-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="space-y-2">
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Project Dashboard</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">Global Status — {assumptions.customerName}</p>
              </div>
              <button 
                onClick={handleSaveToDatabase}
                className="flex items-center gap-2 px-6 py-3 bg-[#2B4184] text-white rounded-xl font-bold text-sm hover:brightness-110 transition-all shadow-xl shadow-blue-900/20"
              >
                <span className="material-icons-outlined text-lg">save</span>
                Save Database Entry
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                  <span className="material-icons-outlined text-primary mb-4 text-3xl">solar_power</span>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-2">Technical Feasibility</h3>
                  <p className="text-slate-900 dark:text-white font-bold mb-4">Site technical assessment complete. Using PVGIS 5.2 benchmarks.</p>
                  <button onClick={() => setActiveTab('performance')} className="text-primary text-xs font-black uppercase tracking-widest hover:underline">Go to Technical Modeling</button>
               </div>
               <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                  <span className="material-icons-outlined text-emerald-500 mb-4 text-3xl">account_balance</span>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-2">Financial Standing</h3>
                  <p className="text-slate-900 dark:text-white font-bold mb-4">Payback expected in {paybackPeriod.toFixed(1)} years with {(assumptions.inflationRate * 100).toFixed(0)}% CPI escalation.</p>
                  <button onClick={() => setActiveTab('projections')} className="text-primary text-xs font-black uppercase tracking-widest hover:underline">View Cash Flows</button>
               </div>
               <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                  <span className="material-icons-outlined text-amber-500 mb-4 text-3xl">folder_shared</span>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-2">Project Database</h3>
                  <p className="text-slate-900 dark:text-white font-bold mb-4">{savedProjects.length} assessments stored in local persistence.</p>
                  <button onClick={() => setActiveTab('documents')} className="text-primary text-xs font-black uppercase tracking-widest hover:underline">Manage Scenarios</button>
               </div>
            </div>
          </div>
        );
      case 'documents':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
            <div className="space-y-2">
              <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Project Database</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">Local Persistence Explorer</p>
            </div>

            {savedProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center space-y-6 bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="material-icons-outlined text-4xl text-primary">storage</span>
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Database is Empty</h2>
                  <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">You haven't saved any assessments yet. Run a projection and click 'Save to Database' to see it here.</p>
                </div>
                <button onClick={() => setActiveTab('dashboard')} className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:brightness-110 transition-all">Start New Assessment</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedProjects.map((project) => (
                  <div key={project.id} className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm p-6 flex flex-col justify-between group transition-all hover:shadow-xl hover:-translate-y-1">
                    <div className="flex justify-between items-start mb-6">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{project.id}</span>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{project.name}</h3>
                        <p className="text-xs text-slate-500 font-medium">{new Date(project.timestamp).toLocaleDateString()} at {new Date(project.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <button 
                        onClick={() => handleDeleteProject(project.id)}
                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full transition-all"
                      >
                        <span className="material-icons-outlined text-sm">delete</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                       <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                         <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">CAPACITY</span>
                         <span className="text-sm font-black text-slate-900 dark:text-white">{project.assumptions.systemCapacity} kW</span>
                       </div>
                       <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                         <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">INVESTMENT</span>
                         <span className="text-sm font-black text-slate-900 dark:text-white">${formatCurrency(project.assumptions.stationCost)}</span>
                       </div>
                    </div>

                    <button 
                      onClick={() => handleLoadProject(project)}
                      className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-icons-outlined text-sm">input</span>
                      Load Assessment
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Simple Toast Notification */}
        {notification && (
          <div className="fixed top-20 right-8 z-[100] animate-in fade-in slide-in-from-right-4">
             <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/10 backdrop-blur-md">
                <span className="material-icons-outlined text-emerald-400">check_circle</span>
                <span className="text-sm font-bold">{notification}</span>
             </div>
          </div>
        )}

        <nav className="border-b border-slate-100 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md sticky top-0 z-40 h-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-full items-center">
            <div className="flex items-center gap-2 md:hidden">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="material-icons-outlined text-white text-lg">wb_sunny</span>
              </div>
              <span className="font-display font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">NurSun</span>
            </div>
            
            <div className="flex-1 md:flex-none"></div>

            <div className="flex items-center gap-4">
              <button type="button" className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <span className="material-icons-outlined text-slate-400">notifications</span>
                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-950"></span>
              </button>
              <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800"></div>
              <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setIsPanelOpen(true)}>
                <div className="text-right hidden sm:block">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-primary transition-colors">{assumptions.managerRole}</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{assumptions.managerName}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 overflow-hidden">
                   <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(assumptions.managerName)}&background=1E3A8A&color=fff`} alt="Avatar" />
                </div>
              </div>
            </div>
          </div>
        </nav>

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 overflow-y-auto">
          {renderContent()}
        </main>

        <footer className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-slate-100 dark:border-slate-800 opacity-50">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
             <div className="flex items-center gap-2">
               <span className="material-icons-outlined text-sm">copyright</span>
               <span className="text-xs font-bold uppercase tracking-widest">NurSun Energy 2024</span>
             </div>
             <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest">
               <a href="#" className="hover:text-primary transition-colors">Methodology</a>
               <a href="#" className="hover:text-primary transition-colors">Privacy</a>
               <a href="#" className="hover:text-primary transition-colors">Support</a>
             </div>
          </div>
        </footer>
      </div>

      <AssumptionsPanel 
        isOpen={isPanelOpen} 
        onClose={() => setIsPanelOpen(false)} 
        assumptions={assumptions} 
        onChange={setAssumptions} 
      />

      <PdfPreview 
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        assumptions={assumptions}
        projections={projections}
        paybackPeriod={paybackPeriod}
        totalRoi={totalRoi}
      />
    </div>
  );
};

export default App;
