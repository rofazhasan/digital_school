"use client";

import React, { useRef, useEffect, useState } from 'react';
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
  Filler,
  ChartData,
  ChartOptions
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

// Professional Modern Palette (Tailwind-inspired with premium depth)
const MODERN_COLORS = [
  { solid: '#4F46E5', light: 'rgba(79, 70, 229, 0.1)', gradient: ['#4F46E5', '#818CF8'] }, // Indigo
  { solid: '#10B981', light: 'rgba(16, 185, 129, 0.1)', gradient: ['#10B981', '#34D399'] }, // Emerald
  { solid: '#F43F5E', light: 'rgba(244, 63, 94, 0.1)', gradient: ['#F43F5E', '#FB7185'] }, // Rose
  { solid: '#8B5CF6', light: 'rgba(139, 92, 246, 0.1)', gradient: ['#8B5CF6', '#A78BFA'] }, // Violet
  { solid: '#F59E0B', light: 'rgba(245, 158, 11, 0.1)', gradient: ['#F59E0B', '#FBBF24'] }, // Amber
  { solid: '#06B6D4', light: 'rgba(6, 182, 212, 0.1)', gradient: ['#06B6D4', '#22D3EE'] }, // Cyan
];

const PRINT_COLORS = [
  '#000000',
  '#222222',
  '#444444',
  '#666666',
  '#888888',
  '#AAAAAA',
];

export const BeautifulChart: React.FC<ChartProps> = ({
  type,
  data,
  xAxisLabel,
  yAxisLabel,
  title,
  isPrint = false
}) => {
  const chartRef = useRef<any>(null);
  const [gradientData, setGradientData] = useState<ChartData<any> | null>(null);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const ctx = chart.ctx;
    const canvas = chart.canvas;
    const { chartArea } = chart;
    if (!chartArea) return;

    // Create Gradients for a "Professional" depth effect
    const datasets = [
      {
        label: title || 'Data',
        data: data.map(d => d.value),
        borderRadius: type === 'bar' ? 6 : 0,
        backgroundColor: (context: any) => {
          if (isPrint) return type === 'line' ? 'rgba(0,0,0,0.05)' : PRINT_COLORS;
          
          const index = context.dataIndex % MODERN_COLORS.length;
          const config = MODERN_COLORS[index];
          
          if (type === 'line') {
            const grad = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            grad.addColorStop(0, config.light);
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            return grad;
          }

          if (['pie', 'doughnut', 'polarArea'].includes(type) || type === 'bar') {
            const gradients = MODERN_COLORS.map(c => {
              const g = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
              g.addColorStop(0, c.solid);
              g.addColorStop(1, c.gradient[1]);
              return g;
            });
            return type === 'bar' ? gradients[context.dataIndex % gradients.length] : gradients;
          }
          
          return config.solid;
        },
        borderColor: isPrint ? '#000000' : (type === 'line' ? MODERN_COLORS[0].solid : MODERN_COLORS.map(c => c.solid)),
        borderWidth: isPrint ? 2 : (type === 'line' ? 3 : 1),
        pointBackgroundColor: MODERN_COLORS[0].solid,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: type === 'line' ? 4 : 0,
        pointHoverRadius: 6,
        fill: type === 'line',
        tension: 0.4, // Smoother lines
      },
    ];

    setGradientData({
      labels: data.map(d => d.label),
      datasets
    });
  }, [data, title, type, isPrint]);

  const options: ChartOptions<any> = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: isPrint ? 5 : 15
    },
    plugins: {
      legend: {
        display: ['pie', 'doughnut', 'polarArea'].includes(type),
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: {
            size: 11,
            family: "'Inter', sans-serif",
            weight: '500'
          },
          color: isPrint ? '#000' : '#64748b'
        }
      },
      title: {
        display: !!title,
        text: title,
        align: 'start',
        font: {
          size: isPrint ? 14 : 18,
          family: "'Outfit', sans-serif",
          weight: '700'
        },
        color: isPrint ? '#000' : '#1e293b',
        padding: { bottom: 20 }
      },
      tooltip: {
        enabled: !isPrint,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1e293b',
        bodyColor: '#475569',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: (context: any) => ` ${context.dataset.label}: ${context.parsed.y || context.parsed}`
        }
      }
    },
    scales: ['bar', 'line'].includes(type) ? {
      y: {
        beginAtZero: true,
        border: { display: false },
        grid: {
          color: isPrint ? 'rgba(0,0,0,0.1)' : 'rgba(226, 232, 240, 0.6)',
          drawTicks: false
        },
        ticks: {
          padding: 10,
          font: { size: 11, family: "'Inter', sans-serif" },
          color: isPrint ? '#000' : '#94a3b8'
        },
        title: {
          display: !!yAxisLabel,
          text: yAxisLabel,
          font: { weight: '600', size: 11, family: "'Inter', sans-serif" },
          color: isPrint ? '#000' : '#64748b'
        }
      },
      x: {
        border: { display: false },
        grid: { display: false },
        ticks: {
          padding: 10,
          font: { size: 11, family: "'Inter', sans-serif" },
          color: isPrint ? '#000' : '#94a3b8'
        },
        title: {
          display: !!xAxisLabel,
          text: xAxisLabel,
          font: { weight: '600', size: 11, family: "'Inter', sans-serif" },
          color: isPrint ? '#000' : '#64748b'
        }
      }
    } : (type === 'polarArea' ? {
      r: {
        grid: { color: isPrint ? 'rgba(0,0,0,0.1)' : 'rgba(226, 232, 240, 0.6)' },
        ticks: { display: false }
      }
    } : undefined)
  };

  const containerStyle: React.CSSProperties = {
    height: isPrint ? '220px' : '320px',
    width: '100%',
    position: 'relative',
    backgroundColor: isPrint ? '#fff' : 'transparent',
    padding: isPrint ? '0' : '8px',
  };

  const defaultData = {
    labels: data.map(d => d.label),
    datasets: [{
      label: title || 'Data',
      data: data.map(d => d.value),
      backgroundColor: isPrint ? PRINT_COLORS : MODERN_COLORS.map(c => c.solid),
      borderRadius: type === 'bar' ? 6 : 0,
      tension: 0.4,
    }]
  };

  return (
    <div className="beautiful-chart-container" style={containerStyle}>
      {type === 'bar' && <Bar ref={chartRef} data={gradientData || defaultData} options={options} />}
      {type === 'line' && <Line ref={chartRef} data={gradientData || defaultData} options={options} />}
      {type === 'pie' && <Pie ref={chartRef} data={gradientData || defaultData} options={options} />}
      {type === 'doughnut' && <Doughnut ref={chartRef} data={gradientData || defaultData} options={options} />}
      {type === 'polarArea' && <PolarArea ref={chartRef} data={gradientData || defaultData} options={options} />}
    </div>
  );
};
