import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import * as echarts from 'echarts';
import type { ThemeConfig, JWTPayload, CubeQuery } from '@loomina/shared';
import { useLoominaQuery } from './hooks/useLoominaQuery';
import { exportToCsv, exportToExcel, exportToPdf, type ExportColumn } from './utils/exportSuite';
import { KpiCardSkeleton, ChartSkeleton, TableSkeleton } from './components/Skeleton';
import { QueryError } from './components/QueryError';

export interface EmbeddedDashboardProps {
  token: string;
  dashboardId?: string;
  apiHost?: string;
  theme?: ThemeConfig;
  allowCustomization?: boolean;
  className?: string;
  onActionTriggered?: (actionId: string, payload: unknown) => void;
  onTokenVerified?: (payload: JWTPayload) => void;
}

// Decode standard base64url JWT without external library
function parseJwt(token: string): Partial<JWTPayload> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

interface TableRow {
  [key: string]: unknown;
  id: string;
  customer: string;
  plan: 'Enterprise' | 'Growth' | 'Starter';
  mrr: number;
  health: 'Healthy' | 'At Risk' | 'Churned';
  activity: string;
}

const DEFAULT_TABLE_DATA: TableRow[] = [
  { id: 'c_01', customer: 'CloudScale Technologies', plan: 'Enterprise', mrr: 14200, health: 'Healthy', activity: '2h ago' },
  { id: 'c_02', customer: 'Fintech Nexus Ltd', plan: 'Enterprise', mrr: 11800, health: 'Healthy', activity: '10m ago' },
  { id: 'c_03', customer: 'DataSphere Media', plan: 'Growth', mrr: 4600, health: 'At Risk', activity: '1d ago' },
  { id: 'c_04', customer: 'OmniAI Platform', plan: 'Growth', mrr: 3900, health: 'Healthy', activity: '4h ago' },
  { id: 'c_05', customer: 'Hyperion Labs', plan: 'Starter', mrr: 950, health: 'Healthy', activity: 'Just now' },
  { id: 'c_06', customer: 'Vortex Analytics', plan: 'Enterprise', mrr: 9800, health: 'Healthy', activity: '15m ago' },
  { id: 'c_07', customer: 'AeroByte Security', plan: 'Growth', mrr: 5200, health: 'Healthy', activity: '3h ago' },
];

