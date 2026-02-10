
import React, { useState, useRef } from 'react';
import { ProjectAssumptions, YearProjection } from '../types';

interface PdfPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  assumptions: ProjectAssumptions;
  projections: YearProjection[];
  paybackPeriod: number;
  totalRoi: number;
}

const ReportFooter: React.FC<{ page: number; total: number }> = ({ page, total }) => (
  <div className="absolute bottom-[4mm] left-[10mm] right-[10mm] flex justify-between items-center border-t border-slate-200 pt-3 text-slate-400">
    <div className="text-[7px] font-bold uppercase tracking-widest">
      Confidential Financial Report — NurSun Energy — {new Date().getFullYear()}
    </div>
    <div className="text-[8px] font-bold">
      Page {page} of {total}
    </div>
  </div>
);

const ReportHeader: React.FC = () => (
  <div className="flex justify-between items-end border-b-2 border-primary pb-3 mb-4">
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
        <span className="material-icons-outlined text-white text-[14px]">wb_sunny</span>
      </div>
      <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">NurSun Energy</h1>
    </div>
    <div className="text-right">
      <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest leading-tight">DOCUMENT REF</p>
      <p className="text-[11px] font-bold text-slate-900 uppercase">NSE-PRJ-{Math.floor(Date.now() / 1000000)}</p>
    </div>
  </div>
);

