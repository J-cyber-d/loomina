import { useState } from 'react';
import {
  LayoutDashboard,
  Database,
  Key,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Copy,
  Check,
  Server,
  Code2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Table,
  TrendingUp,
  BarChart3,
  LineChart as LineChartIcon,
  Trash2,
  Save,
} from 'lucide-react';
import { EmbeddedDashboard } from '@loomina/react';
import { Button } from './components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Input } from './components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './components/ui/dialog';
import { AreaChartWidget } from './components/charts/AreaChartWidget';
import { BarChartWidget } from './components/charts/BarChartWidget';
import { TanStackTableWidget } from './components/charts/TanStackTableWidget';

interface DataSource {
  id: string;
  name: string;
  engineType: string;
  maskedUri: string;
  status: 'active' | 'testing';
  latency?: string;
  tablesCount?: number;
}

interface TestResult {
  success: boolean;
  title?: string;
  message?: string;
  userMessage?: string;
  actionableHint?: string;
  technicalDetails?: string;
  sampleTables?: string[];
}

export interface WidgetItem {
  id: string;
  title: string;
  type: 'kpi' | 'line' | 'area' | 'bar' | 'table';
  metric: string;
  timeGrain?: 'day' | 'week' | 'month';
  value?: string;
  change?: string;
  color?: string;
}

