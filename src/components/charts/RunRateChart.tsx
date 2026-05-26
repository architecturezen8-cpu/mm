'use client';

import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { InningsData } from '@/lib/types';
import { oversToBalls } from '@/lib/utils';
import ChartWrapper from '@/components/ui/chart-wrapper';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface RunRateChartProps {
  innings1: InningsData;
  innings2: InningsData;
}

export default function RunRateChart({ innings1, innings2 }: RunRateChartProps) {
  const maxOvers = Math.max(innings1.overByOver.length, innings2.overByOver.length);
  const labels = Array.from({ length: maxOvers }, (_, i) => `${i + 1}`);

  // Calculate RRR for 2nd innings
  const target = innings1.totalRuns + 1;
  const rrrData = innings2.overByOver.map((o) => {
    const ballsBowled = o.over * 6;
    const remainingBalls = innings2.maxOvers * 6 - ballsBowled;
    if (remainingBalls <= 0) return null;
    const remainingRuns = target - o.cumulative;
    if (remainingRuns <= 0) return 0;
    return (remainingRuns / remainingBalls) * 6;
  });

  const data = {
    labels,
    datasets: [
      {
        label: `CRR - ${innings1.battingTeam} (1st)`,
        data: innings1.overByOver.map((o) => o.crr),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'transparent',
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
      },
      {
        label: `CRR - ${innings2.battingTeam} (2nd)`,
        data: innings2.overByOver.map((o) => o.crr),
        borderColor: 'rgba(245, 158, 11, 1)',
        backgroundColor: 'transparent',
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
      },
      {
        label: `RRR - ${innings2.battingTeam} (2nd)`,
        data: rrrData,
        borderColor: 'rgba(239, 68, 68, 0.8)',
        backgroundColor: 'transparent',
        borderDash: [6, 4],
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#475569',
          usePointStyle: true,
          pointStyle: 'line',
          padding: 16,
          font: { size: 11 },
        },
      },
      tooltip: {
        backgroundColor: '#fff',
        titleColor: '#0f172a',
        bodyColor: '#475569',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Overs', color: '#64748b', font: { size: 12 } },
        grid: { color: 'rgba(0, 0, 0, 0.06)' },
        ticks: { color: '#64748b', font: { size: 11 } },
      },
      y: {
        title: { display: true, text: 'Run Rate', color: '#64748b', font: { size: 12 } },
        grid: { color: 'rgba(0, 0, 0, 0.06)' },
        ticks: { color: '#64748b', font: { size: 11 } },
      },
    },
  };

  return (
    <ChartWrapper title="Run Rate Trend">
      <Line data={data} options={options} />
    </ChartWrapper>
  );
}
