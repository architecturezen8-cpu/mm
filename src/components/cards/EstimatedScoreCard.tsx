'use client';

import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import Card from '@/components/ui/lux-card';
import { InningsData } from '@/lib/types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface EstimatedScoreCardProps {
  innings: InningsData;
}

export default function EstimatedScoreCard({ innings }: EstimatedScoreCardProps) {
  const hasOverData = innings?.overByOver && innings.overByOver.length > 0;

  if (!hasOverData) {
    return (
      <Card delay={0.2}>
        <div className="card-title">
          <span className="icon">◇</span>
          Estimated Score Projection
        </div>
        <div className="flex items-center justify-center h-44 sm:h-56">
          <p className="text-[#4A4945] text-sm">
            Over-by-over data not available for this innings
          </p>
        </div>
      </Card>
    );
  }

  const totalOvers = innings?.maxOvers || 50;
  const currentOver = innings.overByOver.length;
  const lastOver = innings.overByOver[innings.overByOver.length - 1];
  const crr = lastOver?.crr || 6;
  const currentScore = lastOver?.cumulative || 0;

  const projectionData: (number | null)[] = [];
  const upperBound: (number | null)[] = [];
  const lowerBound: (number | null)[] = [];
  const actualData: (number | null)[] = [];

  for (let i = 1; i <= totalOvers; i++) {
    if (i <= currentOver) {
      const over = innings.overByOver.find(o => o.over === i);
      actualData.push(over?.cumulative || null);
      projectionData.push(null);
      upperBound.push(null);
      lowerBound.push(null);
    } else {
      actualData.push(null);
      const projected = currentScore + crr * (i - currentOver);
      projectionData.push(Math.round(projected));
      upperBound.push(Math.round(projected * 1.1));
      lowerBound.push(Math.round(projected * 0.9));
    }
  }

  const labels = Array.from({ length: totalOvers }, (_, i) => `${i + 1}`);

  const data = {
    labels,
    datasets: [
      {
        label: 'Actual',
        data: actualData,
        borderColor: '#FFC300',
        backgroundColor: 'rgba(255, 195, 0, 0.03)',
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        borderWidth: 1.5,
      },
      {
        label: 'Projected',
        data: projectionData,
        borderColor: 'rgba(255, 195, 0, 0.35)',
        borderDash: [4, 4],
        tension: 0.3,
        pointRadius: 0,
        borderWidth: 1,
      },
      {
        label: 'Upper',
        data: upperBound,
        borderColor: 'transparent',
        backgroundColor: 'rgba(255, 195, 0, 0.02)',
        fill: '+1',
        tension: 0.3,
        pointRadius: 0,
        borderWidth: 0,
      },
      {
        label: 'Lower',
        data: lowerBound,
        borderColor: 'transparent',
        backgroundColor: 'transparent',
        tension: 0.3,
        pointRadius: 0,
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#4A4945',
          usePointStyle: true,
          padding: 10,
          font: { size: 9 },
          filter: (item: { text: string }) => !['Upper', 'Lower'].includes(item.text),
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
      },
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.02)' }, ticks: { color: '#4A4945', font: { size: 9 }, maxTicksLimit: 15 } },
      y: { grid: { color: 'rgba(255,255,255,0.02)' }, ticks: { color: '#4A4945', font: { size: 9 } } },
    },
  };

  return (
    <Card delay={0.2}>
      <div className="card-title">
        <span className="icon">◇</span>
        Estimated Score Projection
      </div>
      <div className="relative h-44 sm:h-56">
        <Line data={data} options={options} />
      </div>
    </Card>
  );
}
