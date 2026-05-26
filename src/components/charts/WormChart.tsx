'use client';

import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { InningsData } from '@/lib/types';
import ChartWrapper from '@/components/ui/chart-wrapper';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface WormChartProps {
  innings1: InningsData;
  innings2: InningsData;
}

export default function WormChart({ innings1, innings2 }: WormChartProps) {
  const maxOvers = Math.max(innings1.overByOver.length, innings2.overByOver.length);
  const labels = Array.from({ length: maxOvers }, (_, i) => `${i + 1}`);

  const data = {
    labels,
    datasets: [
      {
        label: `${innings1.battingTeam} (1st Inn)`,
        data: innings1.overByOver.map((o) => o.cumulative),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 5,
        borderWidth: 2,
      },
      {
        label: `${innings2.battingTeam} (2nd Inn)`,
        data: innings2.overByOver.map((o) => o.cumulative),
        borderColor: 'rgba(245, 158, 11, 1)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 5,
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
          font: { size: 12 },
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
        boxPadding: 4,
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Overs', color: '#64748b', font: { size: 12 } },
        grid: { color: 'rgba(0, 0, 0, 0.06)' },
        ticks: { color: '#64748b', font: { size: 11 } },
      },
      y: {
        title: { display: true, text: 'Cumulative Runs', color: '#64748b', font: { size: 12 } },
        grid: { color: 'rgba(0, 0, 0, 0.06)' },
        ticks: { color: '#64748b', font: { size: 11 } },
      },
    },
  };

  return (
    <ChartWrapper title="Run Progression (Worm)" className="lg:col-span-2">
      <Line data={data} options={options} />
    </ChartWrapper>
  );
}
