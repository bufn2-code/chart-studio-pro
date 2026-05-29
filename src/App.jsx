import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, RotateCcw, Database, Sliders, Plus, Trash2, Video, LayoutTemplate, MonitorPlay, ClipboardPaste, X } from 'lucide-react';

// ============================================================================
// DATA BAWAAN LENGKAP
// ============================================================================
const defaultData = {
  title: "PREMIER LEAGUE 25/26",
  periodPrefix: "WK",
  startPeriod: 1, 
  periods: 38,
  footerText: "@YourChannelName",
  unitLabel: "PTS",
  items: [
    { id: "MCI", name: "Man City", color: "#6CABDD", logo: "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg", points: [3, 6, 9, 12, 15, 18, 18, 21, 24, 27, 30, 31, 32, 35, 38, 41, 44, 47, 50, 53, 56, 59, 62, 65, 68, 71, 74, 77, 80, 83, 86, 89, 92, 95, 98, 101, 104, 107] },
    { id: "ARS", name: "Arsenal", color: "#EF0107", logo: "https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg", points: [3, 6, 7, 10, 13, 14, 17, 20, 23, 24, 24, 27, 30, 33, 36, 39, 41, 44, 47, 50, 53, 56, 59, 62, 65, 68, 71, 74, 77, 80, 83, 86, 89, 92, 95, 98, 101, 104] },
    { id: "LIV", name: "Liverpool", color: "#C8102E", logo: "https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg", points: [1, 4, 7, 10, 13, 16, 17, 20, 23, 26, 27, 28, 31, 34, 37, 38, 41, 44, 47, 50, 53, 56, 59, 62, 65, 68, 71, 74, 77, 80, 83, 86, 89, 92, 95, 98, 101, 104] },
    { id: "AVL", name: "Aston Villa", color: "#670E36", logo: "https://upload.wikimedia.org/wikipedia/en/9/9f/Aston_Villa_logo.svg", points: [0, 3, 6, 9, 12, 15, 16, 19, 22, 25, 26, 29, 32, 35, 38, 41, 44, 47, 50, 53, 56, 59, 62, 65, 68, 71, 74, 77, 80, 83, 86, 89, 92, 95, 98, 101, 104, 107] },
    { id: "TOT", name: "Spurs", color: "#132257", logo: "https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg", points: [1, 4, 7, 10, 13, 14, 17, 20, 23, 26, 29, 32, 35, 38, 41, 44, 47, 50, 53, 56, 59, 62, 65, 68, 71, 74, 77, 80, 83, 86, 89, 92, 95, 98, 101, 104, 107, 110] },
    { id: "CHE", name: "Chelsea", color: "#034694", logo: "https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg", points: [1, 1, 4, 4, 5, 8, 11, 12, 13, 16, 19, 22, 25, 28, 31, 34, 37, 40, 43, 46, 49, 52, 55, 58, 61, 64, 67, 70, 73, 76, 79, 82, 85, 88, 91, 94, 97, 100] },
    { id: "NEW", name: "Newcastle", color: "#241F20", logo: "https://upload.wikimedia.org/wikipedia/en/5/56/Newcastle_United_Logo.svg", points: [3, 3, 3, 6, 9, 12, 13, 16, 17, 20, 23, 26, 29, 32, 35, 38, 41, 44, 47, 50, 53, 56, 59, 62, 65, 68, 71, 74, 77, 80, 83, 86, 89, 92, 95, 98, 101, 104] },
    { id: "MUN", name: "Man Utd", color: "#DA291C", logo: "https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg", points: [3, 3, 6, 6, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42, 45, 48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78, 81, 84, 87, 90, 93, 96, 99, 102, 105] }
  ]
};

const getSafePts = (pointsArr, index) => {
  if (!pointsArr || pointsArr.length === 0) return 0;
  if (index < pointsArr.length) return pointsArr[index];
  return pointsArr[pointsArr.length - 1]; 
};

