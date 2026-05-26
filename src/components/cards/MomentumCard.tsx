'use client';

import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import Card from '@/components/ui/lux-card';
import { MomentumPoint } from '@/lib/types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface MomentumCardProps {
  momentum: MomentumPoint[];
}

export default function MomentumCard({ momentum }: MomentumCardProps) {
  // Sort by over to ensure proper line continuity
  const sorted = [...(momentum || [])].sort((a, b) => a.over - b.over);

  if (sorted.length === 0) {
    return (
      <Card className="col-span-full" delay={0.1}>
        <div className="card-title">
          <span className="icon">◉</span>
          Match Momentum
        </div>
        <div className="flex items-center justify-center h-48 sm:h-64">
          <p className="text-[#4A4945] text-sm">
            Momentum data will appear as the match progresses
          </p>
        </div>
      </Card>
    );
  }

  const labels = sorted.map((m) => `${m.over}`);
  const momentumValues = sorted.map((m) => m.value);

  // Create positive/negative fill data — null where opposite sign, so fills don't overlap
  const positiveFill = sorted.map((m) => m.value > 0 ? m.value : null);
  const negativeFill = sorted.map((m) => m.value < 0 ? m.value : null);

  // For the zero-line fill reference
  const zeroLine = sorted.map(() => 0);

  const data = {
    labels,
    datasets: [
      {
        label: 'Momentum',
        data: momentumValues,
        borderColor: '#FFC300',
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
        spanGaps: true,
        order: 1,
      },
      {
        label: 'Batting Dominant',
        data: positiveFill,
        borderColor: 'transparent',
        backgroundColor: 'rgba(255, 195, 0, 0.08)',
        fill: 'origin',
        tension: 0.3,
        pointRadius: 0,
        borderWidth: 0,
        spanGaps: false,
        order: 2,
      },
      {
        label: 'Bowling Dominant',
        data: negativeFill,
        borderColor: 'transparent',
        backgroundColor: 'rgba(138, 135, 128, 0.05)',
        fill: 'origin',
        tension: 0.3,
        pointRadius: 0,
        borderWidth: 0,
        spanGaps: false,
        order: 3,
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
          color: '#6A6560',
          usePointStyle: true,
          pointStyle: 'line',
          padding: 12,
          font: { size: 9 },
          filter: (item: { text: string }) => item.text === 'Momentum',
        },
      },
      tooltip: {
        backgroundColor: '#08080c',
        titleColor: '#FFC300',
        bodyColor: '#8A8780',
        borderColor: '#1a1a22',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 0,
        callbacks: {
          label: (item: { raw: unknown; dataset: { label: string } }) => {
            if (item.dataset.label !== 'Momentum') return null;
            const val = Number(item.raw);
            if (val > 0) return `Batting dominant: +${val.toFixed(1)}`;
            if (val < 0) return `Bowling dominant: ${val.toFixed(1)}`;
            return 'Even contest';
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.02)' },
        ticks: { color: '#4A4945', font: { size: 9 }, maxTicksLimit: 15 },
      },
      y: {
        grid: {
          color: 'rgba(255,255,255,0.02)',
        },
        ticks: { color: '#4A4945', font: { size: 9 } },
      },
    },
  };

  return (
    <Card className="col-span-full" delay={0.1}>
      <div className="card-title">
        <span className="icon">◉</span>
        Match Momentum
      </div>
      <div className="relative h-48 sm:h-64">
        <Line data={data} options={options} />
      </div>
    </Card>
  );
}
