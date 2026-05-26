'use client';

import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { InningsData } from '@/lib/types';
import ChartWrapper from '@/components/ui/chart-wrapper';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface ManhattanChartProps {
  innings: InningsData;
}

export default function ManhattanChart({ innings }: ManhattanChartProps) {
  const labels = innings.overByOver.map((o) => `${o.over}`);

  const data = {
    labels,
    datasets: [
      {
        label: `${innings.battingTeam} Runs/Over`,
        data: innings.overByOver.map((o) => o.runs),
        backgroundColor: innings.overByOver.map((o) =>
          o.isWicket ? 'rgba(239, 68, 68, 0.8)' : 'rgba(245, 158, 11, 0.8)'
        ),
        borderColor: innings.overByOver.map((o) =>
          o.isWicket ? 'rgba(239, 68, 68, 1)' : 'rgba(245, 158, 11, 1)'
        ),
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#fff',
        titleColor: '#0f172a',
        bodyColor: '#475569',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          title: (items: { label: string }[]) => `Over ${items[0]?.label || ''}`,
          label: (item: { raw: unknown; dataIndex: number }) => {
            const overData = innings.overByOver[item.dataIndex];
            let label = `${item.raw} runs`;
            if (overData?.isWicket) label += ' - WICKET';
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Over', color: '#64748b', font: { size: 12 } },
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 10 }, maxRotation: 0 },
      },
      y: {
        title: { display: true, text: 'Runs', color: '#64748b', font: { size: 12 } },
        grid: { color: 'rgba(0, 0, 0, 0.06)' },
        ticks: { color: '#64748b', font: { size: 11 }, stepSize: 2 },
        beginAtZero: true,
      },
    },
  };

  return (
    <ChartWrapper title="Runs Per Over (Manhattan)">
      <Bar data={data} options={options} />
    </ChartWrapper>
  );
}
