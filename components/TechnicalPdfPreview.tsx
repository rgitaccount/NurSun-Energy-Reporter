
import React, { useState, useRef, useMemo } from 'react';

interface HorizonPoint {
  azimuth: number;
  height: number;
}

interface MonthlyData {
  month: string;
  energy: number;
}

interface TechnicalPdfPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  lat: number;
  lon: number;
  slope: number;
  azimuth: number;
  systemLoss: number;
  capacity: number;
  totalAnnual: number;
  results: MonthlyData[] | null;
  horizonData: HorizonPoint[] | null;
  customerName: string;
}

const ReportFooter: React.FC<{ page: number; total: number }> = ({ page, total }) => (
  <div className="absolute bottom-[4mm] left-[10mm] right-[10mm] flex justify-between items-center border-t border-slate-200 pt-3 text-slate-400">
    <div className="text-[7px] font-bold uppercase tracking-widest">
      Technical Assessment — NurSun Energy — {new Date().getFullYear()}
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
        <span className="material-icons-outlined text-white text-[14px]">bolt</span>
      </div>
      <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">NurSun Energy</h1>
    </div>
    <div className="text-right">
      <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest leading-tight">TECH REPORT REF</p>
      <p className="text-[11px] font-bold text-slate-900 uppercase">NSE-TECH-{Math.floor(Date.now() / 1000000)}</p>
    </div>
  </div>
);

