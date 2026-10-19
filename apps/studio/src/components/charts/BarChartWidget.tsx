import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface BarChartProps {
  title: string;
  metric: string;
  color?: string;
}

export function BarChartWidget({ title, metric, color = '#06b6d4' }: BarChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, 'dark', {
        renderer: 'canvas',
      });
    }

    const channels = ['Organic Search', 'Direct Link', 'Referral', 'Paid Ads', 'Social'];
    const counts = [1420, 890, 640, 520, 310];

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#18181b',
        borderColor: '#27272a',
        textStyle: { color: '#fafafa', fontSize: 11, fontFamily: 'Inter, sans-serif' },
        axisPointer: { type: 'shadow' },
      },
      grid: {
        top: 25,
        left: 45,
        right: 15,
        bottom: 30,
      },
      xAxis: {
        type: 'category',
        data: channels,
        axisLine: { lineStyle: { color: '#27272a' } },
        axisLabel: { color: '#71717a', fontSize: 9, interval: 0, rotate: 15 },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#1f1f23', type: 'dashed' } },
        axisLabel: { color: '#71717a', fontSize: 10 },
      },
      series: [
        {
          name: metric,
          type: 'bar',
          barWidth: '45%',
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color },
              { offset: 1, color: `${color}66` },
            ]),
          },
          data: counts,
        },
      ],
    };

    chartInstance.current.setOption(option);

    // Dynamic container resize observer for visual grid dragging & resizing
    const resizeObserver = new ResizeObserver(() => {
      chartInstance.current?.resize();
    });
    if (chartRef.current) {
      resizeObserver.observe(chartRef.current);
    }

    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [metric, color]);

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      {title && (
        <div className="flex items-center justify-between mb-2 shrink-0">
          <h4 className="text-xs font-semibold text-zinc-200">{title}</h4>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
            {metric}
          </span>
        </div>
      )}
      <div ref={chartRef} className="w-full flex-1 min-h-[140px]" />
    </div>
  );
}
