'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, Title);

type AlertItem = {
  soc_level?: string;
  socLevel?: string;
  level?: string;
  [key: string]: unknown;
};

type CountBySocLevel = Record<string, number>;

const DEFAULT_SOC_LEVELS = ['SOC Level 1', 'SOC Level 2', 'SOC Level 3', 'Unknown'];

function normalizeSocLevel(value: unknown): string {
  if (typeof value !== 'string') return 'Unknown';
  const normalized = value.trim();
  if (DEFAULT_SOC_LEVELS.includes(normalized)) return normalized;
  const lower = normalized.toLowerCase();
  if (lower.includes('soc level 1') || lower.includes('level 1')) return 'SOC Level 1';
  if (lower.includes('soc level 2') || lower.includes('level 2')) return 'SOC Level 2';
  if (lower.includes('soc level 3') || lower.includes('level 3')) return 'SOC Level 3';
  return 'Unknown';
}

export default function AlertChart() {
  const [counts, setCounts] = useState<CountBySocLevel>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadAlerts() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('http://127.0.0.1:8000/alerts');
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }
        const bodyText = await res.text();
        let data: unknown;
        try {
          data = JSON.parse(bodyText);
        } catch {
          throw new Error('Invalid JSON response from alerts endpoint');
        }
        if (!Array.isArray(data)) {
          throw new Error('Invalid response format');
        }

        const tally: CountBySocLevel = {
          'SOC Level 1': 0,
          'SOC Level 2': 0,
          'SOC Level 3': 0,
          Unknown: 0,
        };

        data.forEach((item) => {
          if (item && typeof item === 'object') {
            const alertItem = item as AlertItem;
            const socValue = alertItem.soc_level ?? alertItem.socLevel ?? alertItem.level ?? item['soc'];
            const level = normalizeSocLevel(socValue);
            tally[level] = (tally[level] ?? 0) + 1;
          }
        });

        if (!cancelled) {
          setCounts(tally);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load alerts');
          setCounts({});
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAlerts();
    return () => {
      cancelled = true;
    };
  }, []);

  const chartData = useMemo(() => {
    const labels = DEFAULT_SOC_LEVELS;
    const levels = labels.map((label) => counts[label] ?? 0);
    return {
      labels,
      datasets: [
        {
          label: 'Alerts by SOC Level',
          data: levels,
          backgroundColor: ['#22c55e', '#f59e0b', '#ef4444', '#64748b'],
          borderColor: ['#16a34a', '#d97706', '#dc2626', '#475569'],
          borderWidth: 1,
          borderRadius: 8,
          maxBarThickness: 40,
        },
      ],
    };
  }, [counts]);

  return (
    <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-xl shadow-slate-900/30 text-slate-100">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">SOC Distribution</p>
          <h3 className="text-lg font-semibold text-white">Alerts by SOC Level</h3>
        </div>
        <span className="text-xs text-slate-300">Live</span>
      </div>
      <div className="h-56">
        {loading ? (
          <div className="h-full flex items-center justify-center text-slate-300">Loading chart...</div>
        ) : error ? (
          <div className="h-full flex items-center justify-center text-rose-300">{error}</div>
        ) : (
          <Bar
            data={chartData}
            options={{
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false,
                },
                title: {
                  display: false,
                },
              },
              scales: {
                x: {
                  grid: { display: false },
                  ticks: { color: '#cbd5e1' },
                },
                y: {
                  beginAtZero: true,
                  ticks: { color: '#cbd5e1', precision: 0 },
                  grid: { color: '#334155' },
                },
              },
            }}
          />
        )}
      </div>
    </div>
  );
}
