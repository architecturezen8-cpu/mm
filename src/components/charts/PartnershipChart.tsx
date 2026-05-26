'use client';

import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { InningsData } from '@/lib/types';
import ChartWrapper from '@/components/ui/chart-wrapper';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface PartnershipChartProps {
  innings1: InningsData;
  innings2: InningsData;
}

export default function PartnershipChart({ innings1, innings2 }: PartnershipChartProps) {
  const maxPartnerships = Math.max(innings1.partnerships.length, innings2.partnerships.length);

  // Create combined labels
  const labels1 = innings1.partnerships.map(
    (p) => `${p.bat1.split(' ').pop()} & ${p.bat2.split(' ').pop()}`
  );
  const labels2 = innings2.partnerships.map(
    (p) => `${p.bat1.split(' ').pop()} & ${p.bat2.split(' ').pop()}`
  );

  const allLabels = Array.from({ length: maxPartnerships }, (_, i) => {
    const l1 = labels1[i] || '';
    const l2 = labels2[i] || '';
    if (l1 && l2) return `${l1} / ${l2}`;
    return l1 || l2;
  });

  const data = {
    labels: allLabels,
    datasets: [
      {
        label: `${innings1.battingTeam} (1st)`,
        data: innings1.partnerships.map((p) => p.runs),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: `${innings2.battingTeam} (2nd)`,
        data: innings2.partnerships.map((p) => p.runs),
        backgroundColor: 'rgba(245, 158, 11, 0.7)',
        borderColor: 'rgba(245, 158, 11, 1)',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#475569',
          usePointStyle: true,
          pointStyle: 'rectRounded',
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
        callbacks: {
          label: (item: { dataset: { label?: string }; raw: unknown; dataIndex: number }) => {
            const innings = item.dataset.label?.includes('1st') ? innings1 : innings2;
            const partnership = innings.partnerships[item.dataIndex];
            return partnership
              ? `${partnership.runs} runs off ${partnership.balls} balls`
              : `${item.raw} runs`;
          },
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Runs', color: '#64748b', font: { size: 12 } },
        grid: { color: 'rgba(0, 0, 0, 0.06)' },
        ticks: { color: '#64748b', font: { size: 11 } },
      },
      y: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 11 } },
      },
    },
  };

  return (
    <ChartWrapper title="Partnership Breakdown">
      <Bar data={data} options={options} />
    </ChartWrapper>
  );
}
