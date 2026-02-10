
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

type MapStyle = 'light' | 'satellite' | 'dark' | 'osm';

const MAP_LAYERS: Record<MapStyle, { url: string; attr: string; label: string; icon: string }> = {
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attr: 'Tiles &copy; Esri',
    label: 'Satellite',
    icon: 'layers'
  },
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attr: '&copy; OSM',
    label: 'Standard',
    icon: 'map'
  },
  light: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attr: '&copy; CARTO',
    label: 'Light',
    icon: 'light_mode'
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attr: '&copy; CARTO',
    label: 'Dark',
    icon: 'dark_mode'
  }
};

/**
 * Polar Chart for Horizon and Sun Paths matching the professional reference
 */
const HorizonChart: React.FC<{ lat: number; horizon: HorizonPoint[] | null; isReal: boolean }> = ({ lat, horizon, isReal }) => {
  const size = 260;
  const center = size / 2;
  const radius = 90;

  const getCoords = (azimuth: number, height: number) => {
    // PVGIS: 0 South, -90 East, 90 West, 180 North
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
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`;
    }
    for (let a = effectiveHorizon[effectiveHorizon.length - 1].azimuth; a >= effectiveHorizon[0].azimuth; a -= 5) {
      const edge = getCoords(a, 0);
      d += ` L ${edge.x} ${edge.y}`;
    }
    d += ' Z';
    return d;
  }, [effectiveHorizon]);

  const getSunPath = (declination: number) => {
    const points = [];
    const latRad = lat * (Math.PI / 180);
    const decRad = declination * (Math.PI / 180);
    for (let hourAngle = -180; hourAngle <= 180; hourAngle += 2) {
      const hRad = hourAngle * (Math.PI / 180);
      const sinAlt = Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(hRad);
      const altitude = Math.asin(sinAlt);
      if (altitude < 0) continue;
      const cosAz = (Math.sin(decRad) - Math.sin(altitude) * Math.sin(latRad)) / (Math.cos(altitude) * Math.cos(latRad));
      let azimuth = Math.acos(Math.max(-1, Math.min(1, cosAz))) * (180 / Math.PI);
      if (hourAngle < 0) azimuth = -azimuth;
      points.push(getCoords(azimuth, altitude * (180 / Math.PI)));
    }
    if (points.length < 2) return '';
    return `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
  };

  const junePath = getSunPath(23.45);
  const decPath = getSunPath(-23.45);

  return (
    <div className="flex flex-col items-center w-full animate-in fade-in duration-700">
      <div className="flex flex-col items-center mb-4 text-center">
        <h3 className="text-[10px] font-black uppercase text-slate-900 dark:text-slate-100 tracking-[0.2em] mb-1.5">Outline of horizon</h3>
        <span className={`px-2.5 py-1 rounded-full text-[7px] font-black tracking-widest uppercase transition-all duration-500 shadow-sm ${isReal ? 'bg-emerald-500 text-white' : 'bg-[#F1F5F9] text-slate-400'}`}>
          {isReal ? 'Verified: JRC PrintHorizon Data' : 'Estimated Demo Profile'}
        </span>
      </div>
      
      <div className="relative mt-2 scale-90 sm:scale-100">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
          <circle cx={center} cy={center} r={radius} fill="#E2E8F0" className="dark:fill-slate-800" />
          {[30, 60].map(deg => (
            <circle key={deg} cx={center} cy={center} r={radius * (1 - deg / 90)} fill="none" stroke="#CBD5E1" strokeWidth="0.5" className="dark:stroke-slate-700" />
          ))}
          
          <line x1={center - radius} y1={center} x2={center + radius} y2={center} stroke="#CBD5E1" strokeWidth="0.5" className="dark:stroke-slate-700" />
          <line x1={center} y1={center - radius} x2={center} y2={center + radius} stroke="#CBD5E1" strokeWidth="0.5" className="dark:stroke-slate-700" />
          
          <text x={center} y={center - radius - 10} textAnchor="middle" className="text-[9px] font-bold fill-slate-400">N</text>
          <text x={center + radius + 10} y={center + 3} textAnchor="start" className="text-[9px] font-bold fill-slate-400">E</text>
          <text x={center} y={center + radius + 18} textAnchor="middle" className="text-[9px] font-bold fill-slate-400">S</text>
          <text x={center - radius - 10} y={center + 3} textAnchor="end" className="text-[9px] font-bold fill-slate-400">W</text>
          
          <text x={center + radius * 0.7} y={center - radius * 0.7} textAnchor="middle" className="text-[7px] font-bold fill-slate-300">NE</text>
          <text x={center - radius * 0.7} y={center - radius * 0.7} textAnchor="middle" className="text-[7px] font-bold fill-slate-300">NW</text>
          <text x={center + radius * 0.7} y={center + radius * 0.7 + 5} textAnchor="middle" className="text-[7px] font-bold fill-slate-300">SE</text>
          <text x={center - radius * 0.7} y={center + radius * 0.7 + 5} textAnchor="middle" className="text-[7px] font-bold fill-slate-300">SW</text>

          <text x={center} y={center - radius * (1 - 45/90) + 10} textAnchor="middle" className="text-[7px] font-bold fill-slate-400">45</text>
          <text x={center} y={center + 4} textAnchor="middle" className="text-[7px] font-bold fill-slate-400">90</text>

          <path d={horizonPath} fill="#71717A" />
          <path d={junePath} fill="none" stroke="#18181B" strokeWidth="1" strokeDasharray="3 3" />
          <path d={decPath} fill="none" stroke="#18181B" strokeWidth="1" strokeDasharray="1 1" />
        </svg>
      </div>
      
      <div className="mt-8 space-y-2 w-full max-w-[180px]">
        <div className="flex items-center gap-3">
          <div className="w-3.5 h-3.5 bg-zinc-500 rounded-sm"></div>
          <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300">Horizon height</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3.5 border-t border-zinc-900 border-dashed"></div>
          <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300">Sun height, June</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3.5 border-t border-zinc-900 border-dotted"></div>
          <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300">Sun height, December</span>
        </div>
      </div>
    </div>
  );
};

