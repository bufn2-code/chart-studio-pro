import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Database, Sliders, Plus, Trash2, Video, LayoutTemplate, MonitorPlay, ClipboardPaste, X, BarChartHorizontal, TrendingUp, Play, Pause, RotateCcw, Calculator } from 'lucide-react';

// ============================================================================
// DATA BAWAAN LENGKAP
// ============================================================================
export const defaultData = {
  title: "TOP 10 YOUTUBERS 2024",
  periodPrefix: "Month",
  startPeriod: 1, 
  periodStep: 1, 
  periods: 12,
  footerText: "@GlobeChart",
  unitLabel: "SUBSCRIBERS",
  labels: [], 
  items: [
    { id: "MRB", name: "MrBeast", color: "#0ea5e9", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/MrBeast_Logo.png/640px-MrBeast_Logo.png", points: [130000000, 135000000, 142000000, 150000000, 160000000, 175000000, 185000000, 195000000, 205000000, 220000000, 240000000, 260000000] },
    { id: "TSR", name: "T-Series", color: "#ef4444", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/T-series-logo.svg/640px-T-series-logo.svg.png", points: [235000000, 237000000, 239000000, 241000000, 243000000, 245000000, 247000000, 249000000, 251000000, 253000000, 255000000, 257000000] },
    { id: "COM", name: "Cocomelon", color: "#10b981", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Cocomelon_logo.svg/640px-Cocomelon_logo.svg.png", points: [152000000, 154000000, 156000000, 158000000, 160000000, 162000000, 164000000, 166000000, 168000000, 170000000, 172000000, 174000000] },
    { id: "SET", name: "SET India", color: "#f59e0b", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/SET_India_logo.png/640px-SET_India_logo.png", points: [150000000, 152000000, 154000000, 155000000, 157000000, 159000000, 161000000, 163000000, 165000000, 167000000, 169000000, 171000000] },
    { id: "KID", name: "Kids Diana", color: "#ec4899", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Kids_Diana_Show_logo.png/640px-Kids_Diana_Show_logo.png", points: [108000000, 110000000, 111000000, 112000000, 113000000, 114000000, 115000000, 116000000, 117000000, 118000000, 119000000, 120000000] }
  ]
};

const getSafePts = (pointsArr, index) => {
  if (!pointsArr || pointsArr.length === 0) return 0;
  let val = index < pointsArr.length ? pointsArr[index] : pointsArr[pointsArr.length - 1]; 
  return parseInt(String(val).replace(/[^0-9-]/g, ''), 10) || 0;
};

const getSafeEmoji = (pointsArr, index) => {
  if (!pointsArr || index >= pointsArr.length) return "";
  const val = String(pointsArr[index]);
  return val.replace(/[0-9-\s.,]/g, '').trim();
};

export default function App() {
  const [data, setData] = useState(defaultData);
  const [activeTab, setActiveTab] = useState('preview'); 
  const [speed, setSpeed] = useState(1);
  const [layout, setLayout] = useState('16:9');
  const [topN, setTopN] = useState(5); 
  const [markerStyle, setMarkerStyle] = useState('both'); 
  const [chartType, setChartType] = useState('bar'); 
  
  const [chartTheme, setChartTheme] = useState('glossy'); 
  const [animStyle, setAnimStyle] = useState('dynamic'); 

  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");
  const [showClearModal, setShowClearModal] = useState(false);
  const [isCumulativeApplied, setIsCumulativeApplied] = useState(false);

  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const reqRef = useRef(null);
  const prevTime = useRef(null);

  const getLabel = (index) => {
    if (data.labels && data.labels[index] !== undefined && data.labels[index].trim() !== "") return data.labels[index];
    const val = Number(data.startPeriod || 1) + (index * Number(data.periodStep || 1));
    return data.periodPrefix ? `${data.periodPrefix} ${val}` : `${val}`;
  };

  const computedItems = useMemo(() => {
    let newItems = JSON.parse(JSON.stringify(data.items));
    newItems.forEach((item, idx) => { item.ranks = []; item.originalIndex = idx; }); 
    for (let w = 0; w < data.periods; w++) {
      let leaderboard = newItems.map(item => ({ originalIndex: item.originalIndex, pts: getSafePts(item.points, w), name: item.name || "" }));
      leaderboard.sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts; 
        if (w > 0) {
          const rankA = newItems[a.originalIndex].ranks[w-1];
          const rankB = newItems[b.originalIndex].ranks[w-1];
          return (rankA || 0) - (rankB || 0);
        }
        return a.name.localeCompare(b.name); 
      });
      leaderboard.forEach((team, index) => { newItems[team.originalIndex].ranks[w] = index + 1; });
    }
    return newItems;
  }, [data.items, data.periods]);

  const animate = (time) => {
    if (prevTime.current === undefined) prevTime.current = time;
    let deltaTime = time - prevTime.current;
    
    // Safety lock untuk mencegah frame meloncat jauh saat browser lag
    if (deltaTime > 100) deltaTime = 16; 

    const progressDelta = (deltaTime / 1000) * (speed * 1.5); 
    
    setProgress((prev) => {
      const next = prev + progressDelta;
      const maxProgress = Math.max(data.periods - 1, 1);
      if (next >= maxProgress) { setIsPlaying(false); return maxProgress; }
      return next;
    });
    
    prevTime.current = time;
    if (isPlaying) reqRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isPlaying) {
      prevTime.current = undefined; 
      reqRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(reqRef.current);
      prevTime.current = undefined;
    }
    return () => cancelAnimationFrame(reqRef.current);
  }, [isPlaying, data.periods, speed]);

  const resetAnimation = () => { setIsPlaying(false); setProgress(0); prevTime.current = undefined; };

  const handleUpdateGeneral = (field, value) => setData(prev => ({ ...prev, [field]: value }));
  const handlePointChange = (index, periodIndex, value) => {
    setData(prev => {
      const newItems = [...prev.items];
      const newPoints = [...newItems[index].points];
      while (newPoints.length < prev.periods) newPoints.push(newPoints[newPoints.length - 1] || 0);
      newPoints[periodIndex] = value;
      newItems[index] = { ...newItems[index], points: newPoints };
      return { ...prev, items: newItems };
    });
  };

  const handleFieldChange = (index, field, value) => {
    setData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  const handleAddItem = () => {
    const newItem = { id: `NEW`, name: "Data Baru", color: "#3B82F6", logo: "", points: Array(data.periods).fill(0) };
    setData(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };
  const handleRemoveItem = (index) => setData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  const handleClearAllData = () => { setData(prev => ({ ...prev, items: [], labels: [] })); setShowClearModal(false); };

  const handleMakeCumulative = () => {
    if (isCumulativeApplied) return;
    setData(prev => {
      const newItems = prev.items.map(item => {
        let runningSum = 0;
        const newPoints = item.points.map(pt => {
          const strPt = String(pt || "");
          const numMatch = strPt.match(/-?\d+/);
          const val = numMatch ? parseInt(numMatch[0], 10) : 0;
          const emoji = strPt.replace(/[0-9-\s.,]/g, '').trim(); 
          runningSum += val; 
          return emoji ? `${runningSum} ${emoji}` : runningSum.toString();
        });
        return { ...item, points: newPoints };
      });
      return { ...prev, items: newItems };
    });
    setIsCumulativeApplied(true);
    setTimeout(() => setIsCumulativeApplied(false), 3000);
  };
  
  const handleImportData = () => {
    try {
      const rows = importText.trim().split('\n');
      const parsedItems = [];
      let detectedPeriods = 0;
      let extractedLabels = [];

      rows.forEach((row, i) => {
        let cleanRow = row.trim();
        if (cleanRow.startsWith('|')) cleanRow = cleanRow.substring(1);
        if (cleanRow.endsWith('|')) cleanRow = cleanRow.substring(0, cleanRow.length - 1);
        const cols = cleanRow.split(/\t|\|/).map(c => c.trim()).filter(c => c !== '');
        
        if (i === 0 && (cols[0].toLowerCase().includes('tim') || cols[0].toLowerCase().includes('nama') || cols[0].toLowerCase().includes('player') || cols[0].toLowerCase().includes('country'))) {
           extractedLabels = cols.slice(1); return;
        }

        if (cols.length < 2 || cols[0].includes('---')) return;

        const name = cols[0];
        const id = (name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase() || 'DAT'); 
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
          let lastVal = "0";
          for (let p = 0; p < newPeriods; p++) {
            if (p < item.rawPoints.length) {
              const val = item.rawPoints[p];
              lastVal = val === "" ? lastVal : val;
            }
            points.push(lastVal);
          }
          return { id: item.id, name: item.name, color: item.color, logo: "", points };
        });
        
        const finalLabels = Array(newPeriods).fill("");
        extractedLabels.forEach((lbl, idx) => { if(idx < newPeriods) finalLabels[idx] = lbl; });

        setData(prev => ({ ...prev, periods: newPeriods, items: finalItems, labels: finalLabels }));
        setShowImportModal(false); setImportText(""); setImportError("");
      } else { setImportError("Format tidak dikenali."); }
    } catch (error) { setImportError("Terjadi kesalahan."); }
  };

  const renderPreview = () => {
    const isVertical = layout === '9:16';
    const SVG_WIDTH = isVertical ? 1080 : 1920; 
    const SVG_HEIGHT = isVertical ? 1920 : 1080; 
    
    const isDarkBg = chartType === 'bar' || chartTheme === 'neon';
    
    const HEADER_H = isVertical ? 160 : 140;
    const FOOTER_H = isVertical ? 140 : 100;
    const X_AXIS_H = isVertical ? 100 : 80; 
    const CHART_Y_START = HEADER_H + X_AXIS_H; 
    const CHART_HEIGHT = SVG_HEIGHT - CHART_Y_START - FOOTER_H; 
    const safeTopN = Math.max(topN, 2); 
    const rowHeight = CHART_HEIGHT / safeTopN; 

    // --- LINE CHART SETUP ---
    const LINE_RIGHT_HUD_W = isVertical ? 240 : 280; 
    const LINE_RANK_X = isVertical ? 80 : 120;       
    const LINE_START_X = isVertical ? 240 : 300;     
    const LINE_CHART_WIDTH = SVG_WIDTH - LINE_START_X - LINE_RIGHT_HUD_W - (isVertical ? 40 : 60); 
    const NODE_OUTER_R = Math.min(rowHeight * 0.4, isVertical ? 45 : 50);
    const NODE_INNER_R = NODE_OUTER_R * 0.85;
    const LINE_WIDTH = Math.max(Math.min(rowHeight * 0.15, 12), 6);
    const FONT_NODE = Math.max(NODE_INNER_R * 0.6, 16); 
    const clipLeftX = LINE_START_X - (NODE_OUTER_R * 2);

    // --- BAR CHART SETUP (DISEMPURNAKAN UNTUK SHORTS) ---
    const effectiveRowHeight = chartType === 'bar' ? Math.min(CHART_HEIGHT / safeTopN, isVertical ? 130 : 110) : rowHeight;
    const BAR_HEIGHT = effectiveRowHeight * 0.65;
    const BAR_LOGO_R = BAR_HEIGHT / 2;
    
    const showLogo = markerStyle === 'logo' || markerStyle === 'both';
    const showName = markerStyle === 'name' || markerStyle === 'both';

    // Jarak margin kiri untuk Bar ditarik jauh agar tulisan tidak pernah kepotong
    const BAR_START_X = isVertical ? 450 : 500; 
    const BAR_MAX_WIDTH = SVG_WIDTH - BAR_START_X - (isVertical ? 220 : 250); 
    
    const totalBarsHeight = safeTopN * effectiveRowHeight;
    const yOffset = chartType === 'bar' ? Math.max(0, (CHART_HEIGHT - totalBarsHeight) / 2) : 0;
    const getY = (rank) => CHART_Y_START + yOffset + ((rank - 0.5) * effectiveRowHeight);
    
    const FONT_RANK = Math.min(effectiveRowHeight * 0.5, isVertical ? 45 : 50);
    const FONT_HUD  = Math.min(rowHeight * 0.5, isVertical ? 40 : 45);
    const FONT_WK   = isVertical ? 30 : 35; 
    
    let baseTitleSize = isVertical ? 45 : 60;
    let FONT_TITLE = baseTitleSize;
    if (data.title.length > 25) FONT_TITLE = baseTitleSize * 0.8;
    if (data.title.length > 35) FONT_TITLE = baseTitleSize * 0.65;
    if (data.title.length > 50) FONT_TITLE = baseTitleSize * 0.5;

    const FONT_FOOT = isVertical ? 30 : 35;
    const PILL_H = Math.min(rowHeight * 0.7, 80);
    const PILL_R = PILL_H / 2;

    const VISIBLE_WEEKS = isVertical ? 4 : 6;
    const activeVisiblePeriods = Math.min(data.periods, VISIBLE_WEEKS);
    const LINE_SPACING = LINE_CHART_WIDTH / Math.max(activeVisiblePeriods - 1, 1);
    const panThreshold = Math.max(1, activeVisiblePeriods - 2); 
    const panX = Math.max(0, progress - panThreshold) * LINE_SPACING;

    // --- EASING FUNGSI ANIMASI ---
    const getEasedT = (t, style) => {
      if (style === 'linear') return t;
      if (style === 'dynamic') return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; 
      return t * t * (3 - 2 * t); 
    };
    const lerp = (start, end, t) => start + (end - start) * t;
    
    const getMarkerPos = (item, currentProgress) => {
      const w1 = Math.floor(currentProgress);
      const w2 = Math.min(w1 + 1, data.periods - 1);
      const t = currentProgress - w1;
      const easedT = getEasedT(t, animStyle); 
      const r1 = item.ranks[w1] || 1;
      const r2 = item.ranks[w2] || 1;
      const lineX = lerp(LINE_START_X + (w1 * LINE_SPACING), LINE_START_X + (w2 * LINE_SPACING), t);

      return { 
        x: chartType === 'line' ? lineX : 0, 
        y: lerp(getY(r1), getY(r2), easedT),
        rank: lerp(r1, r2, easedT),
        val: lerp(getSafePts(item.points, w1), getSafePts(item.points, w2), t) // Note: Line value is strict
      };
    };

    // --- MESIN BAR CHART RACE (RANKING BERKELANJUTAN ANTI LOMPAT) ---
    // Di sini kita menghitung nilai asli setiap frame, lalu menentukan peringkat dinamis
    let currentMaxVal = 1;
    let currentValsForBar = [];
    
    if (chartType === 'bar') {
      const w1 = Math.floor(progress);
      const w2 = Math.min(w1 + 1, data.periods - 1);
      const t = progress - w1;
      const easedT = getEasedT(t, animStyle); 
      
      currentValsForBar = computedItems.map(item => {
        const val = lerp(getSafePts(item.points, w1), getSafePts(item.points, w2), easedT);
        // Tie-breaker halus agar baris tidak pernah menumpuk tumpang tindih 100%
        const valWithTieBreaker = val + ((1000 - item.originalIndex) * 0.000001);
        if (val > currentMaxVal) currentMaxVal = val;
        return { ...item, currentVal: valWithTieBreaker };
      });

      // Margin untuk animasi transisi saling menyalip (1.5% dari nilai tertinggi)
      const swapMargin = Math.max(0.0001, currentMaxVal * 0.015); 
      
      currentValsForBar.forEach(item => {
        let r = 1;
        for (let other of currentValsForBar) {
          if (other.id === item.id) continue;
          const diff = other.currentVal - item.currentVal;
          if (diff > swapMargin) {
            r += 1;
          } else if (diff > -swapMargin) {
            // Smoothstep transisi vertikal saat menyalip!
            const norm = (diff + swapMargin) / (2 * swapMargin);
            r += norm * norm * (3 - 2 * norm);
          }
        }
        item.currentRank = r;
      });
    }

    const formatValue = (val) => new Intl.NumberFormat('en-US').format(Math.round(val));

    return (
      <div className="flex flex-1 overflow-hidden relative">
        {/* PANEL PENGATURAN KIRI */}
        <div className="w-[350px] bg-white border-r border-slate-200 shadow-xl z-10 flex flex-col p-6 overflow-y-auto shrink-0">
          <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2"><Sliders size={20} className="text-blue-600"/> Animation Setup</h2>
          
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <button onClick={() => {
                if (!isPlaying) prevTime.current = undefined; 
                setIsPlaying(!isPlaying);
              }} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-black transition-all shadow-md mb-2">
                {isPlaying ? <Pause size={20} /> : <Play size={20} />} {isPlaying ? 'PAUSE' : 'PLAY'}
              </button>
              <button onClick={resetAnimation} className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-slate-700 py-2 rounded-lg font-bold border border-slate-300">
                <RotateCcw size={16} /> Reset
              </button>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <div className="flex justify-between text-xs mb-2 text-slate-600 font-bold">
                  <span>Progress</span>
                  <span className="text-blue-600">{Math.floor((progress / Math.max((data.periods - 1), 1)) * 100)}%</span>
                </div>
                <input type="range" min="0" max={Math.max(data.periods - 1, 1)} step="0.01" value={progress} onChange={(e) => { setProgress(parseFloat(e.target.value)); setIsPlaying(false); prevTime.current = undefined; }} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
              </div>
              <div className="pt-2">
                <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Kecepatan Video</label>
                <div className="flex gap-2">
                  {[0.5, 1, 1.5, 2].map(s => (
                    <button key={s} onClick={() => setSpeed(s)} className={`flex-1 py-1.5 rounded text-xs font-bold transition-all ${speed === s ? 'bg-blue-600 text-white shadow' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'}`}>{s}x</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">M O D E L &nbsp; G R A F I K</label>
              <div className="flex gap-2">
                <button onClick={() => setChartType('line')} className={`flex-1 py-3 text-xs font-bold rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${chartType === 'line' ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                  <TrendingUp size={20} /> Line Racing
                </button>
                <button onClick={() => setChartType('bar')} className={`flex-1 py-3 text-xs font-bold rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${chartType === 'bar' ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                  <BarChartHorizontal size={20} /> Bar Racing
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Tema Visual</label>
              <div className="flex gap-2">
                <button onClick={() => setChartTheme('flat')} className={`flex-1 py-2 text-[10px] font-bold rounded-lg border transition-all ${chartTheme === 'flat' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Flat</button>
                <button onClick={() => setChartTheme('glossy')} className={`flex-1 py-2 text-[10px] font-bold rounded-lg border transition-all ${chartTheme === 'glossy' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Glossy</button>
                <button onClick={() => setChartTheme('neon')} className={`flex-1 py-2 text-[10px] font-bold rounded-lg border transition-all ${chartTheme === 'neon' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Neon Glow</button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Gaya Animasi</label>
              <div className="flex gap-2">
                <button onClick={() => setAnimStyle('linear')} className={`flex-1 py-2 text-[10px] font-bold rounded-lg border transition-all ${animStyle === 'linear' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Linear</button>
                <button onClick={() => setAnimStyle('smooth')} className={`flex-1 py-2 text-[10px] font-bold rounded-lg border transition-all ${animStyle === 'smooth' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Smooth</button>
                <button onClick={() => setAnimStyle('dynamic')} className={`flex-1 py-2 text-[10px] font-bold rounded-lg border transition-all ${animStyle === 'dynamic' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Dynamic</button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Tampilan Marker</label>
              <div className="flex gap-2">
                <button onClick={() => setMarkerStyle('logo')} className={`flex-1 py-2 text-[10px] font-bold rounded-lg border transition-all ${markerStyle === 'logo' ? 'border-slate-400 bg-slate-100 text-slate-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Logo Saja</button>
                <button onClick={() => setMarkerStyle('name')} className={`flex-1 py-2 text-[10px] font-bold rounded-lg border transition-all ${markerStyle === 'name' ? 'border-slate-400 bg-slate-100 text-slate-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Nama Saja</button>
                <button onClick={() => setMarkerStyle('both')} className={`flex-1 py-2 text-[10px] font-bold rounded-lg border transition-all ${markerStyle === 'both' ? 'border-slate-400 bg-slate-100 text-slate-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Logo + Nama</button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Video Resolution</label>
              <div className="flex gap-2">
                <button onClick={() => setLayout('16:9')} className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${layout === '16:9' ? 'border-slate-400 bg-slate-100 text-slate-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>16:9 (Wide)</button>
                <button onClick={() => setLayout('9:16')} className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${layout === '9:16' ? 'border-slate-400 bg-slate-100 text-slate-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>9:16 (Shorts)</button>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Main Title</label>
                <input type="text" value={data.title} onChange={(e) => handleUpdateGeneral('title', e.target.value)} className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold text-slate-800" />
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Prefix</label>
                  <input type="text" value={data.periodPrefix} onChange={(e) => handleUpdateGeneral('periodPrefix', e.target.value)} className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold text-slate-800" placeholder="Year" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Start Num</label>
                  <input type="number" value={data.startPeriod || 1} onChange={(e) => handleUpdateGeneral('startPeriod', parseInt(e.target.value) || 0)} className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold text-slate-800" placeholder="1930" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1" title="Lompatan (Isi 4 untuk Pildun)">Step (+)</label>
                  <input type="number" value={data.periodStep || 1} onChange={(e) => handleUpdateGeneral('periodStep', parseInt(e.target.value) || 1)} className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold text-slate-800" placeholder="1" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Unit Label</label>
                  <input type="text" value={data.unitLabel} onChange={(e) => handleUpdateGeneral('unitLabel', e.target.value)} className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold text-slate-800" placeholder="PTS" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Total</label>
                  <input type="number" value={data.periods} onChange={(e) => handleUpdateGeneral('periods', parseInt(e.target.value) || 1)} className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold text-slate-800" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-blue-600 uppercase block mb-1">Top N</label>
                  <input type="number" min="2" max={computedItems.length || 2} value={topN} onChange={(e) => setTopN(Math.max(2, Math.min(computedItems.length, Number(e.target.value))))} className="w-full text-sm p-2 bg-blue-50 border border-blue-200 rounded-lg outline-none font-bold text-blue-700" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-slate-900 p-4 md:p-8 flex items-center justify-center overflow-hidden">
          <div className="bg-[#FFFFFF] rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ height: isVertical ? '95%' : '90%', width: isVertical ? 'auto' : '100%', maxWidth: isVertical ? 'none' : '1600px', aspectRatio: isVertical ? '9/16' : '16/9' }}>
            <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
              <defs>
                <rect id="dark-bg" width={SVG_WIDTH} height={SVG_HEIGHT} fill="#0F172A" />
                <filter id="clean-shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="5" stdDeviation="6" floodOpacity="0.15" floodColor="#000000" />
                </filter>
                <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="6" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <linearGradient id="gloss" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                </linearGradient>
                <clipPath id="line-logo-clip"><circle cx="0" cy="0" r={NODE_INNER_R} /></clipPath>
                <clipPath id="bar-logo-clip"><circle cx="0" cy="0" r={BAR_LOGO_R} /></clipPath>
                <clipPath id="header-clip"><rect x={clipLeftX} y={HEADER_H} width={SVG_WIDTH - clipLeftX - LINE_RIGHT_HUD_W} height={X_AXIS_H} /></clipPath>
                <clipPath id="chart-clip"><rect x={clipLeftX} y={CHART_Y_START} width={SVG_WIDTH - clipLeftX - LINE_RIGHT_HUD_W} height={CHART_HEIGHT} /></clipPath>
                <clipPath id="hud-clip"><rect x={SVG_WIDTH - LINE_RIGHT_HUD_W} y={CHART_Y_START} width={LINE_RIGHT_HUD_W} height={CHART_HEIGHT} /></clipPath>
                <clipPath id="reveal-clip"><rect x="-1000" y="-1000" width={1000 + LINE_START_X + (progress * LINE_SPACING)} height="3000" /></clipPath>
              </defs>

              {isDarkBg ? <use href="#dark-bg" /> : <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="#FFFFFF" />}

              <g>
                <rect x="0" y="0" width={SVG_WIDTH} height={HEADER_H} fill={isDarkBg ? '#1E293B' : '#FFCA28'} />
                <rect x="0" y={HEADER_H - 4} width={SVG_WIDTH} height="4" fill="#0F172A" />
                <text x={SVG_WIDTH / 2} y={HEADER_H / 2 + 5} dominantBaseline="middle" textAnchor="middle" fill={isDarkBg ? '#FFFFFF' : '#0F172A'} fontSize={FONT_TITLE} fontWeight="900" letterSpacing="1" style={{ fontFamily: 'sans-serif' }}>{data.title}</text>
                <rect x="0" y={SVG_HEIGHT - FOOTER_H} width={SVG_WIDTH} height={FOOTER_H} fill={isDarkBg ? '#1E293B' : '#FFCA28'} />
                <rect x="0" y={SVG_HEIGHT - FOOTER_H} width={SVG_WIDTH} height="4" fill="#0F172A" />
                <text x={SVG_WIDTH / 2} y={SVG_HEIGHT - (FOOTER_H / 2) + 5} dominantBaseline="middle" textAnchor="middle" fill={isDarkBg ? '#FFFFFF' : '#0F172A'} fontSize={FONT_FOOT} fontWeight="900" letterSpacing="2" style={{ fontFamily: 'sans-serif' }}>{data.footerText}</text>
              </g>

              {/* ========================================================================
                                    MODE 1: RACING LINE CHART
                  ======================================================================== */}
              {chartType === 'line' && (
                <g>
                  {Array.from({ length: safeTopN }).map((_, i) => (
                    <g key={`line-bg-${i}`}>
                      {i % 2 === 0 && <rect x="0" y={getY(i + 1) - (effectiveRowHeight / 2)} width={SVG_WIDTH} height={effectiveRowHeight} fill={isDarkBg ? '#1E293B' : '#F8FAFC'} opacity={isDarkBg ? "0.5" : "1"}/>}
                      <line x1="0" y1={getY(i + 1) + (effectiveRowHeight / 2)} x2={SVG_WIDTH} y2={getY(i + 1) + (effectiveRowHeight / 2)} stroke={isDarkBg ? '#334155' : '#E2E8F0'} strokeWidth="2" />
                      <text x={LINE_RANK_X} y={getY(i + 1)} dominantBaseline="middle" textAnchor="middle" fill={isDarkBg ? '#94A3B8' : '#64748B'} fontSize={FONT_RANK} fontWeight="900" style={{ fontFamily: 'sans-serif' }}>{i + 1}</text>
                    </g>
                  ))}

                  <g clipPath="url(#chart-clip)">
                    <text x={SVG_WIDTH - LINE_RIGHT_HUD_W - 40} y={SVG_HEIGHT - FOOTER_H - 40} textAnchor="end" fill={isDarkBg ? '#334155' : '#CBD5E1'} fontSize={isVertical ? "120" : "220"} fontWeight="900" opacity="0.35" style={{ fontFamily: 'sans-serif', letterSpacing: '-2px' }}>
                      {getLabel(Math.floor(progress))}
                    </text>
                  </g>

                  <g>
                    <rect x="0" y={HEADER_H} width={SVG_WIDTH} height={X_AXIS_H} fill={isDarkBg ? '#0F172A' : '#FFFFFF'} />
                    <line x1="0" y1={CHART_Y_START} x2={SVG_WIDTH} y2={CHART_Y_START} stroke={isDarkBg ? '#334155' : '#CBD5E1'} strokeWidth="2" />
                    <text x={SVG_WIDTH - (LINE_RIGHT_HUD_W / 2)} y={HEADER_H + (X_AXIS_H / 2) + 5} dominantBaseline="middle" textAnchor="middle" fill="#94A3B8" fontSize={FONT_WK} fontWeight="900" letterSpacing="2">{data.unitLabel}</text>
                    <g clipPath="url(#header-clip)">
                      <g transform={`translate(${-panX}, 0)`}>
                        {Array.from({ length: data.periods }).map((_, i) => (
                          <text key={`wk-${i}`} x={LINE_START_X + (i * LINE_SPACING)} y={HEADER_H + (X_AXIS_H / 2) + 5} dominantBaseline="middle" textAnchor="middle" fill={isDarkBg ? '#CBD5E1' : '#64748B'} fontSize={FONT_WK} fontWeight="900">
                            {getLabel(i)}
                          </text>
                        ))}
                      </g>
                    </g>
                  </g>

                  <g clipPath="url(#chart-clip)">
                    <g transform={`translate(${-panX}, 0)`}>
                      {Array.from({ length: data.periods }).map((_, i) => (
                        <line key={`grid-x-${i}`} x1={LINE_START_X + (i * LINE_SPACING)} y1={CHART_Y_START} x2={LINE_START_X + (i * LINE_SPACING)} y2={SVG_HEIGHT - FOOTER_H} stroke={isDarkBg ? '#334155' : '#CBD5E1'} strokeWidth="2" strokeDasharray="6 6" />
                      ))}
                      
                      <g clipPath="url(#reveal-clip)">
                        {computedItems.map((item) => {
                          if (item.ranks.length === 0) return null;
                          let d = `M ${LINE_START_X} ${getY(item.ranks[0] || 1)}`;
                          for (let i = 0; i < data.periods - 1; i++) {
                            const x0 = LINE_START_X + (i * LINE_SPACING), y0 = getY(item.ranks[i] || 1);
                            const x1 = LINE_START_X + ((i+1) * LINE_SPACING), y1 = getY(item.ranks[i+1] || 1);
                            const dx = (x1 - x0) / 2;
                            d += ` C ${x0 + dx} ${y0}, ${x1 - dx} ${y1}, ${x1} ${y1}`;
                          }
                          const applyFilter = chartTheme === 'neon' ? 'url(#neon-glow)' : '';
                          return Math.min(...(item.ranks.length > 0 ? item.ranks : [1])) <= safeTopN && (
                            <path key={`path-${item.id}`} d={d} fill="none" stroke={item.color} strokeWidth={LINE_WIDTH} strokeLinecap="round" strokeLinejoin="round" opacity="0.9" filter={applyFilter} />
                          );
                        })}
                        
                        {computedItems.map((item) => item.points.map((pt, pIdx) => {
                          const emoji = getSafeEmoji(item.points, pIdx);
                          if (!emoji) return null; 
                          return (
                            <g key={`ms-${item.id}-${pIdx}`} transform={`translate(${LINE_START_X + (pIdx * LINE_SPACING)}, ${getY(item.ranks[pIdx] || 1)})`}>
                              <circle r={NODE_OUTER_R * 0.7} fill={isDarkBg ? '#1E293B' : '#FFFFFF'} stroke={item.color} strokeWidth="3" />
                              <text y="2" dominantBaseline="middle" textAnchor="middle" fontSize={NODE_OUTER_R * 0.7}>{emoji}</text>
                            </g>
                          );
                        }))}
                      </g>

                      {computedItems.map((item) => {
                        const pos = getMarkerPos(item, progress);
                        if (pos.rank > safeTopN + 1.5) return null; 
                        const hasLogo = item.logo && item.logo.trim() !== '';
                        const showLogo = markerStyle === 'logo' || markerStyle === 'both';
                        const showName = markerStyle === 'name' || markerStyle === 'both';
                        const applyFilter = chartTheme === 'neon' ? 'url(#neon-glow)' : 'url(#clean-shadow)';
                        
                        return (
                          <g key={`marker-${item.id}`} transform={`translate(${pos.x}, ${pos.y})`}>
                            {showLogo && !showName && (
                              <g>
                                <circle r={NODE_OUTER_R} fill={isDarkBg ? '#0F172A' : '#FFFFFF'} stroke={item.color} strokeWidth={LINE_WIDTH * 0.5} filter={applyFilter} />
                                {hasLogo ? <image href={item.logo} x={-NODE_INNER_R} y={-NODE_INNER_R} height={NODE_INNER_R * 2} width={NODE_INNER_R * 2} clipPath="url(#line-logo-clip)" preserveAspectRatio="xMidYMid slice" /> : <text y="2" dominantBaseline="middle" textAnchor="middle" fill={isDarkBg ? '#FFFFFF' : '#0F172A'} fontSize={FONT_NODE} fontWeight="900" style={{ fontFamily: 'monospace' }}>{item.id}</text>}
                              </g>
                            )}
                            {showName && !showLogo && (
                              <g>
                                <circle r={NODE_OUTER_R} fill={isDarkBg ? '#0F172A' : '#FFFFFF'} stroke={item.color} strokeWidth={LINE_WIDTH * 0.5} filter={applyFilter} />
                                <text y="2" dominantBaseline="middle" textAnchor="middle" fill={isDarkBg ? '#FFFFFF' : '#0F172A'} fontSize={FONT_NODE} fontWeight="900" style={{ fontFamily: 'monospace' }}>{item.id}</text>
                              </g>
                            )}
                            {showLogo && showName && (
                              <g>
                                <rect x={-NODE_OUTER_R} y={-NODE_OUTER_R} width={NODE_OUTER_R * 3.8} height={NODE_OUTER_R * 2} fill={isDarkBg ? '#0F172A' : '#FFFFFF'} rx={NODE_OUTER_R} stroke={item.color} strokeWidth={LINE_WIDTH * 0.5} filter={applyFilter} />
                                {hasLogo ? <image href={item.logo} x={-NODE_INNER_R} y={-NODE_INNER_R} height={NODE_INNER_R * 2} width={NODE_INNER_R * 2} clipPath="url(#line-logo-clip)" preserveAspectRatio="xMidYMid slice" /> : <circle cx="0" cy="0" r={NODE_INNER_R} fill={item.color} />}
                                <text x={NODE_OUTER_R * 1.3} y="2" dominantBaseline="middle" textAnchor="middle" fill={isDarkBg ? '#FFFFFF' : '#0F172A'} fontSize={FONT_NODE * 1.1} fontWeight="900" style={{ fontFamily: 'monospace' }}>{item.id}</text>
                              </g>
                            )}
                          </g>
                        );
                      })}
                    </g>
                  </g>

                  <g>
                    <rect x={SVG_WIDTH - LINE_RIGHT_HUD_W} y={CHART_Y_START} width={LINE_RIGHT_HUD_W} height={CHART_HEIGHT} fill={isDarkBg ? '#1E293B' : '#F8FAFC'} />
                    <line x1={SVG_WIDTH - LINE_RIGHT_HUD_W} y1={HEADER_H} x2={SVG_WIDTH - LINE_RIGHT_HUD_W} y2={SVG_HEIGHT - FOOTER_H} stroke={isDarkBg ? '#334155' : '#CBD5E1'} strokeWidth="2" />
                    <g clipPath="url(#hud-clip)">
                      {computedItems.map((item) => {
                        const pos = getMarkerPos(item, progress);
                        if (pos.rank > safeTopN + 1.5) return null; 
                        const applyFilter = chartTheme === 'neon' ? 'url(#neon-glow)' : 'url(#clean-shadow)';
                        return (
                          <g key={`hud-${item.id}`} transform={`translate(${SVG_WIDTH - LINE_RIGHT_HUD_W}, ${pos.y})`}>
                            <rect x="30" y={-PILL_H / 2} width={LINE_RIGHT_HUD_W - 60} height={PILL_H} fill={isDarkBg ? '#0F172A' : '#FFFFFF'} rx={PILL_R} stroke={item.color} strokeWidth="3" filter={applyFilter} />
                            <text x={LINE_RIGHT_HUD_W / 2} y="0" dominantBaseline="middle" textAnchor="middle" fill={isDarkBg ? '#FFFFFF' : '#0F172A'} fontSize={FONT_HUD} fontWeight="900" style={{ fontFamily: 'sans-serif' }}>
                              {formatValue(pos.val)}
                            </text>
                          </g>
                        );
                      })}
                    </g>
                  </g>
                </g>
              )}

              {/* ========================================================================
                                    MODE 2: BAR CHART RACE (BERSIH & ANTI-TABRAK)
                  ======================================================================== */}
              {chartType === 'bar' && (
                <g>
                  <text x={SVG_WIDTH - 60} y={SVG_HEIGHT - FOOTER_H - 40} textAnchor="end" fill="#334155" fontSize={isVertical ? "120" : "220"} fontWeight="900" opacity="0.35" style={{ fontFamily: 'sans-serif', letterSpacing: '-2px' }}>
                    {getLabel(Math.floor(progress))}
                  </text>
                  <text x={SVG_WIDTH - 60} y={HEADER_H + 40} textAnchor="end" fill="#94A3B8" fontSize={FONT_WK} fontWeight="900" letterSpacing="2">{data.unitLabel}</text>
                  
                  {currentValsForBar.map((item) => {
                    if (item.currentRank > safeTopN + 1) return null; 
                    
                    const hasLogo = item.logo && item.logo.trim() !== '';
                    const barWidth = currentMaxVal === 0 ? 0 : Math.max(10, (item.currentVal / currentMaxVal) * BAR_MAX_WIDTH);
                    const currentEmoji = getSafeEmoji(item.points, Math.floor(progress));

                    // Animasi vertikal saat salip-menyalip (menggunakan ranking desimal yang mulus)
                    const posY = getY(item.currentRank);
                    const barOpacity = item.currentRank > safeTopN ? Math.max(0, 1 - (item.currentRank - safeTopN)) : 1;

                    // Dinamika Marker (Logo/Nama terpisah di luar bar)
                    const showLogo = markerStyle === 'logo' || markerStyle === 'both';
                    const showName = markerStyle === 'name' || markerStyle === 'both';
                    const currentFilter = chartTheme === 'neon' ? 'url(#neon-glow)' : (chartTheme === 'glossy' ? 'url(#clean-shadow)' : '');

                    // Posisi Logo otomatis mundur jika menggunakan nama agar tidak tumpang tindih
                    const textMargin = isVertical ? 220 : 320; 
                    const logoOffset = showName ? -textMargin : -BAR_LOGO_R - 15;

                    return (
                      <g key={`bar-${item.id}`} transform={`translate(${BAR_START_X}, ${posY})`} opacity={barOpacity}>
                        
                        {/* Batang Utama (Bersih) */}
                        <rect x="0" y={-BAR_HEIGHT / 2} width={barWidth} height={BAR_HEIGHT} fill={item.color} rx={BAR_HEIGHT / 4} opacity="0.9" filter={currentFilter} />
                        {chartTheme === 'glossy' && (
                          <rect x="0" y={-BAR_HEIGHT / 2} width={barWidth} height={BAR_HEIGHT} fill="url(#gloss)" rx={BAR_HEIGHT / 4} opacity="0.4" />
                        )}
                        
                        {/* Angka Poin & Emoji (Berjalan mengikuti batang di sebelah Kanan) */}
                        <text x={barWidth + 20} y="3" dominantBaseline="middle" fill={isDarkBg ? '#FFFFFF' : '#0F172A'} fontSize={FONT_NODE * 1.8} fontWeight="900" style={{ fontFamily: 'sans-serif' }}>
                          {formatValue(item.currentVal)} <tspan fontSize={FONT_NODE * 1.5}>{currentEmoji}</tspan>
                        </text>

                        {/* Nama Tim (Terpaku Statis di Kiri) */}
                        {showName && (
                          <text x="-20" y="3" dominantBaseline="middle" textAnchor="end" fill={isDarkBg ? '#FFFFFF' : '#0F172A'} fontSize={FONT_NODE * 1.6} fontWeight="900" style={{ fontFamily: 'sans-serif', filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.5))' }}>
                            {item.name || item.id}
                          </text>
                        )}

                        {/* Logo Bulat (Terpaku Paling Kiri) */}
                        {showLogo && (
                          <g transform={`translate(${logoOffset}, 0)`}>
                            <circle cx="0" cy="0" r={BAR_LOGO_R} fill="#1E293B" stroke={item.color} strokeWidth="4" filter={currentFilter} />
                            {hasLogo ? (
                              <image href={item.logo} x={-BAR_LOGO_R} y={-BAR_LOGO_R} height={BAR_LOGO_R * 2} width={BAR_LOGO_R * 2} clipPath="url(#bar-logo-clip)" preserveAspectRatio="xMidYMid slice" />
                            ) : (
                              <text x="0" y="3" dominantBaseline="middle" textAnchor="middle" fill="#FFFFFF" fontSize={FONT_NODE * 1.5} fontWeight="900">{item.id}</text>
                            )}
                          </g>
                        )}

                      </g>
                    );
                  })}
                </g>
              )}
            </svg>
          </div>
        </div>
      </div>
    );
  };

  const renderDataEditor = () => {
    return (
      <div className="flex-1 bg-slate-50 overflow-hidden flex flex-col relative">
        {showImportModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6">
            <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div>
                  <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><ClipboardPaste className="text-emerald-600"/> Import Data Cepat (AI / Excel)</h2>
                  <p className="text-sm text-slate-500 mt-1">Copy tabel dari ChatGPT, Gemini, atau Excel lalu paste ke kotak di bawah ini.</p>
                </div>
                <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-200 hover:bg-slate-300 p-2 rounded-full transition-all"><X size={20} /></button>
              </div>
              <div className="p-6 flex-1 flex flex-col gap-4 bg-slate-100">
                <div className="bg-white border border-blue-200 rounded-xl p-4 shadow-sm">
                  <h3 className="text-sm font-black text-blue-800 mb-2 flex items-center gap-2">💡 Template Prompt AI (Mendukung Fitur Milestone)</h3>
                  <textarea readOnly className="w-full h-44 p-3 bg-blue-50 text-slate-700 text-xs font-mono rounded-lg border border-blue-200 outline-none resize-none selection:bg-blue-300 leading-relaxed" value={`Berperanlah sebagai peneliti data (Data Researcher) profesional olahraga. Tolong buatkan data historis perkembangan kumulatif untuk 10 Pencetak Gol Terbanyak Sepanjang Masa di Piala Dunia Pria FIFA. Periode yang digunakan adalah setiap edisi Piala Dunia dari tahun 1978 hingga 2022.\n\nSYARAT MUTLAK:\n1. Berikan HANYA dalam bentuk TABEL FORMAT MARKDOWN (menggunakan pemisah garis vertikal | ).\n2. Kolom 1 = Nama Pemain. Kolom 2 dst = Tahun edisi Piala Dunia (1978, 1982, dst hingga 2022).\n3. Isi datanya adalah jumlah GOL KUMULATIF pemain tersebut dari masa ke masa.\n4. Angka WAJIB MURNI tanpa titik atau koma (contoh: 15, BUKAN 15.0).\n5. FITUR MILESTONE: Jika pemain tersebut berhasil membawa negaranya JUARA Piala Dunia di tahun tersebut, tambahkan emoji 🏆 tepat di sebelah angkanya (Contoh: 12 🏆). Jika dia memenangkan Sepatu Emas di tahun itu, tambahkan 🥇 (Contoh: 8 🥇).\n6. Jangan beri teks penjelasan apapun sebelum atau sesudah tabel. Format Markdown murni.`} />
                </div>
                <textarea className="w-full flex-1 min-h-[160px] p-4 rounded-xl border border-slate-300 shadow-inner focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-sm resize-none whitespace-pre overflow-auto" placeholder="Setelah AI membalas, Copy tabelnya dan Paste (Ctrl+V) di sini..." value={importText} onChange={(e) => { setImportText(e.target.value); setImportError(""); }}></textarea>
                {importError && <p className="text-sm text-red-600 font-bold bg-red-50 p-3 rounded border border-red-200">{importError}</p>}
              </div>
              <div className="p-6 border-t border-slate-200 bg-white flex justify-end gap-3">
                <button onClick={() => setShowImportModal(false)} className="px-6 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-all">Batal</button>
                <button onClick={handleImportData} className="px-6 py-2.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-md transition-all flex items-center gap-2"><Database size={18}/> Proses & Timpa Data</button>
              </div>
            </div>
          </div>
        )}

        {showClearModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-slate-200 bg-red-50">
                <h2 className="text-xl font-black text-red-800 flex items-center gap-2"><Trash2 className="text-red-600"/> Kosongkan Semua Data?</h2>
              </div>
              <div className="p-6 bg-slate-50">
                <p className="text-slate-600 font-medium">Tindakan ini akan menghapus semua baris tim beserta angkanya dari tabel. Anda tidak dapat mengembalikan data yang sudah dihapus secara permanen.</p>
              </div>
              <div className="p-6 border-t border-slate-200 bg-white flex justify-end gap-3">
                <button onClick={() => setShowClearModal(false)} className="px-5 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-all">Batal</button>
                <button onClick={handleClearAllData} className="px-5 py-2.5 font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-md transition-all flex items-center gap-2">Ya, Kosongkan</button>
              </div>
            </div>
          </div>
        )}

        <div className="p-6 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2"><Database className="text-blue-600"/> Data Table Editor</h1>
            <p className="text-sm text-slate-500 mt-1">Ketik angka biasa, ATAU ketik Angka dan Emoji (cth: "95 🏆") untuk membuat penanda sejarah!</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleMakeCumulative} className={`${isCumulativeApplied ? 'bg-emerald-500 hover:bg-emerald-600 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'} text-white px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow transition-all`} title="Ubah Angka Per Periode menjadi Jumlah Berjalan (Running Total)"><Calculator size={18}/> {isCumulativeApplied ? 'Sukses!' : 'Kumulatifkan Data'}</button>
            <div className="w-px h-8 bg-slate-300 mx-2 self-center"></div>
            <button onClick={() => setShowClearModal(true)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow transition-all"><Trash2 size={18}/> Kosongkan</button>
            <button onClick={() => setShowImportModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow transition-all"><ClipboardPaste size={18}/> Import Excel / AI</button>
            <button onClick={handleAddItem} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow transition-all"><Plus size={18}/> Add Row</button>
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
                      return (
                        <th key={`th-${i}`} className="px-1 py-2 text-center min-w-[100px]">
                          <input 
                            type="text" 
                            value={data.labels && data.labels[i] ? data.labels[i] : ""} 
                            placeholder={getLabel(i)}
                            onChange={(e) => {
                              const newLabels = [...(data.labels || Array(data.periods).fill(""))];
                              newLabels[i] = e.target.value;
                              handleUpdateGeneral('labels', newLabels);
                            }}
                            className="w-full text-center bg-transparent border-b-2 border-transparent hover:border-slate-300 focus:border-blue-500 outline-none placeholder-slate-400 font-bold text-slate-700 transition-colors"
                            title="Klik untuk ubah tahun manual!"
                          />
                        </th>
                      );
                    })}
                    <th className="px-4 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {computedItems.length > 0 ? computedItems.map((item) => (
                    <tr key={item.originalIndex} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-4 py-3 sticky left-0 z-20 bg-white group-hover:bg-blue-50/80 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                        <div className="flex items-center gap-3">
                          <input type="color" value={item.color} onChange={(e) => handleFieldChange(item.originalIndex, 'color', e.target.value)} className="w-8 h-8 rounded border-0 cursor-pointer p-0" title="Team Color" />
                          <div className="space-y-1 w-full max-w-[200px]">
                            <input type="text" value={item.name} onChange={(e) => handleFieldChange(item.originalIndex, 'name', e.target.value)} className="w-full p-1.5 border border-slate-200 rounded font-bold text-slate-800 outline-none focus:border-blue-500" placeholder="Name..." />
                            <div className="flex gap-1">
                              <input type="text" value={item.id} onChange={(e) => handleFieldChange(item.originalIndex, 'id', e.target.value)} className="w-16 p-1 text-xs border border-slate-200 rounded outline-none focus:border-blue-500 font-mono" placeholder="ID" maxLength={4} title="Short Initials" />
                              <input type="text" value={item.logo || ''} onChange={(e) => handleFieldChange(item.originalIndex, 'logo', e.target.value)} className="flex-1 p-1 text-xs border border-slate-200 rounded outline-none focus:border-blue-500 font-mono" placeholder="Logo Image URL" />
                            </div>
                          </div>
                        </div>
                      </td>
                      {Array.from({ length: data.periods }).map((_, wIndex) => (
                        <td key={`td-${item.originalIndex}-${wIndex}`} className="px-1 py-3 text-center">
                          <input type="text" value={item.points && item.points[wIndex] !== undefined ? item.points[wIndex] : ''} onChange={(e) => handlePointChange(item.originalIndex, wIndex, e.target.value)} className="w-full min-w-[80px] p-2 border border-slate-200 rounded text-center font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" placeholder="Cth: 95 🏆" />
                        </td>
                      ))}
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => handleRemoveItem(item.originalIndex)} className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors" title="Delete Row"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={data.periods + 2} className="px-4 py-16 text-center text-slate-400 font-bold bg-slate-50/50">Tidak ada data yang ditampilkan. Silakan "Import Excel / AI" atau klik "Add Row".</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSEO = () => {
    const safeTitle = data.title.replace(/[^a-zA-Z0-9 ]/g, '');
    const baseKeyword = safeTitle.toLowerCase();
    const unit = data.unitLabel.toLowerCase();

    const topKeywords = [`${baseKeyword} ranking`, `${baseKeyword} history`, `top ${baseKeyword}`, `${baseKeyword} ${unit} comparison`, `animated bar chart race`];
    const keywordsString = topKeywords.join(', ');
    
    const shortsTitle = `EPIC ${data.title} Final Standings Animation! 🏆 #shorts`;
    const shortsDesc = `The ultimate ${unit} race for ${data.title}! Who came out on top? Watch this satisfying data animation to find out! \n\nWe tracked the ${topKeywords[0]} and ${topKeywords[1]} to show you the true ${topKeywords[2]}.\n\nDrop a comment with your favorite team! 👇\n\n#${safeTitle.replace(/\s+/g, '')} #DataVisualization #Shorts`;
    const shortsTags = `${keywordsString}, data visualization, ${unit} history, #shorts`;

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
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-black text-blue-800 mb-3 flex items-center gap-2">🎯 Top 5 Targeted Keywords (Algorithm Focus)</h2>
            <div className="flex flex-wrap gap-2">
              {topKeywords.map((kw, i) => <span key={i} className="px-3 py-1 bg-white border border-blue-300 text-blue-700 font-bold text-sm rounded-full shadow-sm">{kw}</span>)}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
              <h2 className="text-xl font-black text-slate-800 border-b pb-4">📱 For YouTube Shorts</h2>
              <div><label className="block text-sm font-black text-slate-500 mb-2">Video Title</label><div className="p-4 bg-slate-100 rounded-xl font-bold text-slate-700 border border-slate-200">{shortsTitle}</div></div>
              <div><label className="block text-sm font-black text-slate-500 mb-2">Description</label><textarea readOnly className="w-full p-4 bg-slate-100 rounded-xl font-medium text-slate-600 border border-slate-200 h-40 outline-none resize-none" value={shortsDesc} /></div>
              <div><label className="block text-sm font-black text-slate-500 mb-2">Tags</label><textarea readOnly className="w-full p-4 bg-slate-100 rounded-xl font-medium text-slate-600 border border-slate-200 h-24 outline-none resize-none" value={shortsTags} /></div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
              <h2 className="text-xl font-black text-slate-800 border-b pb-4">🖥️ For Long Video (16:9)</h2>
              <div><label className="block text-sm font-black text-slate-500 mb-2">Video Title</label><div className="p-4 bg-slate-100 rounded-xl font-bold text-slate-700 border border-slate-200">{longTitle}</div></div>
              <div><label className="block text-sm font-black text-slate-500 mb-2">Description</label><textarea readOnly className="w-full p-4 bg-slate-100 rounded-xl font-medium text-slate-600 border border-slate-200 h-40 outline-none resize-none" value={longDesc} /></div>
              <div><label className="block text-sm font-black text-slate-500 mb-2">Tags</label><textarea readOnly className="w-full p-4 bg-slate-100 rounded-xl font-medium text-slate-600 border border-slate-200 h-24 outline-none resize-none" value={longTags} /></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-900 overflow-hidden font-sans">
      <div className="h-16 bg-slate-900 border-b border-slate-800 flex items-center px-6 gap-4 shrink-0 shadow-md z-20">
        <div className="text-white font-black text-xl mr-8 flex items-center gap-2">CHART<span className="text-blue-500">STUDIO</span></div>
        <button onClick={() => setActiveTab('preview')} className={`px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 ${activeTab === 'preview' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><LayoutTemplate size={18}/> Preview</button>
        <button onClick={() => setActiveTab('editor')} className={`px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 ${activeTab === 'editor' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><Database size={18}/> Editor</button>
        <button onClick={() => setActiveTab('seo')} className={`px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 ${activeTab === 'seo' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><Video size={18}/> YouTube SEO</button>
      </div>
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'preview' && renderPreview()}
        {activeTab === 'editor' && renderDataEditor()}
        {activeTab === 'seo' && renderSEO()}
      </div>
    </div>
  );
}
