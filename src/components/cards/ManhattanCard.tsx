'use client';

import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import Card from '@/components/ui/lux-card';
import { InningsData } from '@/lib/types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface ManhattanCardProps {
  innings1: InningsData;
  innings2: InningsData;
  selectedInnings?: 1 | 2;
}

export default function ManhattanCard({ innings1, innings2, selectedInnings }: ManhattanCardProps) {
  // Check if 2nd innings has any over data
  const hasInnings2Data = innings2?.overByOver && innings2.overByOver.length > 0;
  // Show comparison mode only when both innings have data AND no specific innings is selected
  const isComparison = hasInnings2Data && !selectedInnings;

  // Determine which innings to show based on selection
  const primaryInnings = selectedInnings === 2 ? innings2 : innings1;
  const secondaryInnings = selectedInnings === 2 ? innings1 : innings2;

  // Check if primary innings has over-by-over data
  const hasOverData = primaryInnings?.overByOver && primaryInnings.overByOver.length > 0;

  if (!hasOverData) {
    return (
      <Card className="col-span-full" delay={0.1}>
        <div className="card-title">
          <span className="icon">◧</span>
          Manhattan — Runs per Over
        </div>
        <div className="flex items-center justify-center h-56 sm:h-72">
          <p className="text-[#4A4945] text-sm">
            Over-by-over data not available for this innings
          </p>
        </div>
      </Card>
    );
  }

  const maxOvers = isComparison
    ? Math.max(innings1.overByOver.length, innings2.overByOver.length)
    : primaryInnings.overByOver.length;
  const labels = Array.from({ length: maxOvers }, (_, i) => `${i + 1}`);

  const datasets = [
    {
      label: `${primaryInnings.battingTeam}`,
      data: primaryInnings.overByOver.map((o) => o.runs),
      backgroundColor: primaryInnings.overByOver.map((o) =>
        o.isWicket ? 'rgba(192, 112, 96, 0.6)' : 'rgba(255, 195, 0, 0.4)'
      ),
      borderColor: primaryInnings.overByOver.map((o) =>
        o.isWicket ? 'rgba(192, 112, 96, 1)' : 'rgba(255, 195, 0, 0.7)'
      ),
      borderWidth: 1,
      borderRadius: 0,
    },
  ];

  if (isComparison) {
    datasets.push({
      label: `${innings2.battingTeam}`,
      data: innings2.overByOver.map((o) => o.runs),
      backgroundColor: innings2.overByOver.map((o) =>
        o.isWicket ? 'rgba(192, 112, 96, 0.6)' : 'rgba(230, 57, 70, 0.4)'
      ),
      borderColor: innings2.overByOver.map((o) =>
        o.isWicket ? 'rgba(192, 112, 96, 1)' : 'rgba(230, 57, 70, 0.7)'
      ),
      borderWidth: 1,
      borderRadius: 0,
    });
  }

  const data = { labels, datasets };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: { color: '#4A4945', usePointStyle: true, padding: 12, font: { size: 9 } },
      },
      tooltip: {
        backgroundColor: '#08080c',
        titleColor: '#FFC300',
        bodyColor: '#8A8780',
        borderColor: '#1a1a22',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 0,
        titleFont: { size: 10, weight: '600' as const },
        bodyFont: { size: 10 },
        callbacks: {
          title: (items: { label: string }[]) => `Over ${items[0]?.label || ''}`,
          label: (item: { raw: unknown; datasetIndex: number; dataIndex: number }) => {
            const inningsData = item.datasetIndex === 0 ? primaryInnings : (isComparison ? innings2 : primaryInnings);
            const overData = inningsData?.overByOver?.[item.dataIndex];
            let label = `${item.raw} runs`;
            if (overData?.isWicket) label += ' — WICKET';
            return label;
          },
        },
      },
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.02)' }, ticks: { color: '#4A4945', font: { size: 8 }, maxRotation: 0, maxTicksLimit: 20 } },
      y: { grid: { color: 'rgba(255,255,255,0.02)' }, ticks: { color: '#4A4945', font: { size: 9 } }, beginAtZero: true },
    },
  };

  return (
    <Card className="col-span-full" delay={0.1}>
      <div className="card-title">
        <span className="icon">◧</span>
        Manhattan — Runs per Over {isComparison ? '(Comparison)' : `— ${primaryInnings.battingTeam}`}
      </div>
      <div className="relative h-56 sm:h-72">
        <Bar data={data} options={options} />
      </div>
    </Card>
  );
}
