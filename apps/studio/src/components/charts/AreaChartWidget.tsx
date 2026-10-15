import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface AreaChartProps {
  title: string;
  metric: string;
  color?: string;
  data?: { date: string; value: number }[];
}

export function AreaChartWidget({ title, metric, color = '#6366f1' }: AreaChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, 'dark', {
        renderer: 'canvas',
      });
    }

    const dates = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const values = [4200, 5800, 7100, 6800, 9400, 11200, 14500];

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#18181b',
        borderColor: '#27272a',
        textStyle: { color: '#fafafa', fontSize: 11, fontFamily: 'Inter, sans-serif' },
        axisPointer: { type: 'line', lineStyle: { color: '#3f3f46', type: 'dashed' } },
        formatter: (params: any) => {
          const item = params[0];
          return `<div class="font-medium">${item.name}</div><div class="text-indigo-400 font-bold">${metric}: $${item.value.toLocaleString()}</div>`;
        },
      },
      grid: {
        top: 25,
        left: 45,
        right: 15,
        bottom: 25,
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: { lineStyle: { color: '#27272a' } },
        axisLabel: { color: '#71717a', fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#1f1f23', type: 'dashed' } },
        axisLabel: {
          color: '#71717a',
          fontSize: 10,
          formatter: (v: number) => (v >= 1000 ? `${v / 1000}k` : `${v}`),
        },
      },
      series: [
        {
          name: metric,
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 4,
          itemStyle: { color },
          lineStyle: { width: 2.5, color },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: `${color}55` },
              { offset: 1, color: `${color}00` },
            ]),
          },
          data: values,
        },
      ],
    };

    chartInstance.current.setOption(option);

    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [metric, color]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-zinc-200">{title}</h4>
        <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
          {metric}
        </span>
      </div>
      <div ref={chartRef} className="w-full h-48" />
    </div>
  );
}