const PdfPreview: React.FC<PdfPreviewProps> = ({ isOpen, onClose, assumptions, projections, paybackPeriod, totalRoi }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleDownload = async () => {
    setIsGenerating(true);
    const element = reportRef.current;
    if (!element) return;

    const html2pdf = (window as any).html2pdf;
    if (!html2pdf) {
      alert("PDF library is still loading. Please try again in a few seconds.");
      setIsGenerating(false);
      return;
    }

    const opt = {
      margin: 0,
      filename: `Financial_Proposal_${assumptions.customerName.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true, 
        scrollY: 0,
        allowTaint: false,
        logging: false,
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: 'avoid-all' } 
    };

    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      await html2pdf().set(opt).from(element).save();
    } catch (e) {
      console.error("PDF Export failed:", e);
      alert("Failed to generate PDF.");
    } finally {
      setIsGenerating(false);
    }
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('en-US', { minimumFractionDigits: 0 }).replace(/,/g, ' ');
  };

  const projections10Y = projections.slice(0, 10);
  const maxAbsVal = Math.max(
    assumptions.stationCost,
    ...projections10Y.map(p => Math.abs(p.cumulativeRevenue - assumptions.stationCost))
  );

  const monthlyYieldData = [
    { m: 'Jan', p: 0.04 }, { m: 'Feb', p: 0.05 }, { m: 'Mar', p: 0.08 },
    { m: 'Apr', p: 0.10 }, { m: 'May', p: 0.12 }, { m: 'Jun', p: 0.14 },
    { m: 'Jul', p: 0.15 }, { m: 'Aug', p: 0.13 }, { m: 'Sep', p: 0.10 },
    { m: 'Oct', p: 0.06 }, { m: 'Nov', p: 0.04 }, { m: 'Dec', p: 0.03 }
  ];
  const maxMonthYield = assumptions.annualYieldYear1 * 0.15;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-md flex overflow-hidden">
      <div className="w-80 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full shadow-2xl z-20">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <span className="material-icons-outlined text-primary">description</span>
            Proposal View
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400">
            <span className="material-icons-outlined">close</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Refined Spacing</h3>
            <p className="text-[11px] text-slate-500 italic leading-relaxed">
              Row padding for the projection table is now set to 1.2mm for precise layout alignment.
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <button 
            onClick={handleDownload}
            disabled={isGenerating}
            className="w-full py-4 bg-primary text-white rounded-2xl font-black hover:bg-blue-800 transition-all shadow-xl shadow-primary/30 flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="material-icons-outlined">picture_as_pdf</span>
            )}
            {isGenerating ? 'Exporting...' : 'Export Final Proposal'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-200/50 dark:bg-slate-900/80 p-6 custom-scrollbar">
        <div ref={reportRef} className="mx-auto transition-all">
          <div className="shadow-2xl" style={{
            width: '210mm',
            height: '296mm',
            padding: '10mm 12mm 12mm 12mm',
            boxSizing: 'border-box',
            position: 'relative',
            backgroundColor: 'white',
            overflow: 'hidden'
          }}>
            <ReportHeader />
            <div className="space-y-6">
              {/* Proposal Header Block */}
              <section className="bg-slate-950 rounded-lg p-7 text-white flex flex-col justify-center h-32 relative">
                <div className="space-y-1">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400 opacity-90">PROJECT PROPOSAL</h2>
                  <p className="text-3xl font-black tracking-tight leading-none mb-4">{assumptions.systemCapacity} kW Commercial PV System</p>
                  <div className="flex gap-10">
                    <div className="flex items-center gap-2">
                      <span className="material-icons-outlined text-[14px] text-emerald-400">location_on</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider">{assumptions.projectLocation}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-icons-outlined text-[14px] text-emerald-400">person</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider">{assumptions.managerName}</span>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-[9px] font-black uppercase tracking-widest text-primary mb-3">01 / INVESTMENT PERFORMANCE SUMMARY</h3>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    ['TOTAL INVESTMENT', `$${formatCurrency(assumptions.stationCost)}`, 'account_balance_wallet'],
                    ['PAYBACK PERIOD', `${paybackPeriod.toFixed(1)} Yrs`, 'trending_up'],
                    ['YEAR 1 YIELD', `${formatCurrency(assumptions.annualYieldYear1)} kWh`, 'bolt'],
                    ['LIFETIME ROI', `${totalRoi.toFixed(0)}%`, 'pie_chart']
                  ].map(([l, v, icon]) => (
                    <div key={l as string} className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-4">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-primary shadow-sm">
                        <span className="material-icons-outlined text-[14px]">{icon}</span>
                      </div>
                      <div>
                        <p className="text-[7px] font-bold text-slate-400 uppercase tracking-tight leading-none mb-1">{l}</p>
                        <p className="text-[11px] font-black text-slate-900 leading-none">{v}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <div className="grid grid-cols-2 gap-6">
                <section>
                  <h3 className="text-[9px] font-black uppercase tracking-widest text-primary mb-3">02 / PROJECTED 10-YEAR CASH FLOW</h3>
                  <div className="h-[200px] bg-slate-50 border border-slate-100 rounded-xl p-6 flex flex-col relative overflow-hidden">
                     <div className="flex-1 flex items-end justify-between gap-2.5 relative z-10">
                        <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-300 z-0 opacity-50"></div>
                        {projections10Y.map((d, i) => {
                           const netValue = d.cumulativeRevenue - assumptions.stationCost;
                           const height = (Math.abs(netValue) / maxAbsVal) * 92; 
                           const isPositive = netValue >= 0;
                           return (
                             <div key={i} className="flex-1 flex flex-col items-center h-full relative">
                               <div className="flex-1 w-full flex flex-col justify-end relative">
                                  {isPositive && (
                                    <>
                                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                        <span className="text-[7px] font-black text-emerald-600">${(netValue / 1000).toFixed(0)}k</span>
                                      </div>
                                      <div className="w-full bg-emerald-500 rounded-t-[1px]" style={{ height: `${height}%` }} />
                                    </>
                                  )}
                               </div>
                               <div className="flex-1 w-full flex flex-col justify-start relative">
                                  {!isPositive && (
                                    <>
                                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                        <span className="text-[7px] font-black text-rose-400">-${(Math.abs(netValue) / 1000).toFixed(0)}k</span>
                                      </div>
                                      <div className="w-full bg-rose-200 rounded-b-[1px]" style={{ height: `${height}%` }} />
                                    </>
                                  )}
                               </div>
                             </div>
                           );
                        })}
                     </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-[9px] font-black uppercase tracking-widest text-primary mb-3">MONTHLY YIELD (YEAR 1)</h3>
                  <div className="h-[200px] bg-slate-50 border border-slate-100 rounded-xl p-6 flex items-end justify-between gap-2.5 relative overflow-hidden">
                     {monthlyYieldData.map((d, i) => {
                        const yieldValue = assumptions.annualYieldYear1 * d.p;
                        const height = (yieldValue / maxMonthYield) * 88;
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center z-10 h-full">
                            <div className="flex-1 w-full flex flex-col justify-end relative">
                               <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                 <span className="text-[7px] font-black text-blue-800">{(yieldValue / 1000).toFixed(0)}k</span>
                               </div>
                               <div className="w-full rounded-t-[1px] bg-blue-600/70" style={{ height: `${height}%` }} />
                            </div>
                            <span className="text-[7px] font-bold text-slate-400 mt-3 uppercase tracking-tighter">{d.m}</span>
                          </div>
                        );
                     })}
                  </div>
                </section>
              </div>

              {/* SECTION 03 & 04 - Refined Row Spacing (1.2mm) */}
              <div className="grid grid-cols-12 gap-10 items-start">
                <div className="col-span-8">
                  <h3 className="text-[9px] font-black uppercase tracking-widest text-primary mb-3">03 / ANNUAL FINANCIAL PROJECTIONS (25Y)</h3>
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-[8px] font-black uppercase tracking-widest text-slate-500 bg-slate-100/80 border-b border-slate-200">
                          <th className="py-2.5 px-5">YEAR</th>
                          <th className="py-2.5 px-3 text-right">TARIFF</th>
                          <th className="py-2.5 px-3 text-right">YIELD</th>
                          <th className="py-2.5 px-3 text-right">REV</th>
                          <th className="py-2.5 px-5 text-right">CUMULATIVE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projections.map((row) => (
                          <tr key={row.year} className={`border-b border-slate-100 last:border-0 ${row.isBreakEven ? 'bg-emerald-50/50 border-y border-emerald-500/30' : ''}`}>
                            <td className="py-[1.2mm] px-5 text-[8px] font-bold text-slate-600 leading-none">
                              {row.year} {row.isBreakEven && <span className="ml-1 text-[4px] bg-emerald-600 text-white px-1.5 py-0.5 rounded-sm uppercase tracking-tighter font-black">BE</span>}
                            </td>
                            <td className="py-[1.2mm] px-3 text-right text-[8px] font-bold text-slate-900 leading-none">{row.tariff.toFixed(2)}</td>
                            <td className="py-[1.2mm] px-3 text-right text-[8px] font-bold text-slate-900 leading-none">{formatCurrency(row.yield)}</td>
                            <td className={`py-[1.2mm] px-3 text-right text-[8px] font-black leading-none ${row.cumulativeRevenue >= assumptions.stationCost ? 'text-emerald-700' : 'text-slate-900'}`}>${formatCurrency(row.revenue)}</td>
                            <td className={`py-[1.2mm] px-5 text-right text-[8px] font-black leading-none ${row.cumulativeRevenue >= assumptions.stationCost ? 'text-emerald-700' : 'text-slate-300'}`}>
                              ${formatCurrency(row.cumulativeRevenue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="col-span-4 flex flex-col justify-between h-full space-y-24">
                  <section>
                    <h3 className="text-[9px] font-black uppercase tracking-widest text-primary mb-4">04 / CORE MODELING</h3>
                    <div className="p-6 border border-slate-200 rounded-xl bg-slate-50 space-y-4">
                      {[
                        ['ESCALATION', `${(assumptions.inflationRate * 100).toFixed(1)}%`],
                        ['TARIFF', `${assumptions.baseTariff} Som`],
                        ['DEGRADATION', `${(assumptions.panelDegradation * 100).toFixed(2)}%`],
                        ['EXCHANGE', `${assumptions.usdSomExchange.toFixed(2)}`],
                        ['LIFETIME', `${assumptions.projectLifetime} YRS`]
                      ].map(([l, v]) => (
                        <div key={l} className="flex justify-between items-center border-b border-slate-200 pb-3 last:border-0 last:pb-0">
                          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tight">{l}</span>
                          <span className="text-[10px] font-black text-slate-900">{v}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="pt-4 mt-auto">
                    <div className="space-y-8">
                      <div className="border-l-4 border-primary pl-6">
                        <h4 className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">AUTHORIZATION</h4>
                        <p className="text-[12px] font-black text-slate-900 uppercase leading-none mb-2">{assumptions.managerName}</p>
                        <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none">{assumptions.managerRole}</p>
                      </div>
                      <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex items-center gap-4">
                         <span className="material-icons-outlined text-primary text-[14px]">verified_user</span>
                         <div>
                            <span className="text-[6px] font-black text-primary uppercase block tracking-wider">DIGITAL AUDIT</span>
                            <p className="text-[5px] text-slate-500 leading-tight">4490BD9A27 - SECURED</p>
                         </div>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>
            <ReportFooter page={1} total={1} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfPreview;