export default function App() {
  const [data, setData] = useState(defaultData);
  const [activeTab, setActiveTab] = useState('preview'); 
  
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [layout, setLayout] = useState('16:9');
  const [topN, setTopN] = useState(5); 
  const [markerStyle, setMarkerStyle] = useState('logo'); 
  
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");

  const reqRef = useRef(null);
  const prevTime = useRef(null);

  // ----------------------------------------------------------------------------
  // MESIN AUTO-RANK (Diperkuat: Anti-Crash Jika ID Ganda)
  // ----------------------------------------------------------------------------
  const computedItems = useMemo(() => {
    let newItems = JSON.parse(JSON.stringify(data.items));
    newItems.forEach(item => item.ranks = []); 

    for (let w = 0; w < data.periods; w++) {
      // Menyimpan index asli agar tidak error saat user mengisi ID ganda di tabel
      let leaderboard = newItems.map((item, originalIndex) => ({
        originalIndex,
        pts: getSafePts(item.points, w),
        name: item.name || ""
      }));

      leaderboard.sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts; 
        if (w > 0) {
          const rankA = newItems[a.originalIndex].ranks[w-1];
          const rankB = newItems[b.originalIndex].ranks[w-1];
          return (rankA || 0) - (rankB || 0);
        }
        return a.name.localeCompare(b.name); 
      });

      leaderboard.forEach((team, index) => {
        newItems[team.originalIndex].ranks[w] = index + 1; 
      });
    }
    return newItems;
  }, [data.items, data.periods]);

  // --- ENGINE ANIMASI ---
  const animate = (time) => {
    if (prevTime.current !== undefined) {
      const deltaTime = time - prevTime.current;
      const progressDelta = (deltaTime / 1000) * (speed * 1.5); 
      setProgress((prev) => {
        const next = prev + progressDelta;
        const maxProgress = Math.max(data.periods - 1, 1);
        if (next >= maxProgress) { setIsPlaying(false); return maxProgress; }
        return next;
      });
    }
    prevTime.current = time;
    if (isPlaying) reqRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isPlaying) reqRef.current = requestAnimationFrame(animate);
    else { cancelAnimationFrame(reqRef.current); prevTime.current = undefined; }
    return () => cancelAnimationFrame(reqRef.current);
  }, [isPlaying, data.periods, speed]);

  const resetAnimation = () => {
    setIsPlaying(false);
    setProgress(0);
    prevTime.current = undefined;
  };

  // --- HANDLERS DATA EDITOR ---
  const handleUpdateGeneral = (field, value) => setData(prev => ({ ...prev, [field]: value }));
  
  const handlePointChange = (teamId, periodIndex, value) => {
    setData(prev => ({
      ...prev, items: prev.items.map(t => {
        if (t.id !== teamId) return t;
        const newPoints = [...t.points];
        while (newPoints.length < prev.periods) newPoints.push(newPoints[newPoints.length - 1] || 0);
        newPoints[periodIndex] = parseInt(value) || 0;
        return { ...t, points: newPoints };
      })
    }));
  };

  const handleFieldChange = (teamId, field, value) => {
    setData(prev => ({
      ...prev, items: prev.items.map(t => t.id !== teamId ? t : { ...t, [field]: value })
    }));
  };

  const handleAddItem = () => {
    const newItem = { id: `NEW${data.items.length}`, name: "New Team", color: "#3B82F6", logo: "", points: Array(data.periods).fill(0) };
    setData(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };
  
  const handleRemoveItem = (itemId) => {
    setData(prev => ({ ...prev, items: prev.items.filter(t => t.id !== itemId) }));
  };

  // ----------------------------------------------------------------------------
  // LOGIKA MAGIC IMPORT (AI / EXCEL PARSER)
  // ----------------------------------------------------------------------------
  const handleImportData = () => {
    try {
      const rows = importText.trim().split('\n');
      const parsedItems = [];
      let detectedPeriods = 0;
      
      rows.forEach((row, i) => {
        let cleanRow = row.trim();
        if (cleanRow.startsWith('|')) cleanRow = cleanRow.substring(1);
        if (cleanRow.endsWith('|')) cleanRow = cleanRow.substring(0, cleanRow.length - 1);
        
        const cols = cleanRow.split(/\t|\|/).map(c => c.trim()).filter(c => c !== '');
        
        if (cols.length < 2 || cols[0].includes('---') || cols[0].toLowerCase().includes('tim') || cols[0].toLowerCase().includes('team') || cols[0].toLowerCase() === 'nama') return;
        
        const name = cols[0];
        const id = (name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() || 'TIM') + i; 
        
        const presetColors = ["#EF0107", "#6CABDD", "#FDB913", "#1B458F", "#132257", "#034694", "#E30613", "#DA291C", "#F78F1E", "#0057B8", "#670E36", "#241F20", "#7A263A", "#DD0000", "#6C1D45"];
        const color = presetColors[parsedItems.length % presetColors.length];

        const rawPoints = cols.slice(1);
        if (rawPoints.length > detectedPeriods) detectedPeriods = rawPoints.length;

        parsedItems.push({ id, name, color, logo: "", rawPoints });
      });

      if (parsedItems.length > 0) {
        const newPeriods = Math.max(data.periods, detectedPeriods);
        
        const finalItems = parsedItems.map(item => {
          const points = [];
          let lastVal = 0;
          for (let p = 0; p < newPeriods; p++) {
            if (p < item.rawPoints.length) {
              const val = parseInt(item.rawPoints[p].replace(/[^0-9-]/g, ''));
              lastVal = isNaN(val) ? lastVal : val;
            }
            points.push(lastVal);
          }
          return { id: item.id, name: item.name, color: item.color, logo: "", points };
        });

        setData(prev => ({ ...prev, periods: newPeriods, items: finalItems }));
        setShowImportModal(false);
        setImportText("");
        setImportError("");
      } else {
        setImportError("Format tidak dikenali. Pastikan Anda menyalin tabel yang berisi sekumpulan Nama dan Angka.");
      }
    } catch (error) {
      setImportError("Terjadi kesalahan sistem saat memproses data tabel Anda.");
    }
  };


  // ============================================================================
  // TAB 1: RENDERER PREVIEW & KANVAS
  // ============================================================================
  const renderPreview = () => {
    const isVertical = layout === '9:16';
    const SVG_WIDTH = isVertical ? 1080 : 1920; 
    const SVG_HEIGHT = isVertical ? 1920 : 1080; 
    
    const HEADER_H = isVertical ? 160 : 140;
    const FOOTER_H = isVertical ? 140 : 100;
    const X_AXIS_H = isVertical ? 100 : 80; 
    
    const CHART_Y_START = HEADER_H + X_AXIS_H; 
    const CHART_HEIGHT = SVG_HEIGHT - CHART_Y_START - FOOTER_H; 
    
    const RIGHT_HUD_W = isVertical ? 240 : 280; 
    const RANK_X = isVertical ? 80 : 120;       
    const START_X = isVertical ? 240 : 300;     
    
    const CHART_WIDTH = SVG_WIDTH - START_X - RIGHT_HUD_W - (isVertical ? 40 : 60); 

    const safeTopN = Math.max(topN, 2); 
    const rowHeight = CHART_HEIGHT / safeTopN; 
    const getY = (rank) => CHART_Y_START + ((rank - 0.5) * rowHeight);

    const FONT_RANK = Math.min(rowHeight * 0.5, isVertical ? 45 : 50);
    const FONT_HUD  = Math.min(rowHeight * 0.5, isVertical ? 40 : 45);
    const FONT_WK   = isVertical ? 30 : 35; 
    const FONT_TITLE= isVertical ? 45 : 60;
    const FONT_FOOT = isVertical ? 30 : 35;

    const NODE_OUTER_R = Math.min(rowHeight * 0.4, isVertical ? 45 : 50);
    const NODE_INNER_R = NODE_OUTER_R * 0.85;
    const LINE_WIDTH = Math.max(Math.min(rowHeight * 0.15, 12), 6);
    const FONT_NODE = Math.max(NODE_INNER_R * 0.6, 16); 

    const PILL_H = Math.min(rowHeight * 0.7, 80);
    const PILL_R = PILL_H / 2;

    const clipLeftX = START_X - (NODE_OUTER_R * 2);

    const sampleLabel = data.periodPrefix 
        ? `${data.periodPrefix} ${Number(data.startPeriod || 1)}` 
        : `${Number(data.startPeriod || 1)}`;
    const isLongText = sampleLabel.length > 5; 
    
    const VISIBLE_WEEKS = isVertical ? (isLongText ? 3 : 4) : (isLongText ? 4 : 6);
    const activeVisiblePeriods = Math.min(data.periods, VISIBLE_WEEKS);
    
    const SPACING = CHART_WIDTH / Math.max(activeVisiblePeriods - 1, 1);
    const getX = (index) => START_X + (index * SPACING);
    
    const panThreshold = Math.max(1, activeVisiblePeriods - 2); 
    const panX = Math.max(0, progress - panThreshold) * SPACING;

    const lerp = (start, end, t) => start + (end - start) * t;
    const easeInOutSine = (t) => t * t * (3 - 2 * t);
    
    const getMarkerPos = (item, currentProgress) => {
      const w1 = Math.floor(currentProgress);
      const w2 = Math.min(w1 + 1, data.periods - 1);
      const t = currentProgress - w1;
      const easedT = easeInOutSine(t);
      const r1 = item.ranks[w1] || 1;
      const r2 = item.ranks[w2] || 1;
      return { 
        x: lerp(getX(w1), getX(w2), t), 
        y: lerp(getY(r1), getY(r2), easedT),
        rank: lerp(r1, r2, easedT)
      };
    };

    const generatePath = (item) => {
      let d = `M ${getX(0)} ${getY(item.ranks[0] || 1)}`;
      for (let i = 0; i < data.periods - 1; i++) {
        const r1 = item.ranks[i] || 1;
        const r2 = item.ranks[i+1] || 1;
        const x0 = getX(i), y0 = getY(r1), x1 = getX(i+1), y1 = getY(r2);
        const dx = (x1 - x0) / 2;
        d += ` C ${x0 + dx} ${y0}, ${x1 - dx} ${y1}, ${x1} ${y1}`;
      }
      return d;
    };

    return (
      <div className="flex flex-1 overflow-hidden relative" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* PANEL PENGATURAN KIRI */}
        <div className="w-[350px] bg-white border-r border-slate-200 shadow-xl z-10 flex flex-col p-6 overflow-y-auto">
          <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2"><Sliders size={20} className="text-blue-600"/> Animation Setup</h2>
          
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <button onClick={() => setIsPlaying(!isPlaying)} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-black transition-all shadow-md mb-2">
                {isPlaying ? <Pause size={20} /> : <Play size={20} />} {isPlaying ? 'PAUSE' : 'PLAY'}
              </button>
              <button onClick={resetAnimation} className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-slate-700 py-2 rounded-lg font-bold border border-slate-300">
                <RotateCcw size={16} /> Reset
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase">Video Resolution</label>
              <div className="flex gap-2">
                <button onClick={() => setLayout('16:9')} className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${layout === '16:9' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>16:9 (Wide)</button>
                <button onClick={() => setLayout('9:16')} className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${layout === '9:16' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>9:16 (Shorts)</button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase">Tampilan Tim / Marker</label>
              <div className="flex gap-2">
                <button onClick={() => setMarkerStyle('logo')} className={`flex-1 py-2 text-[10px] font-bold rounded-lg border transition-all ${markerStyle === 'logo' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Logo</button>
                <button onClick={() => setMarkerStyle('name')} className={`flex-1 py-2 text-[10px] font-bold rounded-lg border transition-all ${markerStyle === 'name' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Nama</button>
                <button onClick={() => setMarkerStyle('both')} className={`flex-1 py-2 text-[10px] font-bold rounded-lg border transition-all ${markerStyle === 'both' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Logo+Nama</button>
              </div>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <div className="flex justify-between text-xs mb-2 text-slate-600 font-bold">
                  <span>Progress</span>
                  <span className="text-blue-600">{Math.floor((progress / Math.max((data.periods - 1), 1)) * 100)}%</span>
                </div>
                <input type="range" min="0" max={Math.max(data.periods - 1, 1)} step="0.01" value={progress} onChange={(e) => { setProgress(parseFloat(e.target.value)); setIsPlaying(false); }} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
              </div>
              <div className="pt-2">
                <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Animation Speed</label>
                <div className="flex gap-2">
                  {[0.5, 1, 1.5, 2].map(s => (
                    <button key={s} onClick={() => setSpeed(s)} className={`flex-1 py-1.5 rounded text-xs font-bold transition-all ${speed === s ? 'bg-blue-600 text-white shadow' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'}`}>{s}x</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Main Title</label>
                <input type="text" value={data.title} onChange={(e) => handleUpdateGeneral('title', e.target.value)} className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold text-slate-800" />
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Period Prefix</label>
                  <input type="text" value={data.periodPrefix} onChange={(e) => handleUpdateGeneral('periodPrefix', e.target.value)} className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold text-slate-800" placeholder="WK / YR / None" />
                </div>
                <div className="col-span-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Start Num/Year</label>
                  <input type="number" value={data.startPeriod || 1} onChange={(e) => handleUpdateGeneral('startPeriod', parseInt(e.target.value) || 0)} className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold text-slate-800" placeholder="e.g. 2000" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Unit Label</label>
                  <input type="text" value={data.unitLabel} onChange={(e) => handleUpdateGeneral('unitLabel', e.target.value)} className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold text-slate-800" placeholder="PTS / SUBS" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Total Periods</label>
                  <input type="number" value={data.periods} onChange={(e) => handleUpdateGeneral('periods', parseInt(e.target.value) || 1)} className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold text-slate-800" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-blue-600 uppercase block mb-1">Top N Filter</label>
                  <input type="number" min="2" max={computedItems.length} value={topN} onChange={(e) => setTopN(Math.max(2, Math.min(computedItems.length, Number(e.target.value))))} className="w-full text-sm p-2 bg-blue-50 border border-blue-200 rounded-lg outline-none font-bold text-blue-700" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KANVAS PREVIEW SVG */}
        <div className="flex-1 bg-slate-200 p-4 md:p-8 flex items-center justify-center overflow-hidden">
          <div className="bg-[#FFFFFF] rounded-2xl shadow-2xl overflow-hidden flex flex-col ring-1 ring-slate-300"
            style={{ height: isVertical ? '95%' : '90%', width: isVertical ? 'auto' : '100%', maxWidth: isVertical ? 'none' : '1600px', aspectRatio: isVertical ? '9/16' : '16/9' }}>
            <div className="flex-1 w-full relative">
              <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} className="w-full h-full absolute inset-0" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%' }}>
                
                {/* === 1. ZONA HEADER & FOOTER (KUNING PREMIUM) === */}
                <g>
                  <rect x="0" y="0" width={SVG_WIDTH} height={HEADER_H} fill="#FFCA28" />
                  <rect x="0" y={HEADER_H - 4} width={SVG_WIDTH} height="4" fill="#0F172A" />
                  <text x={SVG_WIDTH / 2} y={HEADER_H / 2 + 5} dominantBaseline="middle" textAnchor="middle" fill="#0F172A" fontSize={FONT_TITLE} fontWeight="900" letterSpacing="4" style={{ fontFamily: 'sans-serif' }}>{data.title}</text>
                  
                  <rect x="0" y={SVG_HEIGHT - FOOTER_H} width={SVG_WIDTH} height={FOOTER_H} fill="#FFCA28" />
                  <rect x="0" y={SVG_HEIGHT - FOOTER_H} width={SVG_WIDTH} height="4" fill="#0F172A" />
                  <text x={SVG_WIDTH / 2} y={SVG_HEIGHT - (FOOTER_H / 2) + 5} dominantBaseline="middle" textAnchor="middle" fill="#0F172A" fontSize={FONT_FOOT} fontWeight="900" letterSpacing="2" style={{ fontFamily: 'sans-serif' }}>{data.footerText}</text>
                </g>

                {/* === 2. BACKGROUND & GRID KLASEMEN === */}
                <g>
                  {Array.from({ length: safeTopN }).map((_, i) => (
                    i % 2 === 0 && <rect key={`bg-row-${i}`} x="0" y={getY(i + 1) - (rowHeight / 2)} width={SVG_WIDTH} height={rowHeight} fill="#F8FAFC" />
                  ))}
                  {Array.from({ length: safeTopN }).map((_, i) => (
                    <g key={`grid-y-${i}`}>
                      <line x1="0" y1={getY(i + 1) + (rowHeight / 2)} x2={SVG_WIDTH} y2={getY(i + 1) + (rowHeight / 2)} stroke="#E2E8F0" strokeWidth="2" />
                      <text x={RANK_X} y={getY(i + 1)} dominantBaseline="middle" textAnchor="middle" fill="#64748B" fontSize={FONT_RANK} fontWeight="900" style={{ fontFamily: 'sans-serif' }}>{i + 1}</text>
                    </g>
                  ))}
                </g>

                {/* === 3. DEFS & CLIPPING (ANTI-BOCOR) === */}
                <defs>
                  <clipPath id="header-clip"><rect x={clipLeftX} y={HEADER_H} width={SVG_WIDTH - clipLeftX - RIGHT_HUD_W} height={X_AXIS_H} /></clipPath>
                  <clipPath id="chart-clip"><rect x={clipLeftX} y={CHART_Y_START} width={SVG_WIDTH - clipLeftX - RIGHT_HUD_W} height={CHART_HEIGHT} /></clipPath>
                  <clipPath id="hud-clip"><rect x={SVG_WIDTH - RIGHT_HUD_W} y={CHART_Y_START} width={RIGHT_HUD_W} height={CHART_HEIGHT} /></clipPath>
                  
                  <clipPath id="reveal-clip"><rect x="-1000" y="-1000" width={1000 + getX(progress)} height="3000" /></clipPath>
                  
                  <filter id="clean-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="5" stdDeviation="6" floodOpacity="0.15" floodColor="#0F172A" />
                  </filter>
                  {computedItems.map(item => (
                    <clipPath id={`logo-clip-${item.id}`} key={`clip-${item.id}`}>
                      <circle r={NODE_INNER_R} />
                    </clipPath>
                  ))}
                </defs>

                {/* === EPIC WATERMARK === */}
                <g clipPath="url(#chart-clip)">
                  <text x={SVG_WIDTH - RIGHT_HUD_W - 40} y={SVG_HEIGHT - FOOTER_H - 40} textAnchor="end" fill="#CBD5E1" fontSize={isVertical ? "120" : "220"} fontWeight="900" opacity="0.35" style={{ fontFamily: 'sans-serif', letterSpacing: '-2px' }}>
                    {data.periodPrefix ? `${data.periodPrefix} ${Number(data.startPeriod || 1) + Math.floor(progress)}` : `${Number(data.startPeriod || 1) + Math.floor(progress)}`}
                  </text>
                </g>

                {/* === 4. TULISAN PERIODE / MINGGU / TAHUN === */}
                <g>
                  <rect x="0" y={HEADER_H} width={SVG_WIDTH} height={X_AXIS_H} fill="#FFFFFF" />
                  <line x1="0" y1={CHART_Y_START} x2={SVG_WIDTH} y2={CHART_Y_START} stroke="#CBD5E1" strokeWidth="2" />
                  <text x={SVG_WIDTH - (RIGHT_HUD_W / 2)} y={HEADER_H + (X_AXIS_H / 2) + 5} dominantBaseline="middle" textAnchor="middle" fill="#94A3B8" fontSize={FONT_WK} fontWeight="900" letterSpacing="2">{data.unitLabel}</text>
                  <g clipPath="url(#header-clip)">
                    <g transform={`translate(${-panX}, 0)`}>
                      {Array.from({ length: data.periods }).map((_, i) => {
                        const displayLabel = data.periodPrefix 
                          ? `${data.periodPrefix} ${Number(data.startPeriod || 1) + i}` 
                          : `${Number(data.startPeriod || 1) + i}`;

                        return (
                          <text key={`wk-${i}`} x={getX(i)} y={HEADER_H + (X_AXIS_H / 2) + 5} dominantBaseline="middle" textAnchor="middle" fill="#64748B" fontSize={FONT_WK} fontWeight="900">
                            {displayLabel}
                          </text>
                        );
                      })}
                    </g>
                  </g>
                </g>

                {/* === 5. AREA CHART BALAPAN === */}
                <g clipPath="url(#chart-clip)">
                  <g transform={`translate(${-panX}, 0)`}>
                    {Array.from({ length: data.periods }).map((_, i) => (
                      <line key={`grid-x-${i}`} x1={getX(i)} y1={CHART_Y_START} x2={getX(i)} y2={SVG_HEIGHT - FOOTER_H} stroke="#CBD5E1" strokeWidth="2" strokeDasharray="6 6" />
                    ))}
                    <g clipPath="url(#reveal-clip)">
                      {computedItems.map((item) => (
                        Math.min(...(item.ranks.length > 0 ? item.ranks : [1])) <= safeTopN && (
                          <path key={`path-${item.id}`} d={generatePath(item)} fill="none" stroke={item.color} strokeWidth={LINE_WIDTH} strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
                        )
                      ))}
                    </g>
                    {/* RENDERER MARKER DINAMIS */}
                    {computedItems.map((item) => {
                      const pos = getMarkerPos(item, progress);
                      if (pos.rank > safeTopN + 1.5) return null; 

                      const hasLogo = item.logo && item.logo.trim() !== '';

                      const renderLogoOnly = () => (
                        <g>
                          <circle r={NODE_OUTER_R} fill="#FFFFFF" stroke={item.color} strokeWidth={LINE_WIDTH * 0.5} filter="url(#clean-shadow)" />
                          {hasLogo ? (
                            <image href={item.logo} x={-NODE_INNER_R} y={-NODE_INNER_R} height={NODE_INNER_R * 2} width={NODE_INNER_R * 2} clipPath={`url(#logo-clip-${item.id})`} preserveAspectRatio="xMidYMid slice" />
                          ) : (
                            <text y="2" dominantBaseline="middle" textAnchor="middle" fill="#0F172A" fontSize={FONT_NODE} fontWeight="900" style={{ fontFamily: 'monospace' }}>{item.id}</text>
                          )}
                        </g>
                      );

                      const renderNameOnly = () => (
                        <g>
                          <circle r={NODE_OUTER_R} fill="#FFFFFF" stroke={item.color} strokeWidth={LINE_WIDTH * 0.5} filter="url(#clean-shadow)" />
                          <text y="2" dominantBaseline="middle" textAnchor="middle" fill="#0F172A" fontSize={FONT_NODE} fontWeight="900" style={{ fontFamily: 'monospace' }}>{item.id}</text>
                        </g>
                      );

                      const renderBoth = () => {
                        const PILL_WIDTH = NODE_OUTER_R * 3.8; 
                        return (
                          <g>
                            <rect x={-NODE_OUTER_R} y={-NODE_OUTER_R} width={PILL_WIDTH} height={NODE_OUTER_R * 2} fill="#FFFFFF" rx={NODE_OUTER_R} stroke={item.color} strokeWidth={LINE_WIDTH * 0.5} filter="url(#clean-shadow)" />
                            {hasLogo ? (
                              <image href={item.logo} x={-NODE_INNER_R} y={-NODE_INNER_R} height={NODE_INNER_R * 2} width={NODE_INNER_R * 2} clipPath={`url(#logo-clip-${item.id})`} preserveAspectRatio="xMidYMid slice" />
                            ) : (
                              <g>
                                <circle cx="0" cy="0" r={NODE_INNER_R} fill={item.color} />
                                <text x="0" y="2" dominantBaseline="middle" textAnchor="middle" fill="#FFFFFF" fontSize={FONT_NODE * 0.6} fontWeight="900" style={{ fontFamily: 'monospace' }}>#</text>
                              </g>
                            )}
                            <text x={NODE_OUTER_R * 1.3} y="2" dominantBaseline="middle" textAnchor="middle" fill="#0F172A" fontSize={FONT_NODE * 1.1} fontWeight="900" style={{ fontFamily: 'monospace' }}>{item.id}</text>
                          </g>
                        );
                      };

                      return (
                        <g key={`marker-${item.id}`} transform={`translate(${pos.x}, ${pos.y})`}>
                          {markerStyle === 'logo' && renderLogoOnly()}
                          {markerStyle === 'name' && renderNameOnly()}
                          {markerStyle === 'both' && renderBoth()}
                        </g>
                      );
                    })}
                  </g>
                </g>
                
                {/* === 6. KOLOM LIVE POINTS === */}
                <g>
                  <rect x={SVG_WIDTH - RIGHT_HUD_W} y={CHART_Y_START} width={RIGHT_HUD_W} height={CHART_HEIGHT} fill="#F8FAFC" />
                  <line x1={SVG_WIDTH - RIGHT_HUD_W} y1={HEADER_H} x2={SVG_WIDTH - RIGHT_HUD_W} y2={SVG_HEIGHT - FOOTER_H} stroke="#CBD5E1" strokeWidth="2" />
                </g>

                <g clipPath="url(#hud-clip)">
                  {computedItems.map((item) => {
                    const pos = getMarkerPos(item, progress);
                    if (pos.rank > safeTopN + 1.5) return null; 
                    
                    const w1 = Math.floor(progress);
                    const w2 = Math.min(w1 + 1, data.periods - 1);
                    const t = progress - w1;
                    const pts1 = getSafePts(item.points, w1);
                    const pts2 = getSafePts(item.points, w2);
                    const smoothedPts = Math.round(lerp(pts1, pts2, easeInOutSine(t))); 
                    
                    return (
                      <g key={`hud-${item.id}`} transform={`translate(${SVG_WIDTH - RIGHT_HUD_W}, ${pos.y})`}>
                        <rect x="30" y={-PILL_H / 2} width={RIGHT_HUD_W - 60} height={PILL_H} fill="#FFFFFF" rx={PILL_R} stroke={item.color} strokeWidth="3" filter="url(#clean-shadow)" />
                        <text x={RIGHT_HUD_W / 2} y="0" dominantBaseline="middle" textAnchor="middle" fill="#0F172A" fontSize={FONT_HUD} fontWeight="900" style={{ fontFamily: 'sans-serif' }}>
                          {smoothedPts}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // TAB 2: EDITOR DATA
  // ============================================================================
  const renderDataEditor = () => {
    return (
      <div className="flex-1 bg-slate-50 overflow-hidden flex flex-col relative" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* === MODAL MAGIC IMPORT === */}
        {showImportModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6" style={{ position: 'absolute', inset: 0, zIndex: 50 }}>
            <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div>
                  <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><ClipboardPaste className="text-emerald-600"/> Import Data Cepat (AI / Excel)</h2>
                  <p className="text-sm text-slate-500 mt-1">Copy tabel dari ChatGPT, Gemini, atau Excel lalu paste ke kotak di bawah ini.</p>
                </div>
                <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-200 hover:bg-slate-300 p-2 rounded-full transition-all">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 flex-1 flex flex-col gap-4 bg-slate-100">
                <div className="bg-white border border-blue-200 rounded-xl p-4 shadow-sm">
                  <h3 className="text-sm font-black text-blue-800 mb-2 flex items-center gap-2">💡 Template Prompt AI (Copy & Paste ke ChatGPT/Gemini)</h3>
                  <textarea 
                    readOnly 
                    className="w-full h-32 p-3 bg-blue-50 text-slate-700 text-xs font-mono rounded-lg border border-blue-200 outline-none resize-none selection:bg-blue-300"
                    value={`Tolong buatkan tabel perkembangan kumulatif data untuk 10 besar [GANTI TOPIK, cth: YouTuber Gaming] selama 12 [GANTI PERIODE, cth: Bulan] terakhir.\nSyarat mutlak:\n1. Kolom 1 = Nama Profil. Kolom 2 dst = Angka periodenya.\n2. Angka WAJIB murni tanpa titik/koma (cth: 1500000).\n3. Langsung berikan tabelnya saja.`}
                  />
                </div>
                <textarea 
                  className="w-full flex-1 min-h-[180px] p-4 rounded-xl border border-slate-300 shadow-inner focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-sm resize-none whitespace-pre overflow-auto"
                  placeholder="Setelah AI membalas, Copy tabelnya dan Paste (Ctrl+V) di sini..."
                  value={importText}
                  onChange={(e) => { setImportText(e.target.value); setImportError(""); }}
                ></textarea>
                {importError && <p className="text-sm text-red-600 font-bold bg-red-50 p-3 rounded border border-red-200">{importError}</p>}
              </div>
              <div className="p-6 border-t border-slate-200 bg-white flex justify-end gap-3">
                <button onClick={() => setShowImportModal(false)} className="px-6 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-all">Batal</button>
                <button onClick={handleImportData} className="px-6 py-2.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-md transition-all flex items-center gap-2">
                  <Database size={18}/> Proses & Timpa Data
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="p-6 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2"><Database className="text-blue-600"/> Data Table Editor</h1>
            <p className="text-sm text-slate-500 mt-1">Input scores/points here. Ranks will be calculated automatically.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowImportModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow transition-all">
              <ClipboardPaste size={18}/> Import Excel / AI
            </button>
            <button onClick={handleAddItem} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow transition-all">
              <Plus size={18}/> Add Row
            </button>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-auto">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-xs text-slate-500 bg-slate-100 uppercase font-black">
                  <tr>
                    <th className="px-4 py-4 sticky left-0 z-20 bg-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Team Profile</th>
                    {Array.from({ length: data.periods }).map((_, i) => {
                      const displayLabel = data.periodPrefix ? `${data.periodPrefix} ${Number(data.startPeriod || 1) + i}` : `${Number(data.startPeriod || 1) + i}`;
                      return (
                        <th key={`th-${i}`} className="px-3 py-4 text-center min-w-[80px]">{displayLabel}</th>
                      );
                    })}
                    <th className="px-4 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {computedItems.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-4 py-3 sticky left-0 z-20 bg-white group-hover:bg-blue-50/80 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                        <div className="flex items-center gap-3">
                          <input type="color" value={item.color} onChange={(e) => handleFieldChange(item.id, 'color', e.target.value)} className="w-8 h-8 rounded border-0 cursor-pointer p-0" title="Team Color" />
                          <div className="space-y-1 w-full max-w-[200px]">
                            <input type="text" value={item.name} onChange={(e) => handleFieldChange(item.id, 'name', e.target.value)} className="w-full p-1.5 border border-slate-200 rounded font-bold text-slate-800 outline-none focus:border-blue-500" placeholder="Name..." />
                            <div className="flex gap-1">
                              <input type="text" value={item.id} onChange={(e) => handleFieldChange(item.id, 'id', e.target.value)} className="w-16 p-1 text-xs border border-slate-200 rounded outline-none focus:border-blue-500 font-mono" placeholder="ID" maxLength={4} title="Short Initials" />
                              <input type="text" value={item.logo || ''} onChange={(e) => handleFieldChange(item.id, 'logo', e.target.value)} className="flex-1 p-1 text-xs border border-slate-200 rounded outline-none focus:border-blue-500 font-mono" placeholder="Logo Image URL" />
                            </div>
                          </div>
                        </div>
                      </td>
                      {Array.from({ length: data.periods }).map((_, wIndex) => (
                        <td key={`td-${item.id}-${wIndex}`} className="px-1 py-3 text-center">
                          <input 
                            type="number" 
                            value={item.points[wIndex] !== undefined ? item.points[wIndex] : ''} 
                            onChange={(e) => handlePointChange(item.id, wIndex, e.target.value)} 
                            className="w-16 p-2 border border-slate-200 rounded text-center font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" 
                          />
                        </td>
                      ))}
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors" title="Delete Row">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // TAB 3: YOUTUBE SEO GENERATOR
  // ============================================================================
  const renderSEO = () => {
    const safeTitle = data.title.replace(/[^a-zA-Z0-9 ]/g, '');
    const baseKeyword = safeTitle.toLowerCase();
    const unit = data.unitLabel.toLowerCase();

    // 🎯 STRATEGI SEO VIDIQ: Generate Top 5 Targeted Keywords secara dinamis
    const topKeywords = [
      `${baseKeyword} ranking`,
      `${baseKeyword} history`,
      `top ${baseKeyword}`,
      `${baseKeyword} ${unit} comparison`,
      `animated bar chart race`
    ];
    const keywordsString = topKeywords.join(', ');
    
    // SEO FOR SHORTS (Kata kunci disuntikkan ke paragraf pertama deskripsi)
    const shortsTitle = `EPIC ${data.title} Final Standings Animation! 🏆 #shorts`;
    const shortsDesc = `The ultimate ${unit} race for ${data.title}! Who came out on top? Watch this satisfying data animation to find out! \n\nWe tracked the ${topKeywords[0]} and ${topKeywords[1]} to show you the true ${topKeywords[2]}.\n\nDrop a comment with your favorite team! 👇\n\n#${safeTitle.replace(/\s+/g, '')} #DataVisualization #Shorts`;
    const shortsTags = `${keywordsString}, data visualization, ${unit} history, #shorts`;

    // SEO FOR LONG VIDEO (Kata kunci disuntikkan ke judul dan deskripsi)
    const longTitle = `Complete ${data.title} Ranking History | ${topKeywords[4].replace(/\b\w/g, l => l.toUpperCase())}`;
    const longDesc = `Witness the dramatic journey of ${data.title}! This ${topKeywords[4]} visualizes the accumulation of ${unit} from the beginning to the end of the period.\n\nIn this video, we analyze the ${topKeywords[0]} and provide a detailed ${topKeywords[3]} so you can see exactly how the ${topKeywords[2]} performed over time.\n\nMake sure to LIKE, COMMENT, and SUBSCRIBE to ${data.footerText} for more awesome data animations!\n\n#DataVisualization #RankingHistory #${safeTitle.replace(/\s+/g, '')}`;
    const longTags = `${keywordsString}, full season animation, data animation, sports statistics, ${unit} progression, animated standings, ${data.footerText.replace('@','')}`;

    return (
      <div className="flex-1 bg-slate-50 p-8 overflow-y-auto" style={{ display: 'flex', flex: 1, overflowY: 'auto' }}>
        <div className="max-w-4xl mx-auto space-y-6 w-full">
          <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-8 text-white shadow-xl flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black flex items-center gap-3"><Video size={36}/> YouTube Metadata Generator</h1>
              <p className="mt-2 text-red-100 text-lg">Optimized with Top 5 Keywords strategy for maximum algorithm reach.</p>
            </div>
          </div>

          {/* BANNER 5 KATA KUNCI UTAMA */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-black text-blue-800 mb-3 flex items-center gap-2">🎯 Top 5 Targeted Keywords (Algorithm Focus)</h2>
            <div className="flex flex-wrap gap-2">
              {topKeywords.map((kw, i) => (
                <span key={i} className="px-3 py-1 bg-white border border-blue-300 text-blue-700 font-bold text-sm rounded-full shadow-sm">
                  {kw}
                </span>
              ))}
            </div>
            <p className="text-xs text-blue-600 mt-3 font-medium">*These keywords are automatically injected into the first two lines of your descriptions and placed first in your tags.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
              <h2 className="text-xl font-black text-slate-800 border-b pb-4">📱 For YouTube Shorts</h2>
              <div>
                <label className="block text-sm font-black text-slate-500 mb-2">Video Title</label>
                <div className="p-4 bg-slate-100 rounded-xl font-bold text-slate-700 border border-slate-200">{shortsTitle}</div>
              </div>
              <div>
                <label className="block text-sm font-black text-slate-500 mb-2">Description (SEO Optimized)</label>
                <textarea readOnly className="w-full p-4 bg-slate-100 rounded-xl font-medium text-slate-600 border border-slate-200 h-40 outline-none resize-none" value={shortsDesc} />
              </div>
              <div>
                <label className="block text-sm font-black text-slate-500 mb-2">Tags</label>
                <textarea readOnly className="w-full p-4 bg-slate-100 rounded-xl font-medium text-slate-600 border border-slate-200 h-24 outline-none resize-none" value={shortsTags} />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
              <h2 className="text-xl font-black text-slate-800 border-b pb-4">🖥️ For Long Video (16:9)</h2>
              <div>
                <label className="block text-sm font-black text-slate-500 mb-2">Video Title</label>
                <div className="p-4 bg-slate-100 rounded-xl font-bold text-slate-700 border border-slate-200">{longTitle}</div>
              </div>
              <div>
                <label className="block text-sm font-black text-slate-500 mb-2">Description (SEO Optimized)</label>
                <textarea readOnly className="w-full p-4 bg-slate-100 rounded-xl font-medium text-slate-600 border border-slate-200 h-40 outline-none resize-none" value={longDesc} />
              </div>
              <div>
                <label className="block text-sm font-black text-slate-500 mb-2">Tags</label>
                <textarea readOnly className="w-full p-4 bg-slate-100 rounded-xl font-medium text-slate-600 border border-slate-200 h-24 outline-none resize-none" value={longTags} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-900 overflow-hidden font-sans" style={{ minHeight: '100vh', width: '100vw', backgroundColor: '#0f172a' }}>
      
      {/* TOP NAVIGATION BAR */}
      <div className="h-16 bg-slate-900 border-b border-slate-800 flex items-center px-6 gap-4 shrink-0 shadow-md z-20">
        <div className="text-white font-black text-xl mr-8 flex items-center gap-2 tracking-tight">
          <MonitorPlay className="text-blue-500"/> CHART<span className="text-blue-500">STUDIO</span>
        </div>
        
        <button onClick={() => setActiveTab('preview')} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'preview' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
          <LayoutTemplate size={18}/> Preview Animasi
        </button>
        <button onClick={() => setActiveTab('editor')} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'editor' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
          <Database size={18}/> Editor Tabel Data
        </button>
        <button onClick={() => setActiveTab('seo')} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'seo' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
          <Video size={18}/> YouTube SEO
        </button>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 flex overflow-hidden" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {activeTab === 'preview' && renderPreview()}
        {activeTab === 'editor' && renderDataEditor()}
        {activeTab === 'seo' && renderSEO()}
      </div>

    </div>
  );
}