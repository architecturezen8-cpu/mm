'use client';

import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import Card from '@/components/ui/lux-card';
import { LiveState } from '@/lib/types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface PartnershipProgressCardProps {
  liveState: LiveState;
}

export default function PartnershipProgressCard({ liveState }: PartnershipProgressCardProps) {
  const partnership = liveState.partnership;

  // Guard: if no partnership data (balls=0 or missing), show placeholder
  if (!partnership || !partnership.balls || partnership.balls <= 0) {
    return (
      <Card delay={0.3}>
        <div className="card-title">
          <span className="icon">◇</span>
          Partnership Progress
        </div>
        <div className="flex items-center justify-center h-44 sm:h-56">
          <p className="text-[#4A4945] text-sm">
            Partnership data not available yet
          </p>
        </div>
      </Card>
    );
  }

  const overs = Math.ceil(partnership.balls / 6);
  const labels = Array.from({ length: overs }, (_, i) => `${i + 1}`);

  const bat1Rate = partnership.bat1Runs / partnership.balls;
  const bat2Rate = partnership.bat2Runs / partnership.balls;
  let remaining = partnership.balls;
  const bat1PerOver: number[] = [];
  const bat2PerOver: number[] = [];

  for (let i = 0; i < overs; i++) {
    const ballsThisOver = Math.min(6, remaining);
    remaining -= ballsThisOver;
    bat1PerOver.push(Math.round(bat1Rate * ballsThisOver));
    bat2PerOver.push(Math.round(bat2Rate * ballsThisOver));
  }

  const data = {
    labels,
    datasets: [
      {
        label: partnership.bat1Name,
        data: bat1PerOver,
        backgroundColor: 'rgba(255, 195, 0, 0.4)',
        borderColor: 'rgba(255, 195, 0, 0.7)',
        borderWidth: 1,
        borderRadius: 0,
      },
      {
        label: partnership.bat2Name,
        data: bat2PerOver,
        backgroundColor: 'rgba(138, 135, 128, 0.25)',
        borderColor: 'rgba(138, 135, 128, 0.5)',
        borderWidth: 1,
        borderRadius: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: '#4A4945', usePointStyle: true, pointStyle: 'rect', padding: 10, font: { size: 9 } },
      },
      tooltip: {
        backgroundColor: '#08080c',
        titleColor: '#FFC300',
        bodyColor: '#8A8780',
        borderColor: '#1a1a22',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 0,
      },
    },
    scales: {
      x: { stacked: true, grid: { color: 'rgba(255,255,255,0.02)' }, ticks: { color: '#4A4945', font: { size: 9 } } },
      y: { stacked: true, grid: { color: 'rgba(255,255,255,0.02)' }, ticks: { color: '#4A4945', font: { size: 9 } }, beginAtZero: true },
    },
  };

  return (
    <Card delay={0.3}>
      <div className="card-title">
        <span className="icon">◇</span>
        Partnership Progress
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mb-3 sm:mb-4 text-[9px] sm:text-[10px] uppercase tracking-[2px]">
        <span className="text-text-muted">Total: <span className="text-gold font-medium">{partnership.runs}</span></span>
        <span className="text-lux-border hidden sm:inline">—</span>
        <span className="text-text-muted">{partnership.bat1Name}: <span className="text-gold font-medium">{partnership.bat1Runs}</span></span>
        <span className="text-lux-border hidden sm:inline">—</span>
        <span className="text-text-muted">{partnership.bat2Name}: <span className="text-text-secondary font-medium">{partnership.bat2Runs}</span></span>
      </div>
      <div className="relative h-44 sm:h-56">
        <Bar data={data} options={options} />
      </div>
    </Card>
  );
}