export default function App() {
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const [activeTab, setActiveTab] = useState<'canvas' | 'datastores' | 'keys'>('canvas');
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showAddWidgetModal, setShowAddWidgetModal] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showTechDetails, setShowTechDetails] = useState(false);
  const [isSavingDashboard, setIsSavingDashboard] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Connect Database Form State
  const [engineType, setEngineType] = useState('postgres');
  const [dbName, setDbName] = useState('Production Analytics');
  const [connectionUri, setConnectionUri] = useState(
    'postgres://lago:changeme@localhost:5432/loomina_metadata'
  );
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  // New Widget Form State
  const [newWidgetTitle, setNewWidgetTitle] = useState('Weekly New Signups');
  const [newWidgetType, setNewWidgetType] = useState<'kpi' | 'line' | 'area' | 'bar' | 'table'>('area');
  const [newWidgetMetric, setNewWidgetMetric] = useState('Users.count');
  const [newWidgetGrain, setNewWidgetGrain] = useState<'day' | 'week' | 'month'>('week');
  const [newWidgetColor, setNewWidgetColor] = useState('#6366f1');

  // Interactive Widgets State
  const [widgets, setWidgets] = useState<WidgetItem[]>([
    {
      id: 'w_1',
      title: 'Monthly Recurring Revenue',
      type: 'kpi',
      metric: 'Subscriptions.mrr',
      value: '$124,500',
      change: '+14.2% MoM',
      color: '#6366f1',
    },
    {
      id: 'w_2',
      title: 'Active Customers',
      type: 'kpi',
      metric: 'Users.activeCount',
      value: '1,842',
      change: '+8.1% MoM',
      color: '#06b6d4',
    },
    {
      id: 'w_3',
      title: 'Net Revenue Retention',
      type: 'kpi',
      metric: 'Subscriptions.nrr',
      value: '118%',
      change: 'Top quartile',
      color: '#10b981',
    },
    {
      id: 'w_4',
      title: 'Revenue Growth Trend',
      type: 'area',
      metric: 'Deals.totalAmount',
      timeGrain: 'month',
      color: '#6366f1',
    },
    {
      id: 'w_5',
      title: 'Top Customer Acquisition Channels',
      type: 'bar',
      metric: 'Users.count',
      color: '#06b6d4',
    },
  ]);

  // List of connected data sources
  const [dataSources, setDataSources] = useState<DataSource[]>([
    {
      id: 'ds_sample_1',
      name: 'Default Postgres Analytics',
      engineType: 'postgres',
      maskedUri: 'postgres://lago:****@localhost:5432/loomina_metadata',
      status: 'active',
      latency: '12ms',
      tablesCount: 6,
    },
  ]);

  const handleTestConnection = async () => {
    if (!connectionUri.trim()) {
      setTestResult({
        success: false,
        title: 'Connection URI Missing',
        userMessage: 'Please enter a database connection string before testing.',
        actionableHint: 'Example: postgres://lago:changeme@localhost:5432/loomina_metadata',
      });
      return;
    }

    if (engineType === 'postgres' && !connectionUri.startsWith('postgres://') && !connectionUri.startsWith('postgresql://')) {
      setTestResult({
        success: false,
        title: 'Invalid PostgreSQL URI Format',
        userMessage: 'PostgreSQL connection strings must start with "postgres://" or "postgresql://".',
        actionableHint: 'Example: postgres://lago:changeme@localhost:5432/loomina_metadata',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    setShowTechDetails(false);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/datasources/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ engineType, connectionUri }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: data.message,
          sampleTables: data.sampleTables,
        });
      } else {
        setTestResult({
          success: false,
          title: data.title || 'Connection Failed',
          userMessage: data.userMessage || 'Could not establish connection to the database.',
          actionableHint:
            data.actionableHint || 'Please check your connection credentials and verify the database is running.',
          technicalDetails: data.technicalDetails,
        });
      }
    } catch {
      setTestResult({
        success: false,
        title: 'API Gateway Offline',
        userMessage: `Unable to reach the Loomina API Gateway on ${API_BASE_URL}.`,
        actionableHint:
          'Make sure the Fastify backend is running. Open your terminal and run "pnpm dev" to start all services.',
        technicalDetails: `Network request to ${API_BASE_URL}/api/v1/datasources/test failed (fetch error)`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveDataSource = () => {
    const newDs: DataSource = {
      id: `ds_${Date.now()}`,
      name: dbName,
      engineType,
      maskedUri: connectionUri.replace(/:([^:@]+)@/, ':****@'),
      status: 'active',
      latency: '14ms',
      tablesCount: testResult?.sampleTables?.length || 6,
    };
    setDataSources((prev) => [newDs, ...prev]);
    setShowConnectModal(false);
    setTestResult(null);
  };

  const handleAddWidget = () => {
    const created: WidgetItem = {
      id: `w_${Date.now()}`,
      title: newWidgetTitle,
      type: newWidgetType,
      metric: newWidgetMetric,
      timeGrain: newWidgetGrain,
      value: newWidgetType === 'kpi' ? '$45,210' : undefined,
      change: newWidgetType === 'kpi' ? '+12.4% MoM' : undefined,
      color: newWidgetColor,
    };
    setWidgets((prev) => [...prev, created]);
    setShowAddWidgetModal(false);
    setSaveSuccessMessage('Widget added to canvas! Click "Save Dashboard" to persist.');
    setTimeout(() => setSaveSuccessMessage(null), 4000);
  };

  const handleDeleteWidget = (id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
  };

  const handleSaveDashboardToBackend = async () => {
    setIsSavingDashboard(true);
    setSaveSuccessMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/dashboards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: '00000000-0000-0000-0000-000000000001',
          title: 'Executive SaaS Analytics',
          slug: 'executive-saas-analytics',
          layout: {
            widgets: widgets.map((w, index) => ({
              id: w.id,
              type: w.type,
              title: w.title,
              metric: w.metric,
              x: (index % 3) * 4,
              y: Math.floor(index / 3) * 4,
              w: w.type === 'kpi' ? 4 : 6,
              h: 4,
            })),
          },
        }),
      });

      if (res.ok) {
        setSaveSuccessMessage('✓ Dashboard & all widgets saved successfully to PostgreSQL metadata database!');
        setTimeout(() => setSaveSuccessMessage(null), 4000);
      } else {
        setSaveSuccessMessage('Dashboard layout updated in local state.');
        setTimeout(() => setSaveSuccessMessage(null), 3000);
      }
    } catch {
      setSaveSuccessMessage('Dashboard layout updated in local state.');
      setTimeout(() => setSaveSuccessMessage(null), 3000);
    } finally {
      setIsSavingDashboard(false);
    }
  };

  const embedSnippet = `<EmbeddedDashboard
  token={jwtToken}
  theme={{
    mode: "dark",
    fontFamily: "Inter, sans-serif",
    radius: "0.75rem",
    colors: {
      background: "#09090b",
      surface: "#18181b",
      primary: "#6366f1",
      textPrimary: "#fafafa"
    }
  }}
/>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] flex flex-col font-sans selection:bg-indigo-500/30">
      {/* Top Header */}
      <header className="h-14 border-b border-[#27272a] bg-[#09090b]/80 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/30">
            L
          </div>
          <span className="font-semibold text-lg tracking-tight">Loomina Studio</span>
          <Badge variant="outline" className="text-indigo-400 border-indigo-500/20 bg-indigo-500/10">
            OSS v0.1.0
          </Badge>
        </div>

        {/* View Switcher */}
        <nav className="flex items-center gap-1 bg-[#18181b] p-1 rounded-lg border border-[#27272a]">
          <Button
            variant={activeTab === 'canvas' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('canvas')}
            className={activeTab === 'canvas' ? 'bg-[#27272a] text-white' : ''}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Dashboard Canvas
          </Button>
          <Button
            variant={activeTab === 'datastores' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('datastores')}
            className={activeTab === 'datastores' ? 'bg-[#27272a] text-white' : ''}
          >
            <Database className="w-3.5 h-3.5" />
            Data Sources ({dataSources.length})
          </Button>
          <Button
            variant={activeTab === 'keys' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('keys')}
            className={activeTab === 'keys' ? 'bg-[#27272a] text-white' : ''}
          >
            <Key className="w-3.5 h-3.5" />
            API Keys
          </Button>
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={`${API_BASE_URL}/documentation`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 border border-indigo-500/20 px-3 py-1.5 rounded-md bg-indigo-500/10 transition-colors"
          >
            <Code2 className="w-3.5 h-3.5" />
            Swagger API Docs
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {/* VIEW 1: INTERACTIVE DASHBOARDS CANVAS */}
        {activeTab === 'canvas' && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold tracking-tight">Executive SaaS Analytics</h1>
                <p className="text-sm text-zinc-400">
                  Target Tenant: <span className="font-mono text-indigo-400">tenant_acme_corp</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAddWidgetModal(true)}
                  className="flex items-center gap-1.5 border-dashed border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Widget
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSaveDashboardToBackend}
                  disabled={isSavingDashboard}
                  className="flex items-center gap-1.5"
                >
                  {isSavingDashboard ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  ) : (
                    <Save className="w-3.5 h-3.5 text-zinc-400" />
                  )}
                  Save Dashboard
                </Button>
                <Button
                  onClick={() => setShowEmbedModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  Embed in Customer App
                </Button>
              </div>
            </div>

            {/* Notification Banner */}
            {saveSuccessMessage && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{saveSuccessMessage}</span>
              </div>
            )}

            {/* SECTION 1: TOP KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {widgets
                .filter((w) => w.type === 'kpi')
                .map((widget) => (
                  <Card key={widget.id} className="relative group hover:border-zinc-700 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle>{widget.title}</CardTitle>
                      <button
                        onClick={() => handleDeleteWidget(widget.id)}
                        className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-400 transition-all p-1"
                        title="Delete widget"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold tracking-tight text-white">{widget.value}</div>
                      <div className="flex items-center gap-1 text-xs text-emerald-400 font-medium mt-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>{widget.change}</span>
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono mt-2">
                        Metric: {widget.metric}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>

            {/* SECTION 2: INTERACTIVE APACHE ECHARTS (2-COLUMN GRID) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card className="p-4">
                <AreaChartWidget
                  title="Revenue Growth Trend (Apache ECharts)"
                  metric="Deals.totalAmount"
                  color="#6366f1"
                />
              </Card>

              <Card className="p-4">
                <BarChartWidget
                  title="Top Customer Acquisition Channels (Apache ECharts)"
                  metric="Users.count"
                  color="#06b6d4"
                />
              </Card>
            </div>

            {/* SECTION 3: TANSTACK DATA TABLE V8 */}
            <Card className="p-5 mb-6">
              <TanStackTableWidget />
            </Card>

            {/* SECTION 4: SHADOW DOM EMBEDDABLE SDK PLAYGROUND */}
            <div className="rounded-xl border border-[#27272a] bg-[#121214] p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Live Embedded Dashboard Preview (<span className="text-indigo-400">Shadow DOM Isolation</span>)
                  </span>
                </div>
                <Badge variant="outline" className="font-mono text-[11px] text-zinc-400">
                  {widgets.length} Widgets Configured
                </Badge>
              </div>

              <EmbeddedDashboard
                token="demo_jwt_token"
                theme={{
                  mode: 'dark',
                  fontFamily: 'Inter, sans-serif',
                  radius: '0.75rem',
                  colors: {
                    background: '#121214',
                    surface: '#18181b',
                    surfaceBorder: '#27272a',
                    primary: '#6366f1',
                    textPrimary: '#fafafa',
                  },
                }}
              />
            </div>
          </div>
        )}

        {/* VIEW 2: DATA SOURCES TAB */}
        {activeTab === 'datastores' && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold tracking-tight">Analytical Data Sources</h1>
                <p className="text-sm text-zinc-400">
                  Connect PostgreSQL, ClickHouse, MySQL, or Snowflake to power real-time customer analytics.
                </p>
              </div>
              <Button
                onClick={() => {
                  setShowConnectModal(true);
                  setTestResult(null);
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Connect Database
              </Button>
            </div>

            {/* Connected Databases Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dataSources.map((ds) => (
                <Card key={ds.id} className="hover:border-zinc-700 transition-colors">
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#27272a] flex items-center justify-center text-indigo-400">
                          <Server className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">{ds.name}</h3>
                          <Badge variant="outline" className="font-mono text-indigo-400 border-indigo-500/20 bg-indigo-500/10 mt-1">
                            {ds.engineType}
                          </Badge>
                        </div>
                      </div>
                      <Badge variant="success">
                        Active ({ds.latency})
                      </Badge>
                    </div>

                    <div className="mt-4 pt-4 border-t border-[#27272a] flex items-center justify-between text-xs text-zinc-400">
                      <span className="font-mono text-[11px] truncate max-w-[280px]">
                        {ds.maskedUri}
                      </span>
                      <span className="flex items-center gap-1">
                        <Table className="w-3.5 h-3.5 text-zinc-500" />
                        {ds.tablesCount} tables detected
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 3: API KEYS TAB */}
        {activeTab === 'keys' && (
          <div>
            <div className="mb-6">
              <h1 className="text-xl font-bold tracking-tight">Developer API Secret Keys</h1>
              <p className="text-sm text-zinc-400">
                Use your API secret key to sign guest HMAC-SHA256 JWTs in your SaaS backend.
              </p>
            </div>

            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle>Live Production Secret Key</CardTitle>
                <CardDescription>
                  Keep this key secret. Never expose it in client-side React code.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 bg-[#09090b] p-2.5 rounded-lg border border-[#27272a] font-mono text-xs">
                  <span className="text-zinc-300 flex-1 truncate">
                    lm_live_98a7sd8f7a6s5df09a8sd7f09a8sdf
                  </span>
                  <Badge variant="outline" className="text-indigo-400 border-indigo-500/20 bg-indigo-500/10">
                    Active
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* MODAL 1: ADD WIDGET DRAWER / MODAL */}
      <Dialog open={showAddWidgetModal} onOpenChange={setShowAddWidgetModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Dashboard Widget</DialogTitle>
            <DialogDescription>
              Select a chart type and metric to add to your customer-facing dashboard.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-xs py-2">
            <div>
              <label className="block text-zinc-300 font-medium mb-1.5">Widget Type</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'kpi', label: 'KPI Card', icon: TrendingUp },
                  { id: 'area', label: 'Area Chart', icon: LineChartIcon },
                  { id: 'bar', label: 'Bar Chart', icon: BarChart3 },
                  { id: 'table', label: 'Data Table', icon: Table },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setNewWidgetType(item.id as any)}
                    className={`p-3 rounded-lg border text-center transition-all flex flex-col items-center gap-1.5 ${
                      newWidgetType === item.id
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                        : 'bg-[#27272a] border-transparent text-zinc-400 hover:text-white'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="text-[11px] font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1.5">Widget Title</label>
              <Input
                value={newWidgetTitle}
                onChange={(e) => setNewWidgetTitle(e.target.value)}
                placeholder="e.g. Weekly New Signups"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1.5">Analytical Metric (Cube Schema)</label>
              <Input
                value={newWidgetMetric}
                onChange={(e) => setNewWidgetMetric(e.target.value)}
                placeholder="e.g. Users.count"
                className="font-mono text-[11px]"
              />
            </div>

            {newWidgetType !== 'kpi' && newWidgetType !== 'table' && (
              <div>
                <label className="block text-zinc-300 font-medium mb-1.5">Time Granularity</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['day', 'week', 'month'] as const).map((grain) => (
                    <Button
                      key={grain}
                      type="button"
                      variant={newWidgetGrain === grain ? 'default' : 'secondary'}
                      size="sm"
                      onClick={() => setNewWidgetGrain(grain)}
                      className="capitalize"
                    >
                      {grain}ly
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-zinc-300 font-medium mb-1.5">Accent Color</label>
              <div className="flex items-center gap-2">
                {['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewWidgetColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      newWidgetColor === c ? 'scale-125 ring-2 ring-white' : 'opacity-80 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#27272a]">
            <Button variant="ghost" onClick={() => setShowAddWidgetModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddWidget}>
              Add to Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: CONNECT DATABASE MODAL */}
      <Dialog open={showConnectModal} onOpenChange={setShowConnectModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Connect Analytical Database</DialogTitle>
            <DialogDescription>
              Enter your database connection string. Credentials are encrypted with AES-256 before saving.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-xs py-2">
            <div>
              <label className="block text-zinc-300 font-medium mb-1.5">Database Engine</label>
              <div className="grid grid-cols-4 gap-2">
                {['postgres', 'clickhouse', 'mysql', 'snowflake'].map((eng) => (
                  <Button
                    key={eng}
                    type="button"
                    variant={engineType === eng ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => {
                      setEngineType(eng);
                      setTestResult(null);
                    }}
                    className="capitalize"
                  >
                    {eng}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1.5">Connection Name</label>
              <Input
                value={dbName}
                onChange={(e) => setDbName(e.target.value)}
                placeholder="e.g. Production Analytics"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1.5">Connection URI</label>
              <Input
                value={connectionUri}
                onChange={(e) => {
                  setConnectionUri(e.target.value);
                  if (testResult) setTestResult(null);
                }}
                placeholder="postgres://lago:changeme@localhost:5432/loomina_metadata"
                className="font-mono text-[11px]"
              />
            </div>

            {/* USER-LEVEL ERROR & SUCCESS DIAGNOSTIC PANEL */}
            {testResult && (
              <div
                className={`p-4 rounded-xl border transition-all ${
                  testResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {testResult.success ? (
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-rose-500/20 flex items-center justify-center shrink-0 text-rose-400">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="font-semibold text-sm">
                      {testResult.success ? 'Connection Successful' : testResult.title || 'Connection Failed'}
                    </div>

                    <p className="text-xs mt-1 text-zinc-300 leading-relaxed">
                      {testResult.success ? testResult.message : testResult.userMessage}
                    </p>

                    {!testResult.success && testResult.actionableHint && (
                      <div className="mt-2.5 p-2.5 rounded-lg bg-[#09090b]/60 border border-rose-500/20 flex items-start gap-2 text-[11px] text-zinc-300">
                        <span className="text-amber-400 text-sm leading-none shrink-0">💡</span>
                        <div>
                          <span className="font-semibold text-white">How to fix: </span>
                          {testResult.actionableHint}
                        </div>
                      </div>
                    )}

                    {testResult.success && testResult.sampleTables && (
                      <div className="mt-2 text-[11px] text-zinc-300">
                        <span className="font-medium text-emerald-400">Discovered Tables: </span>
                        <span className="font-mono text-zinc-200">
                          {testResult.sampleTables.join(', ') || 'No public tables found'}
                        </span>
                      </div>
                    )}

                    {!testResult.success && testResult.technicalDetails && (
                      <div className="mt-2.5">
                        <button
                          type="button"
                          onClick={() => setShowTechDetails(!showTechDetails)}
                          className="text-[10px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition-colors"
                        >
                          <span>Technical error details</span>
                          {showTechDetails ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </button>
                        {showTechDetails && (
                          <pre className="mt-1.5 p-2 rounded bg-black/60 font-mono text-[10px] text-rose-400 overflow-x-auto whitespace-pre-wrap border border-[#27272a]">
                            {testResult.technicalDetails}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#27272a] flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={isTesting}
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400 mr-1.5" />
                  Testing...
                </>
              ) : (
                'Test Connection'
              )}
            </Button>

            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" onClick={() => setShowConnectModal(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSaveDataSource}>
                Save Data Source
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: EMBED CODE SNIPPET */}
      <Dialog open={showEmbedModal} onOpenChange={setShowEmbedModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Embed in Customer React App</DialogTitle>
            <DialogDescription>
              Add the lightweight <span className="font-mono text-indigo-400">@loomina/react</span> component to your React or Next.js app.
            </DialogDescription>
          </DialogHeader>

          <div className="relative my-2">
            <pre className="p-4 rounded-lg bg-[#09090b] border border-[#27272a] font-mono text-xs text-zinc-300 overflow-x-auto">
              {embedSnippet}
            </pre>
            <Button
              size="sm"
              variant="outline"
              onClick={copyToClipboard}
              className="absolute top-3 right-3"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>

          <div className="pt-4 border-t border-[#27272a] flex justify-end">
            <Button onClick={() => setShowEmbedModal(false)}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