const HorizonDataTable: React.FC<{ horizon: HorizonPoint[] | null; onGenerate: () => void; isReal: boolean }> = ({ horizon, onGenerate, isReal }) => {
  if (!horizon || horizon.length === 0) return (
    <div className="w-full flex flex-col items-center justify-center py-12 px-6">
      <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
        <span className="material-icons-outlined text-slate-300">query_stats</span>
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Simulation Required</p>
      <button onClick={onGenerate} className="text-[10px] font-bold text-primary uppercase border border-slate-200 rounded-lg px-4 py-2 hover:bg-slate-50 transition-colors">Run Analysis</button>
    </div>
  );
  
  return (
    <div className="w-full flex flex-col h-full overflow-hidden animate-in fade-in duration-300">
      <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white flex flex-col h-full max-h-[340px]">
        <div className="grid grid-cols-2 bg-slate-50 border-b border-slate-100">
           <div className="p-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Azimuth (°)</div>
           <div className="p-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Height (°)</div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <table className="w-full">
            <tbody className="divide-y divide-slate-50">
              {horizon.map((p, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-3 text-[10px] font-bold text-slate-500">{p.azimuth.toFixed(1)}°</td>
                  <td className="p-3 text-[10px] font-black text-slate-900 text-right">{p.height.toFixed(1)}°</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const PvPerformance: React.FC<PvPerformanceProps> = ({ onApplyYield, initialCapacity = 1000, customerName = "Standard Client" }) => {
  const [lat, setLat] = useState<number>(41.4228); 
  const [lon, setLon] = useState<number>(75.9650);
  const [numPanels, setNumPanels] = useState<number>(100);
  const [panelWattage, setPanelWattage] = useState<number>(500);
  const [azimuth, setAzimuth] = useState<number>(0); 
  const [slope, setSlope] = useState<number>(35);
  const [systemLoss, setSystemLoss] = useState<number>(14);
  const [loading, setLoading] = useState<boolean>(false);
  const [applied, setApplied] = useState<boolean>(false);
  const [shadingViewMode, setShadingViewMode] = useState<'chart' | 'table'>('chart');
  const [isDataReal, setIsDataReal] = useState<boolean>(false);
  const [lastApiUrl, setLastApiUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const [totalAnnual, setTotalAnnual] = useState<number>(85312); 
  const [results, setResults] = useState<MonthlyData[] | null>([
    { month: 'JAN', energy: 3840 }, { month: 'FEB', energy: 4920 }, { month: 'MAR', energy: 7100 },
    { month: 'APR', energy: 8200 }, { month: 'MAY', energy: 9400 }, { month: 'JUN', energy: 10200 },
    { month: 'JUL', energy: 9800 }, { month: 'AUG', energy: 8900 }, { month: 'SEP', energy: 7600 },
    { month: 'OCT', energy: 6200 }, { month: 'NOV', energy: 4900 }, { month: 'DEC', energy: 4252 }
  ]);
  const [horizonData, setHorizonData] = useState<HorizonPoint[] | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [mapStyle, setMapStyle] = useState<MapStyle>('satellite');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);

  useEffect(() => {
    if (typeof (window as any).L !== 'undefined' && !mapRef.current && mapContainerRef.current) {
      const L = (window as any).L;
      mapRef.current = L.map(mapContainerRef.current, { zoomControl: false }).setView([lat, lon], 12);
      L.control.zoom({ position: 'topleft' }).addTo(mapRef.current);
      tileLayerRef.current = L.tileLayer(MAP_LAYERS[mapStyle].url, { attribution: MAP_LAYERS[mapStyle].attr }).addTo(mapRef.current);
      markerRef.current = L.marker([lat, lon], { draggable: true }).addTo(mapRef.current);
      markerRef.current.on('dragend', (e: any) => {
        const { lat, lng } = e.target.getLatLng();
        setLat(parseFloat(lat.toFixed(4)));
        setLon(parseFloat(lng.toFixed(4)));
        setIsDataReal(false); 
      });
      mapRef.current.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        setLat(parseFloat(lat.toFixed(4)));
        setLon(parseFloat(lng.toFixed(4)));
        markerRef.current.setLatLng(e.latlng);
        setIsDataReal(false);
      });
      
      setTimeout(() => {
        mapRef.current?.invalidateSize();
        fetchPvGisData();
      }, 500);
    }
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (mapRef.current && tileLayerRef.current) {
      const L = (window as any).L;
      mapRef.current.removeLayer(tileLayerRef.current);
      tileLayerRef.current = L.tileLayer(MAP_LAYERS[mapStyle].url, { attribution: MAP_LAYERS[mapStyle].attr }).addTo(mapRef.current);
    }
  }, [mapStyle]);

  const fetchPvGisData = async () => {
    setLoading(true);
    const systemSize = (numPanels * panelWattage) / 1000; 
    const pvgisUrl = `https://re.jrc.ec.europa.eu/api/v5_2/PVcalc?lat=${lat}&lon=${lon}&peakpower=${systemSize}&loss=${systemLoss}&angle=${slope}&aspect=${azimuth}&outputformat=json`;
    const horizonUrl = `https://re.jrc.ec.europa.eu/api/printhorizon?lat=${lat}&lon=${lon}`;
    
    setLastApiUrl(horizonUrl);

    const fetchPV = async () => {
      try {
        const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(pvgisUrl)}`);
        const pvData = await res.json();
        if (pvData?.outputs?.monthly?.fixed) {
          const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
          setResults(pvData.outputs.monthly.fixed.map((item: any, index: number) => ({
            month: monthNames[index],
            energy: Math.round(item.E_m || 0)
          })));
          setTotalAnnual(Math.round(pvData.outputs.totals.fixed.E_y || 0));
        }
      } catch (e) { 
        console.error("PV Yield Fetch failed", e); 
      }
    };

    const fetchHorizon = async () => {
      try {
        const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(horizonUrl)}`);
        const hText = await res.text();
        const lines = hText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
        const parsedHorizon: HorizonPoint[] = [];
        if (lines.length > 2) {
          for (let i = 2; i < lines.length; i++) {
            const parts = lines[i].split(/\s+/);
            if (parts.length >= 2) {
              const az = parseFloat(parts[0]);
              const ht = parseFloat(parts[1]);
              if (!isNaN(az) && !isNaN(ht)) parsedHorizon.push({ azimuth: az, height: ht });
            }
          }
        }
        if (parsedHorizon.length > 0) {
          setHorizonData(parsedHorizon);
          setIsDataReal(true);
        }
      } catch (e) { 
        console.error("Horizon Fetch failed", e);
        setIsDataReal(false);
      }
    };

    await Promise.allSettled([fetchPV(), fetchHorizon()]);
    setLoading(false);
  };

  const handleApply = () => {
    if (onApplyYield) {
      onApplyYield(totalAnnual);
      setApplied(true);
      setTimeout(() => setApplied(false), 2000);
    }
  };

  // Ensure maxMonthEnergy is at least 1 to prevent division by zero / NaN
  const maxMonthEnergy = useMemo(() => {
    if (!results || results.length === 0) return 1000;
    const maxVal = Math.max(...results.map(r => r.energy));
    return maxVal > 0 ? maxVal : 1000;
  }, [results]);

  const summaryData = useMemo(() => {
    if (!results || results.length === 0) return null;
    
    const peak = [...results].sort((a, b) => b.energy - a.energy)[0];
    const min = [...results].sort((a, b) => a.energy - b.energy)[0];
    const avg = results.reduce((acc, curr) => acc + curr.energy, 0) / results.length;
    const systemSizeKWp = (numPanels * panelWattage) / 1000;
    const specificYield = systemSizeKWp > 0 ? totalAnnual / systemSizeKWp : 0;
    
    return {
      peak,
      min,
      avg,
      specificYield,
      systemSizeKWp
    };
  }, [results, totalAnnual, numPanels, panelWattage]);

  return (
    <div className="animate-in fade-in duration-500 space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">PV Performance Analysis</h1>
          <p className="text-slate-400 font-medium">Solar Resource Assessment & Technical Modeling</p>
        </div>
        <div className="flex gap-3">
          <button 
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center gap-2 px-6 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm text-slate-600 dark:text-slate-300"
          >
            <span className="material-icons-outlined text-lg text-primary">visibility</span>
            Preview Technical Report
          </button>
        </div>
      </div>

      {/* Synchronized Row: Map and Technical Specs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Map Card */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden p-2 relative h-full flex flex-col">
            <div ref={mapContainerRef} className="flex-1 w-full bg-slate-100 rounded-[1.8rem] overflow-hidden z-0 min-h-[350px]"></div>
            
            {/* Search Box */}
            <div className="absolute top-6 left-6 right-6 z-[1000] pointer-events-none flex justify-between gap-4">
              <form onSubmit={(e) => { e.preventDefault(); fetchPvGisData(); }} className="max-w-md w-full pointer-events-auto">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-icons-outlined text-slate-400 text-sm">search</span>
                  <input type="text" placeholder="Search location..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white/95 backdrop-blur-md border-none rounded-xl text-xs font-bold shadow-lg focus:ring-2 focus:ring-primary transition-all text-slate-900" />
                </div>
              </form>

              {/* Layer Selection Controls */}
              <div className="flex p-1 bg-white/95 backdrop-blur-md border border-white/20 rounded-xl shadow-lg pointer-events-auto">
                {(Object.entries(MAP_LAYERS) as [MapStyle, any][]).map(([style, config]) => (
                  <button
                    key={style}
                    onClick={() => setMapStyle(style)}
                    title={config.label}
                    className={`p-1.5 rounded-lg transition-all flex items-center justify-center gap-2 px-3 ${
                      mapStyle === style 
                        ? 'bg-primary text-white shadow-sm' 
                        : 'text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <span className="material-icons-outlined text-sm">{config.icon}</span>
                    <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">{config.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Lat/Lon Label */}
            <div className="absolute bottom-6 left-6 z-[1000] pointer-events-none">
              <div className="bg-slate-900/80 backdrop-blur-md text-white px-4 py-2 rounded-xl text-[10px] font-black tracking-widest flex items-center gap-4 shadow-xl">
                <span>LAT: {lat.toFixed(4)}</span>
                <span className="opacity-30">|</span>
                <span>LON: {lon.toFixed(4)}</span>
                <button onClick={() => lastApiUrl && alert(`PVGIS Source URL:\n${lastApiUrl}`)} className="ml-1 hover:text-primary transition-colors cursor-help pointer-events-auto">
                  <span className="material-icons-outlined text-xs">source</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Specs Card */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 space-y-6 h-full flex flex-col justify-between">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span className="material-icons-outlined text-primary text-xl">tune</span>
              Technical Specs
            </h2>
            <div className="space-y-4 flex-1 flex flex-col justify-center">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">LATITUDE</label>
                  <input type="number" step="0.0001" value={lat} onChange={(e) => setLat(parseFloat(e.target.value))} className="w-full bg-[#F8FAFC] border-none rounded-lg text-xs font-black p-2.5" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">LONGITUDE</label>
                  <input type="number" step="0.0001" value={lon} onChange={(e) => setLon(parseFloat(e.target.value))} className="w-full bg-[#F8FAFC] border-none rounded-lg text-xs font-black p-2.5" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-50">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">WATTAGE</label>
                    <span className="text-[10px] font-black text-slate-900">{panelWattage}</span>
                  </div>
                  <input type="number" value={panelWattage} onChange={(e) => setPanelWattage(parseInt(e.target.value) || 0)} className="w-full bg-[#F8FAFC] border-none rounded-lg text-xs font-black p-2.5" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">LOSS</label>
                      <span className="material-icons-outlined text-slate-300 text-[12px] cursor-help">info</span>
                    </div>
                    <span className="text-[10px] font-black text-rose-500">{systemLoss}%</span>
                  </div>
                  <input type="number" min="0" max="100" value={systemLoss} onChange={(e) => setSystemLoss(parseInt(e.target.value) || 0)} className="w-full bg-[#F8FAFC] border-none rounded-lg text-xs font-black p-2.5 text-rose-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-50">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center"><label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">SLOPE</label><span className="text-[10px] font-black text-[#2B4184]">{slope}°</span></div>
                  <input type="number" min="0" max="90" value={slope} onChange={(e) => setSlope(parseInt(e.target.value) || 0)} className="w-full bg-[#F8FAFC] border-none rounded-lg text-xs font-black p-2.5" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center"><label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">AZIMUTH</label><span className="text-[10px] font-black text-[#2B4184]">{azimuth}°</span></div>
                  <input type="number" min="-180" max="180" value={azimuth} onChange={(e) => setAzimuth(parseInt(e.target.value) || 0)} className="w-full bg-[#F8FAFC] border-none rounded-lg text-xs font-black p-2.5" />
                </div>
              </div>
            </div>
            <button onClick={fetchPvGisData} disabled={loading} className="w-full py-4 bg-[#2B4184] text-white rounded-xl font-bold hover:brightness-110 transition-all shadow-lg flex items-center justify-center gap-3 mt-4">
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><span className="material-icons-outlined text-lg">bolt</span>Generate Model</>}
            </button>
          </div>
        </div>
      </div>

      {/* Main Analysis Column (Span 8) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          {/* Monthly Yield Card */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 flex flex-col items-start min-h-[520px]">
            <h2 className="text-lg font-black text-slate-900">Monthly Yield</h2>
            <div className="flex items-baseline gap-2 mt-1 mb-12">
              <span className="text-3xl font-black text-[#1D4ED8] tracking-tight">{totalAnnual.toLocaleString().replace(/,/g, ' ')}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">KWH / YR</span>
            </div>
            <div className="w-full h-[320px] flex items-end justify-between gap-3 px-1 mt-6">
              {(results || Array(12).fill(null)).map((r, i) => {
                 const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
                 const monthName = r ? r.month : months[i];
                 const energy = r ? r.energy : 0;
                 const barHeight = results ? Math.min(100, Math.max(0, (energy / maxMonthEnergy) * 100)) : 0;
                 
                 return (
                  <div key={i} className="flex-1 h-full flex flex-col items-center group relative">
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 scale-90 group-hover:scale-100">
                       <span className="text-[10px] font-black text-white bg-blue-600 px-3 py-1.5 shadow-2xl rounded-lg whitespace-nowrap border border-white/20 ring-4 ring-blue-500/10">
                         {energy.toLocaleString()} kWh
                       </span>
                    </div>

                    <div className="relative w-full h-full flex flex-col justify-end bg-slate-50/50 rounded-t-xl overflow-hidden">
                      <div className="absolute inset-x-0 bottom-0 top-0 bg-slate-100/30"></div>
                      <div 
                        className="relative w-full bg-gradient-to-t from-blue-700 to-blue-500 rounded-t-lg transition-all duration-1000 ease-out cursor-pointer shadow-[0_4px_12px_rgba(37,99,235,0.2)] group-hover:from-blue-600 group-hover:to-blue-400 group-hover:shadow-[0_8px_24px_rgba(37,99,235,0.4)] group-hover:scale-x-105 active:scale-95 z-10"
                        style={{ height: `${barHeight}%` }}
                      >
                         <div className="absolute inset-0 bg-white/10 opacity-30"></div>
                      </div>
                    </div>
                    <span className="text-[8px] font-black text-slate-400 mt-5 uppercase tracking-tighter group-hover:text-blue-700 transition-colors">
                      {monthName}
                    </span>
                  </div>
                 );
              })}
            </div>
            <button onClick={handleApply} className="mt-10 w-full py-4 bg-[#F1F5F9] text-slate-400 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] hover:bg-slate-100 transition-all">
              {applied ? 'APPLIED SUCCESSFULLY' : 'APPLY TO PROJECTIONS'}
            </button>
          </div>

          {/* New Widget: Summary Analytics Table */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 flex flex-col items-start overflow-hidden">
            <h2 className="text-lg font-black text-slate-900 mb-6">Production Analytics</h2>
            <div className="w-full overflow-hidden border border-slate-100 rounded-2xl">
              <table className="w-full text-left border-collapse">
                <tbody className="divide-y divide-slate-100">
                  <tr className="group hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Specific Yield</td>
                    <td className="py-4 px-6 text-sm font-black text-slate-900 text-right">
                      {summaryData?.specificYield.toFixed(1)} <span className="text-[10px] font-bold text-slate-400 ml-1">kWh / kWp</span>
                    </td>
                  </tr>
                  <tr className="group hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Peak Production</td>
                    <td className="py-4 px-6 text-sm font-black text-slate-900 text-right">
                      <span className="text-[10px] font-bold text-primary mr-2">{summaryData?.peak?.month}</span>
                      {summaryData?.peak?.energy.toLocaleString()} <span className="text-[10px] font-bold text-slate-400 ml-1">kWh</span>
                    </td>
                  </tr>
                  <tr className="group hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Minimum Production</td>
                    <td className="py-4 px-6 text-sm font-black text-slate-900 text-right">
                      <span className="text-[10px] font-bold text-rose-500 mr-2">{summaryData?.min?.month}</span>
                      {summaryData?.min?.energy.toLocaleString()} <span className="text-[10px] font-bold text-slate-400 ml-1">kWh</span>
                    </td>
                  </tr>
                  <tr className="group hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Average Monthly</td>
                    <td className="py-4 px-6 text-sm font-black text-slate-900 text-right">
                      {Math.round(summaryData?.avg || 0).toLocaleString()} <span className="text-[10px] font-bold text-slate-400 ml-1">kWh / mo</span>
                    </td>
                  </tr>
                  <tr className="group hover:bg-slate-50 transition-colors bg-slate-50/30">
                    <td className="py-4 px-6 text-[10px] font-black text-slate-900 uppercase tracking-widest">Annual Total</td>
                    <td className="py-4 px-6 text-sm font-black text-primary text-right">
                      {totalAnnual.toLocaleString()} <span className="text-[10px] font-bold text-slate-400 ml-1">kWh</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-6 flex items-center gap-2 px-1">
              <span className="material-icons-outlined text-amber-500 text-sm">info</span>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Metrics are estimated using 20-year meteorological averages.</p>
            </div>
          </div>
        </div>

        {/* Sidebar Column (Span 4) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Terrain Shading Card */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 flex flex-col items-center min-h-[520px] relative">
            <div className="w-full flex justify-between items-start mb-6">
              <div className="flex flex-col">
                <h2 className="text-lg font-black text-slate-900">Terrain Shading</h2>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Local Horizon Profile</p>
              </div>
              <div className="flex p-0.5 bg-slate-50 rounded-lg border border-slate-100">
                <button onClick={() => setShadingViewMode('chart')} className={`p-1.5 rounded-md transition-all ${shadingViewMode === 'chart' ? 'bg-white text-primary shadow-sm' : 'text-slate-300'}`}><span className="material-icons-outlined text-sm">auto_graph</span></button>
                <button onClick={() => setShadingViewMode('table')} className={`p-1.5 rounded-md transition-all ${shadingViewMode === 'table' ? 'bg-white text-primary shadow-sm' : 'text-slate-300'}`}><span className="material-icons-outlined text-sm">table_chart</span></button>
              </div>
            </div>
            
            <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
              {shadingViewMode === 'chart' ? (
                <HorizonChart lat={lat} horizon={horizonData} isReal={isDataReal} />
              ) : (
                <HorizonDataTable horizon={horizonData} onGenerate={fetchPvGisData} isReal={isDataReal} />
              )}
            </div>
          </div>
          
          <div className="bg-[#020617] p-8 rounded-[2rem] text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[60px] -mr-16 -mt-16"></div>
             <p className="text-[10px] font-medium leading-relaxed opacity-70">Technical simulations utilize PVGIS 5.2 datasets with topographic shading analysis. Models account for historical irradiance curves and spectral losses.</p>
          </div>
        </div>
      </div>

      {/* Technical Report Preview Modal */}
      <TechnicalPdfPreview 
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        lat={lat}
        lon={lon}
        slope={slope}
        azimuth={azimuth}
        systemLoss={systemLoss}
        capacity={(numPanels * panelWattage) / 1000}
        totalAnnual={totalAnnual}
        results={results}
        horizonData={horizonData}
        customerName={customerName}
      />
    </div>
  );
};

export default PvPerformance;
