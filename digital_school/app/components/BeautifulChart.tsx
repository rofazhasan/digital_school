"use client";

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  Filler
} from 'chart.js';
import { Bar, Line, Pie, Doughnut, PolarArea } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  Filler
);

interface ChartProps {
  type: 'bar' | 'line' | 'pie' | 'doughnut' | 'polarArea';
  data: { label: string; value: number }[];
  xAxisLabel?: string;
  yAxisLabel?: string;
  title?: string;
  isPrint?: boolean;
}

const colors = [
  'rgba(99, 102, 241, 0.7)',
  'rgba(168, 85, 247, 0.7)',
  'rgba(236, 72, 153, 0.7)',
  'rgba(244, 63, 94, 0.7)',
  'rgba(249, 115, 22, 0.7)',
  'rgba(16, 185, 129, 0.7)',
];

const printColors = [
  'rgba(0, 0, 0, 0.7)',
  'rgba(30, 30, 30, 0.7)',
  'rgba(60, 60, 60, 0.7)',
  'rgba(90, 90, 100, 0.7)',
  'rgba(120, 120, 120, 0.7)',
  'rgba(150, 150, 150, 0.7)',
  'rgba(180, 180, 180, 0.7)',
];

export const BeautifulChart: React.FC<ChartProps> = ({
  type,
  data,
  xAxisLabel,
  yAxisLabel,
  title,
  isPrint = false
}) => {
  const chartData = {
    labels: data.map(d => d.label),
    datasets: [
      {
        label: title || 'Data',
        data: data.map(d => d.value),
        backgroundColor: isPrint ? (type === 'line' ? 'rgba(0,0,0,0.1)' : printColors) : (type === 'line' ? 'rgba(99, 102, 241, 0.2)' : colors),
        borderColor: isPrint ? 'rgba(0, 0, 0, 1)' : colors.map(c => c.replace('0.7', '1')),
        borderWidth: isPrint ? 2 : 1,
        fill: type === 'line',
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: isPrint ? false : true,
    plugins: {
      legend: {
        display: ['pie', 'doughnut', 'polarArea'].includes(type),
        position: 'bottom' as const,
        labels: {
          font: { 
            size: isPrint ? 10 : 12,
            weight: isPrint ? 'bold' : 'normal'
          },
          color: isPrint ? '#000' : undefined,
          boxWidth: 10,
        }
      },
      title: {
        display: !!title,
        text: title,
        font: {
          size: isPrint ? 14 : 16,
          weight: 'bold'
        },
        color: isPrint ? '#000' : undefined
      },
      tooltip: {
        enabled: !isPrint
      }
    },
    scales: ['bar', 'line'].includes(type) ? {
      y: {
        beginAtZero: true,
        grid: {
          color: isPrint ? 'rgba(0,0,0,0.1)' : undefined
        },
        title: {
          display: !!yAxisLabel,
          text: yAxisLabel,
          font: { weight: 'bold', size: isPrint ? 10 : 12 },
          color: isPrint ? '#000' : undefined
        },
        ticks: { color: isPrint ? '#000' : undefined, font: { size: isPrint ? 9 : 11 } }
      },
      x: {
        grid: {
          display: false
        },
        title: {
          display: !!xAxisLabel,
          text: xAxisLabel,
          font: { weight: 'bold', size: isPrint ? 10 : 12 },
          color: isPrint ? '#000' : undefined
        },
        ticks: { color: isPrint ? '#000' : undefined, font: { size: isPrint ? 9 : 11 } }
      }
    } : (type === 'polarArea' ? {
      r: {
        grid: { color: isPrint ? 'rgba(0,0,0,0.1)' : undefined },
        ticks: { display: false }
      }
    } : undefined)
  };

  const containerStyle: React.CSSProperties = {
    height: isPrint ? (['pie', 'doughnut'].includes(type) ? '200px' : '220px') : '300px',
    width: '100%',
    maxWidth: isPrint ? (['pie', 'doughnut'].includes(type) ? '300px' : '500px') : '100%',
    margin: '0 auto',
    padding: '8px',
    backgroundColor: isPrint ? '#fff' : 'transparent',
    borderRadius: '8px',
  };

  return (
    <div className="beautiful-chart-container" style={containerStyle}>
      {type === 'bar' && <Bar data={chartData} options={options as any} />}
      {type === 'line' && <Line data={chartData} options={options as any} />}
      {type === 'pie' && <Pie data={chartData} options={options as any} />}
      {type === 'doughnut' && <Doughnut data={chartData} options={options as any} />}
      {type === 'polarArea' && <PolarArea data={chartData} options={options as any} />}
    </div>
  );
};