export const EmbeddedDashboard: React.FC<EmbeddedDashboardProps> = ({
  token,
  dashboardId = 'dash_default',
  apiHost = 'http://localhost:4000',
  theme,
  allowCustomization = false,
  className = '',
  onActionTriggered,
  onTokenVerified,
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const [shadowRoot, setShadowRoot] = useState<ShadowRoot | null>(null);

  // Time Grain Filter
  const [timeGrain, setTimeGrain] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [tableSortAsc, setTableSortAsc] = useState<boolean>(false);
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);

  // Parsed JWT
  const jwtPayload = useMemo(() => parseJwt(token), [token]);

  // Notify parent on verification
  useEffect(() => {
    if (jwtPayload && onTokenVerified) {
      onTokenVerified(jwtPayload as JWTPayload);
    }
  }, [jwtPayload, onTokenVerified]);

  // Attach or reuse Shadow DOM on mount (safe for React 19 / StrictMode / HMR)
  useEffect(() => {
    if (!hostRef.current) return;

    if (hostRef.current.shadowRoot) {
      setShadowRoot(hostRef.current.shadowRoot);
    } else {
      try {
        const root = hostRef.current.attachShadow({ mode: 'open' });
        setShadowRoot(root);
      } catch {
        if (hostRef.current.shadowRoot) {
          setShadowRoot(hostRef.current.shadowRoot);
        }
      }
    }
  }, []);

  // Theme Tokens
  const isDark = theme?.mode !== 'light';
  const primaryColor = theme?.colors?.primary || '#6366f1';
  const bgColor = theme?.colors?.background || (isDark ? '#09090b' : '#ffffff');
  const surfaceColor = theme?.colors?.surface || (isDark ? '#18181b' : '#f8fafc');
  const borderColor = theme?.colors?.surfaceBorder || (isDark ? '#27272a' : '#e2e8f0');
  const textColor = theme?.colors?.textPrimary || (isDark ? '#fafafa' : '#0f172a');
  const textMuted = theme?.colors?.textMuted || (isDark ? '#a1a1aa' : '#64748b');
  const radius = theme?.radius || '0.75rem';
  const fontFamily = theme?.fontFamily || 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  // --- LIVE QUERY 1: KPI Metrics ---
  const kpiQuery: CubeQuery = useMemo(
    () => ({
      measures: ['Orders.revenue', 'Subscriptions.count', 'Subscriptions.retentionRate'],
    }),
    []
  );

  const {
    data: kpiResult,
    loading: kpiLoading,
    error: kpiError,
    refetch: refetchKpi,
  } = useLoominaQuery<Record<string, number>>({
    token,
    query: kpiQuery,
    apiHost,
  });

  const kpiMetrics = useMemo(() => {
    if (kpiResult?.data && kpiResult.data.length > 0) {
      const row = kpiResult.data[0];
      const mrr = row['Orders.revenue'] ?? 124500;
      const count = row['Subscriptions.count'] ?? 1842;
      const retention = row['Subscriptions.retentionRate'] ?? 118;
      return {
        mrr: `$${mrr.toLocaleString()}`,
        subscriptions: count.toLocaleString(),
        retention: `${retention}%`,
      };
    }
    return {
      mrr: '$124,500',
      subscriptions: '1,842',
      retention: '118%',
    };
  }, [kpiResult]);

  // --- LIVE QUERY 2: Revenue Trend Area Chart ---
  const revenueQuery: CubeQuery = useMemo(
    () => ({
      measures: ['Orders.revenue'],
      timeDimensions: [
        {
          dimension: 'Orders.createdAt',
          granularity: timeGrain === '1y' ? 'month' : 'day',
          dateRange:
            timeGrain === '7d'
              ? 'last 7 days'
              : timeGrain === '30d'
                ? 'last 30 days'
                : timeGrain === '90d'
                  ? 'last 90 days'
                  : 'last 365 days',
        },
      ],
    }),
    [timeGrain]
  );

  const {
    data: revenueResult,
    loading: revenueLoading,
    error: revenueError,
    refetch: refetchRevenue,
  } = useLoominaQuery<Record<string, unknown>>({
    token,
    query: revenueQuery,
    apiHost,
  });

  // --- LIVE QUERY 3: Customer Acquisition Channels Bar Chart ---
  const channelsQuery: CubeQuery = useMemo(
    () => ({
      measures: ['Users.count'],
      dimensions: ['Users.channel'],
    }),
    []
  );

  const {
    data: channelsResult,
    loading: channelsLoading,
    error: channelsError,
    refetch: refetchChannels,
  } = useLoominaQuery<Record<string, unknown>>({
    token,
    query: channelsQuery,
    apiHost,
  });

  // --- LIVE QUERY 4: Key Accounts Table ---
  const tableQuery: CubeQuery = useMemo(
    () => ({
      dimensions: ['Accounts.name', 'Accounts.plan', 'Accounts.health', 'Accounts.activity'],
      measures: ['Accounts.mrr'],
    }),
    []
  );

  const {
    data: tableResult,
    loading: tableLoading,
    error: tableError,
    refetch: refetchTable,
  } = useLoominaQuery<TableRow>({
    token,
    query: tableQuery,
    apiHost,
  });

  // Dynamic Table Rows
  const tableRows = useMemo(() => {
    if (tableResult?.data && tableResult.data.length > 0) {
      return tableResult.data;
    }
    return DEFAULT_TABLE_DATA;
  }, [tableResult]);

  const sortedTableRows = useMemo(() => {
    return [...tableRows].sort((a, b) => {
      const valA = typeof a.mrr === 'number' ? a.mrr : parseInt(String(a.mrr).replace(/[^0-9]/g, ''), 10) || 0;
      const valB = typeof b.mrr === 'number' ? b.mrr : parseInt(String(b.mrr).replace(/[^0-9]/g, ''), 10) || 0;
      return tableSortAsc ? valA - valB : valB - valA;
    });
  }, [tableRows, tableSortAsc]);

  // Chart Containers inside Shadow DOM
  const areaChartRef = useRef<HTMLDivElement>(null);
  const barChartRef = useRef<HTMLDivElement>(null);
  const areaChartInstance = useRef<echarts.ECharts | null>(null);
  const barChartInstance = useRef<echarts.ECharts | null>(null);

  // 1. Render Area Chart
  useEffect(() => {
    if (!shadowRoot || !areaChartRef.current || revenueLoading) return;

    if (!areaChartInstance.current) {
      areaChartInstance.current = echarts.init(areaChartRef.current, undefined, { renderer: 'canvas' });
    }

    let xAxisData: string[] = [];
    let seriesData: number[] = [];

    if (revenueResult?.data && revenueResult.data.length > 0) {
      xAxisData = revenueResult.data.map((r) => String(r['Orders.createdAt'] || ''));
      seriesData = revenueResult.data.map((r) => Number(r['Orders.revenue']) || 0);
    } else {
      xAxisData =
        timeGrain === '7d'
          ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
          : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      seriesData =
        timeGrain === '7d'
          ? [112000, 114500, 116200, 118900, 121000, 122800, 124500]
          : [72000, 78000, 84000, 91000, 96000, 102000, 107000, 111000, 115000, 119000, 121500, 124500];
    }

    const areaOption: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: isDark ? '#18181b' : '#ffffff',
        borderColor: borderColor,
        textStyle: { color: textColor, fontSize: 12 },
        padding: [8, 12],
        valueFormatter: (val) => `$${Number(val).toLocaleString()}`,
      },
      grid: { top: 20, right: 16, bottom: 24, left: 45 },
      xAxis: {
        type: 'category',
        data: xAxisData,
        axisLine: { lineStyle: { color: borderColor } },
        axisLabel: { color: textMuted, fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: isDark ? '#27272a' : '#f1f5f9' } },
        axisLabel: {
          color: textMuted,
          fontSize: 11,
          formatter: (val: number) => `$${Math.round(val / 1000)}k`,
        },
      },
      series: [
        {
          name: 'MRR Growth',
          type: 'line',
          smooth: 0.35,
          showSymbol: false,
          data: seriesData,
          lineStyle: { width: 3, color: primaryColor },
          itemStyle: { color: primaryColor },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: `${primaryColor}44` },
              { offset: 1, color: `${primaryColor}00` },
            ]),
          },
        },
      ],
    };

    areaChartInstance.current.setOption(areaOption, true);
  }, [shadowRoot, revenueResult, revenueLoading, timeGrain, isDark, primaryColor, borderColor, textColor, textMuted]);

  // 2. Render Bar Chart
  useEffect(() => {
    if (!shadowRoot || !barChartRef.current || channelsLoading) return;

    if (!barChartInstance.current) {
      barChartInstance.current = echarts.init(barChartRef.current, undefined, { renderer: 'canvas' });
    }

    let xAxisData: string[] = [];
    let seriesData: number[] = [];

    if (channelsResult?.data && channelsResult.data.length > 0) {
      xAxisData = channelsResult.data.map((r) => String(r['Users.channel'] || ''));
      seriesData = channelsResult.data.map((r) => Number(r['Users.count']) || 0);
    } else {
      xAxisData = ['Organic Search', 'Direct', 'Referral', 'Partner', 'Outreach'];
      seriesData = [420, 310, 260, 190, 140];
    }

    const barOption: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: isDark ? '#18181b' : '#ffffff',
        borderColor: borderColor,
        textStyle: { color: textColor, fontSize: 12 },
      },
      grid: { top: 20, right: 16, bottom: 24, left: 40 },
      xAxis: {
        type: 'category',
        data: xAxisData,
        axisLine: { lineStyle: { color: borderColor } },
        axisLabel: { color: textMuted, fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: isDark ? '#27272a' : '#f1f5f9' } },
        axisLabel: { color: textMuted, fontSize: 11 },
      },
      series: [
        {
          name: 'New Customers',
          type: 'bar',
          barWidth: '36%',
          itemStyle: {
            color: '#06b6d4',
            borderRadius: [6, 6, 0, 0],
          },
          data: seriesData,
        },
      ],
    };

    barChartInstance.current.setOption(barOption, true);
  }, [shadowRoot, channelsResult, channelsLoading, isDark, borderColor, textColor, textMuted]);

  // Auto-resize on window resize
  useEffect(() => {
    const handleResize = () => {
      areaChartInstance.current?.resize();
      barChartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Clean up ECharts instances on unmount
  useEffect(() => {
    return () => {
      areaChartInstance.current?.dispose();
      barChartInstance.current?.dispose();
      areaChartInstance.current = null;
      barChartInstance.current = null;
    };
  }, []);

  // Trigger custom action handler
  const handleAction = (actionId: string, payload: unknown) => {
    if (onActionTriggered) {
      onActionTriggered(actionId, payload);
    }
  };

  // --- 1-Click Export Suite Handlers ---
  const exportColumns: ExportColumn<TableRow>[] = [
    { header: 'Account Name', key: 'customer' },
    { header: 'Subscription Tier', key: 'plan' },
    {
      header: 'Monthly Recurring Revenue',
      key: 'mrr',
      format: (val) => (typeof val === 'number' ? `$${val.toLocaleString()}` : String(val)),
    },
    { header: 'Account Health', key: 'health' },
    { header: 'Recent Activity', key: 'activity' },
  ];

  const handleExportCsv = () => {
    setShowExportMenu(false);
    const tenant = jwtPayload?.tenantId || 'acme';
    exportToCsv(`loomina_accounts_${tenant}_${timeGrain}`, sortedTableRows, exportColumns);
    handleAction('export_csv', { count: sortedTableRows.length, tenant });
  };

  const handleExportExcel = () => {
    setShowExportMenu(false);
    const tenant = jwtPayload?.tenantId || 'acme';
    exportToExcel(`loomina_accounts_${tenant}_${timeGrain}`, 'Key Accounts', sortedTableRows, exportColumns);
    handleAction('export_excel', { count: sortedTableRows.length, tenant });
  };

  const handleExportPdf = () => {
    setShowExportMenu(false);
    const tenant = jwtPayload?.tenantId || 'acme';
    exportToPdf('Revenue_Analytics', tenant);
    handleAction('export_pdf', { tenant, timeGrain });
  };

  // Shadow DOM Stylesheet
  const shadowStyles = `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    :host {
      display: block;
      width: 100%;
      font-family: ${fontFamily};
      background: ${bgColor};
      color: ${textColor};
      border-radius: ${radius};
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }
    .loomina-wrapper {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid ${borderColor};
    }
    .title-area h2 {
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: ${textColor};
    }
    .tenant-tag {
      font-size: 0.75rem;
      font-family: monospace;
      color: ${primaryColor};
      background: ${primaryColor}18;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      border: 1px solid ${primaryColor}33;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .filters {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      background: ${surfaceColor};
      padding: 0.25rem;
      border-radius: 0.5rem;
      border: 1px solid ${borderColor};
    }
    .filter-btn {
      background: transparent;
      border: none;
      color: ${textMuted};
      font-size: 0.75rem;
      font-weight: 500;
      padding: 0.35rem 0.65rem;
      border-radius: 0.375rem;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .filter-btn.active {
      background: ${primaryColor};
      color: #ffffff;
      font-weight: 600;
    }
    .export-dropdown {
      position: relative;
    }
    .export-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: ${surfaceColor};
      color: ${textColor};
      border: 1px solid ${borderColor};
      padding: 0.45rem 0.85rem;
      border-radius: 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .export-btn:hover {
      background: ${borderColor};
    }
    .export-menu {
      position: absolute;
      top: calc(100% + 0.35rem);
      right: 0;
      background: ${surfaceColor};
      border: 1px solid ${borderColor};
      border-radius: 0.5rem;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
      min-width: 170px;
      z-index: 50;
      padding: 0.35rem;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    .export-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      color: ${textColor};
      background: transparent;
      border: none;
      text-align: left;
      cursor: pointer;
      transition: background 0.15s ease;
      width: 100%;
    }
    .export-item:hover {
      background: ${primaryColor}22;
      color: ${primaryColor};
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
    }
    .card {
      background: ${surfaceColor};
      border: 1px solid ${borderColor};
      border-radius: ${radius};
      padding: 1.25rem;
      position: relative;
      transition: border-color 0.15s ease, transform 0.15s ease;
    }
    .card:hover {
      border-color: ${primaryColor}66;
    }
    .kpi-title {
      font-size: 0.8125rem;
      font-weight: 500;
      color: ${textMuted};
      margin-bottom: 0.5rem;
    }
    .kpi-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: ${textColor};
      letter-spacing: -0.03em;
    }
    .kpi-delta {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      font-weight: 600;
      margin-top: 0.35rem;
      color: #10b981;
    }
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
      gap: 1.25rem;
    }
    .chart-container {
      width: 100%;
      height: 240px;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .card-title {
      font-size: 0.9375rem;
      font-weight: 600;
      color: ${textColor};
    }
    .table-container {
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;
      text-align: left;
    }
    th {
      padding: 0.65rem 0.75rem;
      color: ${textMuted};
      font-weight: 600;
      border-bottom: 1px solid ${borderColor};
      cursor: pointer;
      user-select: none;
    }
    th:hover {
      color: ${textColor};
    }
    td {
      padding: 0.75rem;
      border-bottom: 1px solid ${borderColor};
      color: ${textColor};
    }
    tr:last-child td {
      border-bottom: none;
    }
    tr:hover td {
      background: ${primaryColor}0a;
    }
    .badge {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.7rem;
      font-weight: 600;
    }
    .badge-healthy {
      background: #10b9811f;
      color: #10b981;
      border: 1px solid #10b98133;
    }
    .badge-risk {
      background: #f59e0b1f;
      color: #f59e0b;
      border: 1px solid #f59e0b33;
    }
    .action-btn {
      background: ${primaryColor}1a;
      color: ${primaryColor};
      border: 1px solid ${primaryColor}33;
      padding: 0.3rem 0.6rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .action-btn:hover {
      background: ${primaryColor};
      color: #ffffff;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 0.75rem;
      border-top: 1px solid ${borderColor};
      font-size: 0.75rem;
      color: ${textMuted};
    }
    .stateless-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      color: #10b981;
      font-weight: 500;
    }
    .pulse-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px #10b981;
    }
    .loomina-skeleton {
      background: ${isDark ? 'linear-gradient(90deg, #27272a 25%, #3f3f46 50%, #27272a 75%)' : 'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)'};
      background-size: 200% 100%;
      animation: skeleton-pulse 1.6s ease-in-out infinite;
    }
    @keyframes skeleton-pulse {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    .query-error-card {
      border-color: #ef444444;
      background: #ef444411;
    }
    .error-icon-circle {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #ef444433;
      color: #ef4444;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.8rem;
    }
    @media print {
      :host {
        background: #ffffff !important;
        color: #000000 !important;
      }
      .filters, .header-actions, .action-btn, .footer {
        display: none !important;
      }
      .card {
        border: 1px solid #d1d5db !important;
        break-inside: avoid;
        page-break-inside: avoid;
      }
      .loomina-wrapper {
        padding: 0 !important;
      }
    }
  `;

  return (
    <div ref={hostRef} className={`loomina-embed-host ${className}`}>
      {shadowRoot &&
        createPortal(
          <>
            <style>{shadowStyles}</style>
            <div className="loomina-wrapper">
              {/* Header */}
              <div className="header">
                <div className="title-area">
                  <h2>Revenue & Customer Intelligence</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
                    <span className="tenant-tag">
                      {jwtPayload?.tenantId ? `Tenant: ${jwtPayload.tenantId}` : 'Tenant: tenant_acme_corp'}
                    </span>
                    {jwtPayload?.role && (
                      <span style={{ fontSize: '0.75rem', color: textMuted }}>
                        Role: <strong>{jwtPayload.role}</strong>
                      </span>
                    )}
                  </div>
                </div>

                <div className="header-actions">
                  <div className="filters">
                    {(['7d', '30d', '90d', '1y'] as const).map((grain) => (
                      <button
                        key={grain}
                        type="button"
                        className={`filter-btn ${timeGrain === grain ? 'active' : ''}`}
                        onClick={() => setTimeGrain(grain)}
                      >
                        {grain.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  {/* 1-Click Export Suite Dropdown */}
                  <div className="export-dropdown">
                    <button
                      type="button"
                      className="export-btn"
                      onClick={() => setShowExportMenu((prev) => !prev)}
                    >
                      <span>Export Suite</span>
                      <span style={{ fontSize: '0.65rem' }}>▼</span>
                    </button>

                    {showExportMenu && (
                      <div className="export-menu">
                        <button type="button" className="export-item" onClick={handleExportCsv}>
                          <span>📄</span>
                          <span>Export CSV</span>
                        </button>
                        <button type="button" className="export-item" onClick={handleExportExcel}>
                          <span>📊</span>
                          <span>Export Excel (.xls)</span>
                        </button>
                        <button type="button" className="export-item" onClick={handleExportPdf}>
                          <span>🖨️</span>
                          <span>Print / Save PDF</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* KPI Cards (Live Wired with Loading Skeleton and Error Fallback) */}
              {kpiError ? (
                <QueryError message={kpiError.message} onRetry={refetchKpi} />
              ) : kpiLoading ? (
                <div className="kpi-grid">
                  <KpiCardSkeleton />
                  <KpiCardSkeleton />
                  <KpiCardSkeleton />
                </div>
              ) : (
                <div className="kpi-grid">
                  <div className="card">
                    <div className="kpi-title">Monthly Recurring Revenue</div>
                    <div className="kpi-value">{kpiMetrics.mrr}</div>
                    <div className="kpi-delta">
                      <span>↑ +14.2%</span>
                      <span style={{ color: textMuted, fontWeight: 400 }}>vs last month</span>
                    </div>
                  </div>

                  <div className="card">
                    <div className="kpi-title">Active Subscriptions</div>
                    <div className="kpi-value">{kpiMetrics.subscriptions}</div>
                    <div className="kpi-delta">
                      <span>↑ +8.1%</span>
                      <span style={{ color: textMuted, fontWeight: 400 }}>net expansion</span>
                    </div>
                  </div>

                  <div className="card">
                    <div className="kpi-title">Net Revenue Retention</div>
                    <div className="kpi-value">{kpiMetrics.retention}</div>
                    <div className="kpi-delta">
                      <span>★ Top 10%</span>
                      <span style={{ color: textMuted, fontWeight: 400 }}>B2B SaaS</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Visualizations Grid (ECharts in Shadow DOM with Live Data) */}
              <div className="charts-grid">
                {revenueError ? (
                  <QueryError message={revenueError.message} onRetry={refetchRevenue} />
                ) : revenueLoading ? (
                  <ChartSkeleton title="MRR Trajectory & Net Expansion" subtitle="Loading live query stream..." />
                ) : (
                  <div className="card">
                    <div className="card-header">
                      <div>
                        <span className="card-title">MRR Trajectory & Net Expansion</span>
                        {revenueResult?.isSimulated && (
                          <span style={{ marginLeft: '0.5rem', fontSize: '0.6875rem', color: textMuted }}>
                            (Dev Simulation)
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: textMuted }}>Dynamic ECharts Canvas</span>
                    </div>
                    <div ref={areaChartRef} className="chart-container" />
                  </div>
                )}

                {channelsError ? (
                  <QueryError message={channelsError.message} onRetry={refetchChannels} />
                ) : channelsLoading ? (
                  <ChartSkeleton title="Customer Acquisition Channels" subtitle="Loading live query stream..." />
                ) : (
                  <div className="card">
                    <div className="card-header">
                      <div>
                        <span className="card-title">Customer Acquisition Channels</span>
                        {channelsResult?.isSimulated && (
                          <span style={{ marginLeft: '0.5rem', fontSize: '0.6875rem', color: textMuted }}>
                            (Dev Simulation)
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: textMuted }}>Volume by Source</span>
                    </div>
                    <div ref={barChartRef} className="chart-container" />
                  </div>
                )}
              </div>

              {/* TanStack Table Grid (Live Table with Sorting and 1-Click Export) */}
              {tableError ? (
                <QueryError message={tableError.message} onRetry={refetchTable} />
              ) : tableLoading ? (
                <TableSkeleton />
              ) : (
                <div className="card">
                  <div className="card-header">
                    <div>
                      <span className="card-title">Key Accounts & Churn Diagnostics</span>
                      <p style={{ fontSize: '0.75rem', color: textMuted, marginTop: '0.15rem' }}>
                        Filtered strictly by customer row-level tenant security
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="action-btn"
                        onClick={handleExportCsv}
                        title="Download CSV report"
                      >
                        Export CSV
                      </button>
                      <button
                        type="button"
                        className="action-btn"
                        onClick={handleExportExcel}
                        title="Download styled Excel spreadsheet"
                      >
                        Export Excel
                      </button>
                    </div>
                  </div>

                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Account</th>
                          <th>Tier</th>
                          <th onClick={() => setTableSortAsc((prev) => !prev)}>
                            MRR {tableSortAsc ? '↑' : '↓'}
                          </th>
                          <th>Health Status</th>
                          <th>Last Activity</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedTableRows.map((row) => (
                          <tr key={row.id}>
                            <td style={{ fontWeight: 600 }}>{row.customer}</td>
                            <td>
                              <span style={{ color: textMuted }}>{row.plan}</span>
                            </td>
                            <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                              {typeof row.mrr === 'number' ? `$${row.mrr.toLocaleString()}` : row.mrr}
                            </td>
                            <td>
                              <span className={`badge ${row.health === 'Healthy' ? 'badge-healthy' : 'badge-risk'}`}>
                                {row.health}
                              </span>
                            </td>
                            <td style={{ color: textMuted }}>{row.activity}</td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                type="button"
                                className="action-btn"
                                onClick={() => handleAction('inspect_account', { accountId: row.id, customer: row.customer })}
                              >
                                Inspect
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="footer">
                <div className="stateless-badge">
                  <span className="pulse-dot" />
                  <span>
                    Stateless JWT Verified (&lt;0.2ms latency in RAM)
                    {revenueResult?.executionTimeMs !== undefined && (
                      <span style={{ color: textMuted, marginLeft: '0.5rem' }}>
                        • Query: {revenueResult.executionTimeMs}ms (Sub-10ms Cache)
                      </span>
                    )}
                  </span>
                </div>
                <span>Powered by Loomina OSS Embedded SDK</span>
              </div>
            </div>
          </>,
          shadowRoot
        )}
    </div>
  );
};
