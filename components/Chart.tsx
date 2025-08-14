'use client';

import React, { useEffect, useRef } from 'react';
import { ApexOptions } from 'apexcharts';

// Correct type for ApexCharts instance
type ApexChartsInstance = {
  render: () => void;
  destroy: () => void;
  updateOptions: (options: ApexOptions, redraw?: boolean, animate?: boolean) => void;
  // Add other methods you might use
};

interface ChartProps {
  id: string;
  options: ApexOptions;
  width?: string | number;
  height?: string | number;
}

const Chart: React.FC<ChartProps> = ({ id, options, width = '100%' }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<ApexChartsInstance | null>(null);

  useEffect(() => {
    let mounted = true;

    const initializeChart = async () => {
      if (mounted && chartRef.current) {
        // Correct import syntax
        const ApexCharts = (await import('apexcharts')).default;
        
        if (chartInstance.current) {
          chartInstance.current.destroy();
        }

        // Create new chart instance
        const chart = new ApexCharts(chartRef.current, {
          ...options,
          chart: {
            ...options.chart,
            width,
          },
        });
        
        chartInstance.current = chart;
        chart.render();
      }
    };

    initializeChart();

    return () => {
      mounted = false;
      chartInstance.current?.destroy();
      chartInstance.current = null;
    };
  }, [options, width]);

  return <div id={id} ref={chartRef} style={{ width }} />;
};

export default Chart;