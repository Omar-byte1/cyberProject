'use client';

import React, { useMemo } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from '@vnedyalk0v/react19-simple-maps';
import { scaleLinear } from 'd3-scale';
import { Tooltip } from 'react-tooltip';
import { useTheme } from 'next-themes';
import 'react-tooltip/dist/react-tooltip.css';

const GEO_URL = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

export type ThreatLocation = {
  country: string;
  count: number;
};

export type WorldMapProps = {
  data: ThreatLocation[];
};

export default function WorldMap({ data }: WorldMapProps) {
  const { theme, resolvedTheme } = useTheme();

  // Utilisation de resolvedTheme qui gère déjà la logique system + theme
  const isDark = resolvedTheme === 'dark';

  const { countryCounts, maxCount } = useMemo(() => {
    const counts: Record<string, number> = {};
    let max = 0;

    data.forEach((item) => {
      let key = item.country.trim();

      const mapping: Record<string, string> = {
        'United States': 'United States of America',
        'USA': 'United States of America',
        'UK': 'United Kingdom',
        'South Korea': 'South Korea',
      };

      if (mapping[key]) key = mapping[key];

      counts[key] = (counts[key] || 0) + item.count;
      if (counts[key] > max) max = counts[key];
    });

    return { countryCounts: counts, maxCount: max > 0 ? max : 1 };
  }, [data]);

  const colorScale = scaleLinear<string>()
    .domain([0, maxCount / 2, maxCount])
    .range(["#fef3c7", "#f97316", "#ef4444"]);

  return (
    <div className="w-full h-[400px] sm:h-[500px] relative rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 shadow-inner">
      {data.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center text-slate-500 font-medium">
          No geographic data available
        </div>
      ) : (
        <>
          <ComposableMap
            projectionConfig={{ scale: 140 }}
            className="w-full h-full outline-none"
          >
            <ZoomableGroup center={[0, 0] as any} zoom={1} minZoom={1} maxZoom={5}>
              <Geographies geography={GEO_URL}>
                {({ geographies }: { geographies: any[] }) =>
                  geographies.map((geo, idx) => {
                    if (!geo.properties) return null;
                    const countryName = geo.properties.name;
                    const val = countryCounts[countryName];
                    const fill = val ? colorScale(val) : (isDark ? "#1e293b" : "#f1f5f9");

                    // Contenu dynamique du tooltip
                    const tooltipText = val
                      ? `🌍 ${countryName}: ${val} threats`
                      : `🌍 ${countryName}: No detected threats`;

                    return (
                      <Geography
                        key={geo.properties.name || idx}
                        geography={geo}
                        fill={fill}
                        stroke={isDark ? "#334155" : "#cbd5e1"}
                        strokeWidth={0.5}
                        // AJOUT DES ATTRIBUTS TOOLTIP ICI
                        data-tooltip-id="world-map-tooltip"
                        data-tooltip-content={tooltipText}
                        style={{
                          default: { outline: "none", transition: "all 0.2s ease" },
                          hover: {
                            fill: val ? "#dc2626" : (isDark ? "#334155" : "#e2e8f0"),
                            outline: "none",
                            cursor: "pointer"
                          },
                          pressed: { outline: "none" }
                        }}
                      />
                    );
                  })
                }
              </Geographies>
            </ZoomableGroup>
          </ComposableMap>

          {/* CONFIGURATION SIMPLIFIÉE DE LA TOOLTIP */}
          <Tooltip
            id="world-map-tooltip"
            className="z-50 font-bold !bg-slate-900/95 backdrop-blur-sm !text-white !rounded-xl !px-4 !py-3 !text-sm shadow-2xl border border-slate-700/50"
          />

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-3 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 text-xs font-bold text-slate-600 dark:text-slate-300 flex flex-col gap-2">
            <span className="text-[10px] uppercase tracking-wider text-slate-400">Threat Intensity</span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"></div>
              <span>None</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-100"></div>
              <span>Low</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>High ({maxCount > 0 ? maxCount : 1}+)</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}