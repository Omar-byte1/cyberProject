'use client';

import React, { useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

// Standard high-quality topological map of the world
const GEO_URL = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

export type ThreatLocation = {
  country: string;
  count: number;
};

export type WorldMapProps = {
  data: ThreatLocation[];
};

export default function WorldMap({ data }: WorldMapProps) {
  const [tooltipContent, setTooltipContent] = useState('');

  // Normalize data for easy lookup and calculate max threats
  const { countryCounts, maxCount } = useMemo(() => {
    const counts: Record<string, number> = {};
    let max = 0;
    
    data.forEach((item) => {
      // Basic normalization
      let key = item.country.trim();
      
      // Known mismatches matching our custom dataset / IP geo API to TopoJSON properties.name
      const mapping: Record<string, string> = {
        'United States': 'United States of America',
        'USA': 'United States of America',
        'UK': 'United Kingdom',
        'Russia': 'Russia', // Typically matches, but just in case
        'South Korea': 'South Korea',
        // Expand mapping as needed based on the IP geo API output
      };
      
      if (mapping[key]) {
        key = mapping[key];
      }

      counts[key] = (counts[key] || 0) + item.count;
      if (counts[key] > max) {
        max = counts[key];
      }
    });
    
    return { countryCounts: counts, maxCount: max > 0 ? max : 1 };
  }, [data]);

  // Color scale: extremely low -> slate-100, low/medium -> warm gradient -> high -> red
  // We use d3's scaleLinear to compute intermediate colors automatically.
  const colorScale = scaleLinear<string>()
    .domain([0, maxCount / 2, maxCount])
    .range(["#fef3c7", "#f97316", "#ef4444"]); // amber-100 -> orange-500 -> red-500

  return (
    <div className="w-full h-[400px] sm:h-[500px] relative rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-inner">
      {data.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center text-slate-500 font-medium">
          No geographic data available
        </div>
      ) : (
        <>
          <ComposableMap
            projectionConfig={{ scale: 140 }}
            className="w-full h-full"
          >
            <ZoomableGroup center={[0, 0]} zoom={1} minZoom={1} maxZoom={5}>
              <Geographies geography={GEO_URL}>
                {({ geographies }: { geographies: Array<{ rsmKey: string; properties: { name: string } }> }) =>
                  geographies.map((geo) => {
                    const countryName = geo.properties.name;
                    const val = countryCounts[countryName];
                    const fill = val ? colorScale(val) : "#f1f5f9"; // slate-100 for no data
                    
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={fill}
                        stroke="#cbd5e1" // slate-300
                        strokeWidth={0.5}
                        style={{
                          default: { outline: "none", transition: "fill 0.2s ease" },
                          hover: { 
                            fill: val ? "#dc2626" : "#e2e8f0", // red-600 or slate-200 on hover
                            outline: "none", 
                            cursor: "pointer", 
                            transition: "fill 0.1s ease" 
                          },
                          pressed: { outline: "none" }
                        }}
                        onMouseEnter={() => {
                          if (val) {
                            setTooltipContent(`🌍 ${countryName}: ${val} threats`);
                          } else {
                            setTooltipContent(`🌍 ${countryName}: No detected threats`);
                          }
                        }}
                        onMouseLeave={() => {
                          setTooltipContent('');
                        }}
                        data-tooltip-id="world-map-tooltip"
                        data-tooltip-content={tooltipContent}
                      />
                    );
                  })
                }
              </Geographies>
            </ZoomableGroup>
          </ComposableMap>
          
          <Tooltip 
            id="world-map-tooltip" 
            place="top"
            className="z-50 font-bold !bg-slate-900/95 backdrop-blur-sm !text-white !rounded-xl !px-4 !py-3 !text-sm shadow-2xl border border-slate-700/50"
            content={tooltipContent}
            isOpen={!!tooltipContent}
          />

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-lg border border-slate-200/50 text-xs font-bold text-slate-600 flex flex-col gap-2">
            <span className="text-[10px] uppercase tracking-wider text-slate-400">Threat Intensity</span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-100 border border-slate-300"></div>
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
              <span>High ({maxCount > 1 ? `${maxCount}+` : '1+'})</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
