'use client';

import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import Card from '@/components/ui/lux-card';
import { InningsData } from '@/lib/types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface RunRateChartProps {
  innings1: InningsData;
  innings2: InningsData;
  selectedInnings?: 1 | 2;
}

export default function RunRateChart({ innings1, innings2, selectedInnings }: RunRateChartProps) {
  // Check if 2nd innings has any over data
  const hasInnings2Data = innings2?.overByOver && innings2.overByOver.length > 0;
  // Show comparison mode only when both innings have data AND no specific innings is selected
  const isComparison = hasInnings2Data && !selectedInnings;

  // Determine primary innings based on selection
  const primaryInnings = selectedInnings === 2 ? innings2 : innings1;

  // Check if primary innings has over-by-over data
  const hasOverData = primaryInnings?.overByOver && primaryInnings.overByOver.length > 0;

  if (!hasOverData) {
    return (
      <Card delay={0.15}>
        <div className="card-title">
          <span className="icon">◎</span>
          Run Rate Flow
        </div>
        <div className="flex items-center justify-center h-48 sm:h-64">
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

  const datasets: Record<string, unknown>[] = [
    {
      label: `CRR — ${primaryInnings.battingTeam}`,
      data: primaryInnings.overByOver.map((o) => o.crr),
      borderColor: '#FFC300',
      backgroundColor: 'rgba(255, 195, 0, 0.04)',
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 3,
      borderWidth: 1.5,
    },
  ];

  if (isComparison) {
    const target = innings1.totalRuns + 1;
    const maxOvers2 = innings2.maxOvers || 20;
    const rrrData = innings2.overByOver.map((o) => {
      const ballsBowled = o.over * 6;
      const remainingBalls = maxOvers2 * 6 - ballsBowled;
      if (remainingBalls <= 0) return null;
      const remainingRuns = target - o.cumulative;
      if (remainingRuns <= 0) return 0;
      return (remainingRuns / remainingBalls) * 6;
    });

    datasets.push({
      label: `CRR — ${innings2.battingTeam}`,
      data: innings2.overByOver.map((o) => o.crr),
      borderColor: '#E63946',
      backgroundColor: 'rgba(230, 57, 70, 0.04)',
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 3,
      borderWidth: 1.5,
    });

    datasets.push({
      label: `RRR — ${innings2.battingTeam}`,
      data: rrrData,
      borderColor: 'rgba(138, 135, 128, 0.5)',
      backgroundColor: 'transparent',
      borderDash: [4, 4],
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 3,
      borderWidth: 1,
    });
  }

  // If selected innings is 2nd, also add RRR line
  if (selectedInnings === 2 && hasInnings2Data) {
    const target = innings1.totalRuns + 1;
    const maxOvers2 = innings2.maxOvers || 20;
    const rrrData = innings2.overByOver.map((o) => {
      const ballsBowled = o.over * 6;
      const remainingBalls = maxOvers2 * 6 - ballsBowled;
      if (remainingBalls <= 0) return null;
      const remainingRuns = target - o.cumulative;
      if (remainingRuns <= 0) return 0;
      return (remainingRuns / remainingBalls) * 6;
    });

    datasets.push({
      label: `RRR — ${innings2.battingTeam}`,
      data: rrrData,
      borderColor: 'rgba(138, 135, 128, 0.5)',
      backgroundColor: 'transparent',
      borderDash: [4, 4],
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 3,
      borderWidth: 1,
    });
  }

  const data = { labels, datasets };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: '#4A4945', usePointStyle: true, pointStyle: 'line', padding: 12, font: { size: 9 } },
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
    <Card delay={0.15}>
      <div className="card-title">
        <span className="icon">◎</span>
        Run Rate Flow {isComparison ? '' : `— ${primaryInnings.battingTeam}`}
      </div>
      <div className="relative h-48 sm:h-64">
        <Line data={data} options={options} />
      </div>
    </Card>
  );
}
