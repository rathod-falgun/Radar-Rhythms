import React, { useMemo } from 'react';

/**
 * GlassGridOverlay — Expanded Glass Tile Grid over the Top-Right of Earth
 * - 40px square glass tiles expanded 1 row higher on top and 2 rows further below
 * - 18-22% visible tiles with backdrop blur, 1px border, and top-left refraction highlight
 * - ~1 in 6 tiles tinted with --orange to simulate warm sunlight refraction
 * - Slow random fade in/out animation (4-7s ease-in-out)
 * - Drifting scan square with orange corner brackets and genuine NISAR metadata label
 */
export default function GlassGridOverlay({ isPaused = false }) {
  const { tiles, numCols, numRows } = useMemo(() => {
    // 9 cols x 10 rows (expanded +1 row top, +2 rows below)
    const cols = 9;
    const rows = 10;

    // Cluster seed points covering upper apex, right curve, and extending down
    const clusterCenters = [
      { u: 0.55, v: 0.12 }, // +1 row on top
      { u: 0.75, v: 0.18 }, // upper right
      { u: 0.45, v: 0.35 }, // upper curve
      { u: 0.78, v: 0.45 }, // middle right
      { u: 0.58, v: 0.68 }, // +2 rows below
      { u: 0.82, v: 0.72 }, // lower right area
    ];

    const pseudoHash = (x, y) => {
      const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      return n - Math.floor(n);
    };

    const generated = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const u = c / (cols - 1);
        const v = r / (rows - 1);

        let minDist = 999;
        for (const center of clusterCenters) {
          const du = u - center.u;
          const dv = v - center.v;
          const d = Math.sqrt(du * du + dv * dv);
          if (d < minDist) minDist = d;
        }

        const clusterWeight = Math.exp(-minDist * minDist / 0.09);
        const probability = clusterWeight * 0.78;
        const rand = pseudoHash(c + 1, r + 1);

        if (rand < probability && probability > 0.12) {
          const tileIndex = generated.length;
          const isOrange = tileIndex % 6 === 2;
          const duration = (4.2 + pseudoHash(c * 3, r * 7) * 2.6).toFixed(2);
          const delay = (pseudoHash(c * 5, r * 11) * 3.5).toFixed(2);

          generated.push({
            id: `tile-${c}-${r}`,
            col: c,
            row: r,
            left: `${(c / cols) * 100}%`,
            top: `${(r / rows) * 100}%`,
            width: `${100 / cols}%`,
            height: `${100 / rows}%`,
            isOrange,
            duration,
            delay,
          });
        }
      }
    }

    return { tiles: generated, numCols: cols, numRows: rows };
  }, []);

  return (
    <div className="relative w-full h-full pointer-events-none select-none overflow-visible">
      {/* 1. Clustered Glass Tiles */}
      {tiles.map((tile) => (
        <div
          key={tile.id}
          className={`absolute p-[1px] ${!isPaused ? 'glass-tile-animate' : ''}`}
          style={{
            left: tile.left,
            top: tile.top,
            width: tile.width,
            height: tile.height,
            '--tile-duration': `${tile.duration}s`,
            '--tile-delay': `${tile.delay}s`,
            animationPlayState: isPaused ? 'paused' : 'running',
          }}
        >
          <div
            className={`w-full h-full rounded-[2px] transition-opacity duration-700 ${
              tile.isOrange
                ? 'bg-[var(--hero-tile-orange)] border border-[var(--hero-tile-orange-border)] shadow-[inset_1px_1px_0_rgba(255,255,255,0.18)]'
                : 'bg-[var(--hero-tile-glass)] border border-[var(--hero-tile-border)] shadow-[inset_1px_1px_0_rgba(255,255,255,0.14)]'
            }`}
            style={{
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              backgroundImage: tile.isOrange
                ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.18) 0%, transparent 60%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.14) 0%, transparent 60%)',
            }}
          />
        </div>
      ))}

      {/* 2. Drifting Scan Square with Orange Corner Brackets */}
      <div
        className={`absolute pointer-events-none ${!isPaused ? 'scan-square-animate' : ''}`}
        style={{
          left: '38%',
          top: '28%',
          animationPlayState: isPaused ? 'paused' : 'running',
        }}
      >
        <div className="relative w-10 h-10 border border-[#fca311]/30 bg-[#fca311]/10 backdrop-blur-[2px]">
          {/* Corner Brackets */}
          <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#fca311]" />
          <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-[#fca311]" />
          <span className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-[#fca311]" />
          <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[#fca311]" />

          {/* Center Point */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-[#fca311] shadow-[0_0_6px_#fca311]" />
          </div>

          {/* Tiny Mono Metadata Label */}
          <div className="absolute left-11 top-1/2 -translate-y-1/2 whitespace-nowrap pl-1">
            <span className="font-mono text-[10px] tracking-widest uppercase text-[#e5e5e5]/70 block leading-tight">
              SCAN · TRACK 019 / FRAME 075
            </span>
            <span className="font-mono text-[8px] tracking-wider text-[#fca311]/80 block">
              NISAR L-BAND · 26.9°N
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