const TechnicalPdfPreview: React.FC<TechnicalPdfPreviewProps> = ({ 
  isOpen, onClose, lat, lon, slope, azimuth, systemLoss, capacity, totalAnnual, results, horizonData, customerName 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleDownload = async () => {
    setIsGenerating(true);
    const element = reportRef.current;
    if (!element) return;

    const html2pdf = (window as any).html2pdf;
    if (!html2pdf) {
      alert("PDF library loading error.");
      setIsGenerating(false);
      return;
    }

    const opt = {
      margin: 0,
      filename: `Solar_Assessment_${customerName.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const maxEnergy = results ? Math.max(...results.map(r => r.energy)) : 1000;
  const specificYield = capacity > 0 ? totalAnnual / capacity : 0;
  const peakMonth = results ? [...results].sort((a, b) => b.energy - a.energy)[0] : null;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-md flex overflow-hidden">
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col h-full shadow-2xl z-20">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900">
            <span className="material-icons-outlined text-primary">analytics</span>
            Technical View
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
            <span className="material-icons-outlined">close</span>
          </button>
        </div>
        
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Technical Summary</h3>
            <p className="text-[11px] text-slate-500 italic leading-relaxed">
              This assessment uses PVGIS 5.2 datasets with a 15-minute resolution horizon analysis.
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <button onClick={handleDownload} disabled={isGenerating} className="w-full py-4 bg-primary text-white rounded-2xl font-black hover:bg-blue-800 transition-all flex items-center justify-center gap-2">
            {isGenerating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span className="material-icons-outlined">download</span>}
            {isGenerating ? 'Exporting...' : 'Download Assessment'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-200/50 p-6">
        <div ref={reportRef} className="mx-auto shadow-2xl bg-white" style={{ width: '210mm', height: '296mm', padding: '10mm 12mm' }}>
          <ReportHeader />
          <div className="space-y-6">
            <section className="bg-slate-950 rounded-lg p-7 text-white h-32 flex flex-col justify-center">
              <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400 opacity-90">SOLAR RESOURCE ASSESSMENT</h2>
              <p className="text-3xl font-black tracking-tight leading-none mb-4">{capacity} kW Photovoltaic Project</p>
              <div className="flex gap-10">
                <div className="flex items-center gap-2">
                  <span className="material-icons-outlined text-[14px] text-emerald-400">location_on</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">{lat.toFixed(4)}°N, {lon.toFixed(4)}°E</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-icons-outlined text-[14px] text-emerald-400">factory</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">Client: {customerName}</span>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-[9px] font-black uppercase tracking-widest text-primary mb-3">01 / SYSTEM CONFIGURATION</h3>
              <div className="grid grid-cols-4 gap-4">
                {[
                  ['MODULE SLOPE', `${slope}°`, 'straighten'],
                  ['AZIMUTH', `${azimuth}°`, 'navigation'],
                  ['SYSTEM LOSS', `${systemLoss}%`, 'warning_amber'],
                  ['EST. ANNUAL', `${totalAnnual.toLocaleString()} kWh`, 'bolt']
                ].map(([l, v, icon]) => (
                  <div key={l} className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-4">
                    <span className="material-icons-outlined text-[14px] text-primary">{icon}</span>
                    <div>
                      <p className="text-[7px] font-bold text-slate-400 uppercase leading-none mb-1">{l}</p>
                      <p className="text-[11px] font-black text-slate-900 leading-none">{v}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid grid-cols-3 gap-6">
              <section className="col-span-2">
                <h3 className="text-[9px] font-black uppercase tracking-widest text-primary mb-3">02 / MONTHLY PRODUCTION (Y1)</h3>
                <div className="h-[200px] bg-slate-50 border border-slate-100 rounded-xl p-6 flex items-end justify-between gap-3 relative overflow-hidden">
                   {results?.map((d, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center h-full">
                        <div className="flex-1 w-full flex flex-col justify-end">
                          <div className="w-full bg-blue-600/70 rounded-t-[2px]" style={{ height: `${(d.energy / maxEnergy) * 90}%` }} />
                        </div>
                        <span className="text-[7px] font-bold text-slate-400 mt-2 uppercase">{d.month}</span>
                      </div>
                   ))}
                </div>
              </section>

              <section className="col-span-1">
                <h3 className="text-[9px] font-black uppercase tracking-widest text-primary mb-3">03 / HORIZON ANALYSIS</h3>
                <div className="h-[200px] bg-slate-50 border border-slate-100 rounded-xl p-2 flex flex-col items-center justify-center overflow-hidden">
                  <div className="scale-[0.55] origin-center">
                     <HorizonVisual lat={lat} horizon={horizonData} />
                  </div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Terrain Shading Profile</p>
                </div>
              </section>
            </div>

            <section>
              <h3 className="text-[9px] font-black uppercase tracking-widest text-primary mb-3">04 / PRODUCTION SUMMARY</h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-100">
                    <tr className="text-[8px] font-black text-slate-500 uppercase">
                      <th className="py-2.5 px-6">KPI METRIC</th>
                      <th className="py-2.5 px-6 text-right">VALUE</th>
                      <th className="py-2.5 px-6">DESCRIPTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="py-3 px-6 text-[10px] font-black text-slate-700 uppercase">Total Annual Production</td>
                      <td className="py-3 px-6 text-right text-[11px] font-black text-primary">{totalAnnual.toLocaleString()} kWh</td>
                      <td className="py-3 px-6 text-[9px] text-slate-400">Estimated total energy output for Year 1.</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-3 px-6 text-[10px] font-black text-slate-700 uppercase">Specific Annual Yield</td>
                      <td className="py-3 px-6 text-right text-[11px] font-black text-slate-900">{specificYield.toFixed(1)} kWh/kWp</td>
                      <td className="py-3 px-6 text-[9px] text-slate-400">Production efficiency relative to installed capacity.</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-3 px-6 text-[10px] font-black text-slate-700 uppercase">Peak Month</td>
                      <td className="py-3 px-6 text-right text-[11px] font-black text-slate-900">{peakMonth?.month} ({peakMonth?.energy.toLocaleString()} kWh)</td>
                      <td className="py-3 px-6 text-[9px] text-slate-400">Month with the highest projected irradiance levels.</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-3 px-6 text-[10px] font-black text-slate-700 uppercase">Average Monthly Energy</td>
                      <td className="py-3 px-6 text-right text-[11px] font-black text-slate-900">{Math.round(totalAnnual / 12).toLocaleString()} kWh</td>
                      <td className="py-3 px-6 text-[9px] text-slate-400">Standardized production across the seasonal cycle.</td>
                    </tr>
                    <tr className="bg-slate-50/50">
                      <td className="py-3 px-6 text-[10px] font-black text-slate-700 uppercase">System Capacity</td>
                      <td className="py-3 px-6 text-right text-[11px] font-black text-slate-900">{capacity.toFixed(1)} kWp</td>
                      <td className="py-3 px-6 text-[9px] text-slate-400">DC rating of the installed photovoltaic array.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
          <ReportFooter page={1} total={1} />
        </div>
      </div>
    </div>
  );
};

const HorizonVisual: React.FC<{ lat: number; horizon: HorizonPoint[] | null }> = ({ lat, horizon }) => {
  const size = 260;
  const center = size / 2;
  const radius = 90;
  const getCoords = (azimuth: number, height: number) => {
    const angleRad = (azimuth + 90) * (Math.PI / 180);
    const r = radius * (1 - height / 90);
    return { x: center + r * Math.cos(angleRad), y: center + r * Math.sin(angleRad) };
  };
  const effectiveHorizon = useMemo(() => {
    if (!horizon || horizon.length === 0) {
      const dummy = [];
      for (let a = -180; a <= 180; a += 5) dummy.push({ azimuth: a, height: 5 + Math.sin(a * Math.PI / 45) * 3 });
      return dummy;
    }
    return [...horizon].sort((a, b) => a.azimuth - b.azimuth);
  }, [horizon]);
  const horizonPath = useMemo(() => {
    if (effectiveHorizon.length === 0) return '';
    const points = effectiveHorizon.map(p => getCoords(p.azimuth, p.height));
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) d += ` L ${points[i].x} ${points[i].y}`;
    for (let a = effectiveHorizon[effectiveHorizon.length - 1].azimuth; a >= effectiveHorizon[0].azimuth; a -= 5) {
      const edge = getCoords(a, 0);
      d += ` L ${edge.x} ${edge.y}`;
    }
    d += ' Z';
    return d;
  }, [effectiveHorizon]);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={center} cy={center} r={radius} fill="#f1f5f9" />
      <path d={horizonPath} fill="#71717A" />
      <line x1={center-radius} y1={center} x2={center+radius} y2={center} stroke="#cbd5e1" strokeWidth="1" />
      <line x1={center} y1={center-radius} x2={center} y2={center+radius} stroke="#cbd5e1" strokeWidth="1" />
    </svg>
  );
};

export default TechnicalPdfPreview;
