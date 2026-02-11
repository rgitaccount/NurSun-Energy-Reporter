import React, { useState, useEffect, useRef, useMemo } from 'react';
import TechnicalPdfPreview from './TechnicalPdfPreview';

interface MonthlyData {
  month: string;
  energy: number;
}

interface HorizonPoint {
  azimuth: number;
  height: number;
}

interface PvPerformanceProps {
  onApplyYield?: (yieldValue: number) => void;
  initialCapacity?: number;
  customerName?: string;
}

type MapStyle = 'satellite' | 'osm';

const MAP_LAYERS: Record<MapStyle, { url: string; attr: string }> = {
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attr: 'Tiles &copy; Esri'
  },
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attr: '&copy; OSM'
  }
};

const HorizonChart: React.FC<{ lat: number; horizon: HorizonPoint[] | null; isReal: boolean }> = ({ lat, horizon, isReal }) => {
  const size = 260;
  const center = size / 2;
  const radius = 90;

  const getCoords = (azimuth: number, height: number) => {
    // Azimuth: 0 South, -90 East, 90 West, 180 North (PVGIS convention)
    const angleRad = (azimuth + 90) * (Math.PI / 180);
    const r = radius * (1 - height / 90);
    return {
      x: center + r * Math.cos(angleRad),
      y: center + r * Math.sin(angleRad)
    };
  };

  const effectiveHorizon = useMemo(() => {
    if (!horizon || horizon.length === 0) {
      const dummy = [];
      for (let a = -180; a <= 180; a += 5) {
        const h = 8 + Math.sin(a * Math.PI / 45) * 4 + Math.cos(a * Math.PI / 90) * 3;
        dummy.push({ azimuth: a, height: Math.max(0, h) });
      }
      return dummy;
    }
    return [...horizon].sort((a, b) => a.azimuth - b.azimuth);
  }, [horizon]);

  const horizonPath = useMemo(() => {
    if (effectiveHorizon.length === 0) return '';
    const points = effectiveHorizon.map(p => getCoords(p.azimuth, p.height));
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) d += ` L ${points[i].x} ${points[i].y}`;
    
    // Trace back along the base (height 0) to close the shape
    for (let i = effectiveHorizon.length - 1; i >= 0; i--) {
      const edge = getCoords(effectiveHorizon[i].azimuth, 0);
      d += ` L ${edge.x} ${edge.y}`;
    }
    d += ' Z';
    return d;
  }, [effectiveHorizon]);

  return (
    <div className="flex flex-col items-center w-full animate-in fade-in duration-700">
      <div className="flex flex-col items-center mb-6 text-center">
        <h3 className="text-[10px] font-black uppercase text-slate-900 dark:text-slate-100 tracking-[0.2em] mb-2">Outline of horizon</h3>
        <span className={`px-3 py-1.5 rounded-full text-[7px] font-black tracking-widest uppercase transition-all duration-500 shadow-sm ${isReal ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
          {isReal ? 'Verified: JRC PrintHorizon Data' : 'Estimated Demo Profile'}
        </span>
      </div>
      <div className="relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
          <circle cx={center} cy={center} r={radius} fill="#E2E8F0" className="dark:fill-slate-800" />
          {[30, 60].map(deg => (
            <circle key={deg} cx={center} cy={center} r={radius * (1 - deg / 90)} fill="none" stroke="#CBD5E1" strokeWidth="0.5" className="dark:stroke-slate-700" />
          ))}
          
          <line x1={center - radius} y1={center} x2={center + radius} y2={center} stroke="#CBD5E1" strokeWidth="0.5" className="dark:stroke-slate-700 opacity-50" />
          <line x1={center} y1={center - radius} x2={center} y2={center + radius} stroke="#CBD5E1" strokeWidth="0.5" className="dark:stroke-slate-700 opacity-50" />
          
          <path d={horizonPath} fill="#71717A" stroke="#52525B" strokeWidth="0.5" />
          
          <text x={center} y={center - radius - 12} textAnchor="middle" className="text-[10px] font-black fill-slate-400">N</text>
          <text x={center + radius + 12} y={center + 4} textAnchor="start" className="text-[10px] font-black fill-slate-400">E</text>
          <text x={center} y={center + radius + 18} textAnchor="middle" className="text-[10px] font-black fill-slate-400">S</text>
          <text x={center - radius - 12} y={center + 4} textAnchor="end" className="text-[10px] font-black fill-slate-400">W</text>
        </svg>
      </div>
    </div>
  );
};

const PvPerformance: React.FC<PvPerformanceProps> = ({ onApplyYield, initialCapacity = 1000, customerName = "Standard Client" }) => {
  const [lat, setLat] = useState<number>(41.4228); 
  const [lon, setLon] = useState<number>(75.9650);
  const [numPanels, setNumPanels] = useState<number>(Math.round((initialCapacity * 1000) / 550));
  const [panelWattage, setPanelWattage] = useState<number>(550);
  const [azimuth, setAzimuth] = useState<number>(0); 
  const [slope, setSlope] = useState<number>(35);
  const [systemLoss, setSystemLoss] = useState<number>(14);
  const [loading, setLoading] = useState<boolean>(false);
  const [applied, setApplied] = useState<boolean>(false);
  const [isDataReal, setIsDataReal] = useState<boolean>(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [totalAnnual, setTotalAnnual] = useState<number>(85312); 
  const [results, setResults] = useState<MonthlyData[] | null>([
    { month: 'JAN', energy: 3840 }, { month: 'FEB', energy: 4920 }, { month: 'MAR', energy: 7100 },
    { month: 'APR', energy: 8200 }, { month: 'MAY', energy: 9400 }, { month: 'JUN', energy: 10200 },
    { month: 'JUL', energy: 9800 }, { month: 'AUG', energy: 8900 }, { month: 'SEP', energy: 7600 },
    { month: 'OCT', energy: 6200 }, { month: 'NOV', energy: 4900 }, { month: 'DEC', energy: 4252 }
  ]);
  const [horizonData, setHorizonData] = useState<HorizonPoint[] | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (typeof (window as any).L !== 'undefined' && !mapRef.current && mapContainerRef.current) {
      const L = (window as any).L;
      mapRef.current = L.map(mapContainerRef.current, { zoomControl: false }).setView([lat, lon], 12);
      L.tileLayer(MAP_LAYERS.satellite.url, { attribution: MAP_LAYERS.satellite.attr }).addTo(mapRef.current);
      markerRef.current = L.marker([lat, lon], { draggable: true }).addTo(mapRef.current);
      markerRef.current.on('dragend', (e: any) => {
        const { lat, lng } = e.target.getLatLng();
        setLat(parseFloat(lat.toFixed(4)));
        setLon(parseFloat(lng.toFixed(4)));
        setIsDataReal(false);
      });
      setTimeout(() => mapRef.current?.invalidateSize(), 500);
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat: nLat, lon: nLon } = data[0];
        const newLat = parseFloat(nLat);
        const newLon = parseFloat(nLon);
        setLat(newLat);
        setLon(newLon);
        mapRef.current?.setView([newLat, newLon], 14);
        markerRef.current?.setLatLng([newLat, newLon]);
        setIsDataReal(false);
      }
    } catch (err) { console.error("Search failed", err); }
  };

  const fetchPvGisData = async () => {
    setLoading(true);
    const systemSize = (numPanels * panelWattage) / 1000; 
    const pvgisUrl = `https://re.jrc.ec.europa.eu/api/v5_2/PVcalc?lat=${lat}&lon=${lon}&peakpower=${systemSize}&loss=${systemLoss}&angle=${slope}&aspect=${azimuth}&outputformat=json`;
    const horizonUrl = `https://re.jrc.ec.europa.eu/api/printhorizon?lat=${lat}&lon=${lon}`;
    
    try {
      const [resPV, resH] = await Promise.all([
        fetch(`https://corsproxy.io/?${encodeURIComponent(pvgisUrl)}`),
        fetch(`https://corsproxy.io/?${encodeURIComponent(horizonUrl)}`)
      ]);
      const pvData = await resPV.json();
      const hText = await resH.text();

      if (pvData?.outputs?.monthly?.fixed) {
        const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        setResults(pvData.outputs.monthly.fixed.map((item: any, index: number) => ({
          month: monthNames[index],
          energy: Math.round(item.E_m || 0)
        })));
        setTotalAnnual(Math.round(pvData.outputs.totals.fixed.E_y || 0));
      }

      // Enhanced Robust horizon data parser
      const lines = hText.split(/\r?\n/).filter(l => l.trim().length > 0);
      const parsedHorizon: HorizonPoint[] = [];
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 2) {
          const az = parseFloat(parts[0]);
          const ht = parseFloat(parts[1]);
          if (!isNaN(az) && !isNaN(ht)) {
            parsedHorizon.push({ azimuth: az, height: ht });
          }
        }
      }
      
      setHorizonData(parsedHorizon.length > 0 ? parsedHorizon : null);
      setIsDataReal(parsedHorizon.length > 0);
    } catch (e) { 
      console.error("Simulation failed", e); 
      setIsDataReal(false);
    }
    setLoading(false);
  };

  const handleApply = () => {
    if (onApplyYield) {
      onApplyYield(totalAnnual);
      setApplied(true);
      setTimeout(() => setApplied(false), 2000);
    }
  };

  const maxMonthEnergy = results ? Math.max(...results.map(r => r.energy)) : 1000;

  return (
    <div className="p-8 space-y-8 h-full overflow-y-auto custom-scrollbar bg-background-light dark:bg-background-dark animate-in fade-in duration-500">
      
      {/* Simulation Controls Left & Map Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left: Simulation Config */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm p-10 flex flex-col space-y-8">
           <div className="flex justify-between items-center mb-2">
             <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Project Parameters</h2>
             <button onClick={() => setIsPreviewOpen(true)} className="p-2 text-slate-400 hover:text-primary transition-colors">
               <span className="material-icons-outlined">picture_as_pdf</span>
             </button>
           </div>

           <section className="space-y-4">
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Geolocation</h3>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Latitude</label>
                   <input type="number" step="0.0001" value={lat} onChange={e => { setLat(parseFloat(e.target.value)); setIsDataReal(false); }} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 text-xs font-bold" />
                 </div>
                 <div>
                   <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Longitude</label>
                   <input type="number" step="0.0001" value={lon} onChange={e => { setLon(parseFloat(e.target.value)); setIsDataReal(false); }} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 text-xs font-bold" />
                 </div>
              </div>
           </section>

           <section className="space-y-4">
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Geometry & System</h3>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Azimuth (°)</label>
                   <input type="number" value={azimuth} onChange={e => setAzimuth(parseInt(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 text-xs font-bold" />
                 </div>
                 <div>
                   <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Slope (°)</label>
                   <input type="number" value={slope} onChange={e => setSlope(parseInt(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 text-xs font-bold" />
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">System Loss (%)</label>
                  <input type="number" value={systemLoss} onChange={e => setSystemLoss(parseInt(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 text-xs font-bold" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Panel (Wp)</label>
                  <input type="number" value={panelWattage} onChange={e => setPanelWattage(parseInt(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 text-xs font-bold" />
                </div>
              </div>
           </section>

           <div className="pt-6 border-t border-slate-50 dark:border-slate-800 mt-auto">
              <button 
                onClick={fetchPvGisData} disabled={loading}
                className="w-full py-4 bg-[#1E3A8A] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.25em] shadow-2xl flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all"
              >
                {loading ? <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <span className="material-icons-outlined text-sm">bolt</span>}
                {loading ? 'SIMULATING...' : 'GENERATE MODEL'}
              </button>
           </div>
        </div>

        {/* Right: Map Container */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden p-2 relative flex flex-col group min-h-[450px]">
          <div ref={mapContainerRef} className="flex-1 w-full bg-slate-50 dark:bg-slate-950 rounded-[2.2rem] overflow-hidden z-0"></div>
          
          <div className="absolute top-8 left-8 z-[1000] w-72">
            <form onSubmit={handleSearch} className="relative">
              <input 
                type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search coordinates or city..." 
                className="w-full pl-10 pr-4 py-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-none rounded-xl text-xs font-bold shadow-2xl focus:ring-2 focus:ring-primary/20 text-slate-900 dark:text-white" 
              />
              <span className="material-icons-outlined absolute left-3 top-3 text-slate-400 text-sm">search</span>
            </form>
          </div>

          <div className="absolute top-8 right-8 z-[1000] flex gap-2">
            <div className="bg-slate-900/80 backdrop-blur-md text-white px-5 py-2.5 rounded-xl text-[10px] font-black tracking-widest flex items-center gap-4 shadow-2xl">
              <span>{lat.toFixed(4)}°N</span>
              <span className="opacity-20">|</span>
              <span>{lon.toFixed(4)}°E</span>
            </div>
          </div>
        </div>
      </div>

      {/* Yield & Shading Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Yield Visualizer */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm p-12 flex flex-col items-start min-h-[520px]">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Monthly Yield Distribution</h2>
          <div className="flex items-baseline gap-2 mt-2 mb-16">
            <span className="text-5xl font-black text-[#1E40AF] tracking-tighter">{totalAnnual.toLocaleString().replace(/,/g, ' ')}</span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">KWH / YEAR 1</span>
          </div>

          <div className="w-full h-[300px] flex items-end justify-between gap-3 px-4 mt-4 relative border-2 border-dashed border-blue-500/10 rounded-[2rem] p-12 bg-slate-50/10 dark:bg-slate-800/10">
            {(results || Array(12).fill(null)).map((r, i) => {
              const energy = r ? r.energy : 0;
              const h = results ? (energy / maxMonthEnergy) * 100 : 0;
              return (
                <div key={i} className="flex-1 h-full flex flex-col items-center group relative">
                  <div className="absolute top-0 -translate-y-8 z-20">
                    <span className="text-[#1E40AF] text-[8px] font-black whitespace-nowrap opacity-60 group-hover:opacity-100 transition-opacity">
                      {energy.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-full flex flex-col justify-end">
                    <div 
                      className="w-full bg-[#3B82F6] rounded-t-lg transition-all duration-700 hover:bg-blue-600 shadow-sm relative cursor-pointer"
                      style={{ height: `${h}%` }}
                    >
                      <div className="absolute inset-x-0 top-0 h-1 bg-white/20"></div>
                    </div>
                  </div>
                  <span className="text-[9px] font-black text-slate-400 mt-5 uppercase">{r?.month}</span>
                </div>
              );
            })}
          </div>
          
          <button onClick={handleApply} className="mt-12 w-full py-6 bg-[#F1F5F9] dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-primary hover:text-white transition-all shadow-sm">
            {applied ? 'MODEL SYNCED' : 'APPLY YIELD TO FINANCIAL PROJECTIONS'}
          </button>
        </div>

        {/* Terrain Shading Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm p-10 flex flex-col items-center min-h-[520px]">
             <div className="w-full flex justify-between items-start mb-12">
               <div>
                 <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Terrain Shading</h2>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Local Horizon Profile</p>
               </div>
             </div>
             <div className="flex-1 w-full flex items-center justify-center">
               <HorizonChart lat={lat} horizon={horizonData} isReal={isDataReal} />
             </div>
          </div>

          <div className="bg-[#020617] p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl">
             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-[60px] -mr-16 -mt-16"></div>
             <p className="text-[10px] font-bold leading-relaxed opacity-50 uppercase tracking-widest mb-3">Modeling Note</p>
             <p className="text-[11px] font-medium leading-relaxed opacity-80">
               Technical simulations utilize PVGIS 5.2 datasets with topographic shading analysis. Models account for historical irradiance curves and spectral losses.
             </p>
          </div>
        </div>
      </div>

      <TechnicalPdfPreview 
        isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)}
        lat={lat} lon={lon} slope={slope} azimuth={azimuth} systemLoss={systemLoss}
        capacity={(numPanels * panelWattage) / 1000} totalAnnual={totalAnnual}
        results={results} horizonData={horizonData} customerName={customerName}
      />
    </div>
  );
};

export default PvPerformance;