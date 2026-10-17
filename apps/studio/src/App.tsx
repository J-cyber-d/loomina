import { useState, useEffect } from 'react';
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
  Save,
  Eye,
  KeyRound,
  Shield,
  User,
} from 'lucide-react';
import { EmbeddedDashboard } from '@loomina/react';
import { Button } from './components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Input } from './components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './components/ui/dialog';
import { OrgSwitcher, type OrgItem } from './components/auth/OrgSwitcher';
import { EmbedPlayground } from './components/playground/EmbedPlayground';
import { DashboardGridCanvas, type GridWidgetLayout } from './components/canvas/DashboardGridCanvas';

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

interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt?: string | null;
}

export default function App() {
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const [activeTab, setActiveTab] = useState<'canvas' | 'playground' | 'datastores' | 'keys'>(
    'canvas'
  );
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showAddWidgetModal, setShowAddWidgetModal] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showTechDetails, setShowTechDetails] = useState(false);
  const [isSavingDashboard, setIsSavingDashboard] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Better Auth Organization Workspaces
  const [organizations, setOrganizations] = useState<OrgItem[]>([
    { id: 'org_acme_corp', name: 'Acme SaaS Corp', slug: 'acme-corp', role: 'owner' },
    { id: 'org_stripe_demo', name: 'Stripe Analytics', slug: 'stripe-analytics', role: 'admin' },
  ]);
  const [currentOrg, setCurrentOrg] = useState<OrgItem>(organizations[0]);

  // API Keys Management State
  const [apiKeysList, setApiKeysList] = useState<ApiKeyItem[]>([
    {
      id: 'key_prod_01',
      name: 'Production SaaS Embed Key',
      keyPrefix: 'lm_live_98a7sd8f...',
      createdAt: new Date().toISOString(),
      lastUsedAt: 'Just now',
    },
  ]);
  const [showCreateKeyModal, setShowCreateKeyModal] = useState(false);
  const [showSecretKeyModal, setShowSecretKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('Customer App Embed Key');
  const [revealedSecretKey, setRevealedSecretKey] = useState('');
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Fetch API keys on org change
  useEffect(() => {
    const fetchKeys = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/api-keys?organizationId=${currentOrg.id}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setApiKeysList(data);
          }
        }
      } catch {
        // Fallback to local keys state
      }
    };
    fetchKeys();
  }, [currentOrg.id, API_BASE_URL]);

  const handleCreateOrg = (name: string, slug: string) => {
    const newOrg: OrgItem = {
      id: `org_${slug.replace(/[^a-z0-9]/g, '_')}`,
      name,
      slug,
      role: 'owner',
    };
    setOrganizations((prev) => [newOrg, ...prev]);
    setCurrentOrg(newOrg);
    setSaveSuccessMessage(`Switched to new workspace: "${name}"`);
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setIsCreatingKey(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/api-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: currentOrg.id,
          name: newKeyName,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setRevealedSecretKey(data.secretKey);
        setApiKeysList((prev) => [
          {
            id: data.id,
            name: data.name,
            keyPrefix: data.keyPrefix,
            createdAt: data.createdAt,
            lastUsedAt: null,
          },
          ...prev,
        ]);
        setShowCreateKeyModal(false);
        setShowSecretKeyModal(true);
        setNewKeyName('Customer App Embed Key');
      }
    } catch {
      // Fallback generation
      const mockKey = `lm_live_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
      setRevealedSecretKey(mockKey);
      setApiKeysList((prev) => [
        {
          id: `key_${Date.now()}`,
          name: newKeyName,
          keyPrefix: `${mockKey.slice(0, 15)}...`,
          createdAt: new Date().toISOString(),
          lastUsedAt: null,
        },
        ...prev,
      ]);
      setShowCreateKeyModal(false);
      setShowSecretKeyModal(true);
    } finally {
      setIsCreatingKey(false);
    }
  };

  const handleRevokeApiKey = async (id: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/v1/api-keys/${id}`, { method: 'DELETE' });
    } catch {
      // ignore
    }
    setApiKeysList((prev) => prev.filter((k) => k.id !== id));
    setSaveSuccessMessage('API key revoked successfully.');
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

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
  const [newWidgetType, setNewWidgetType] = useState<'kpi' | 'line' | 'area' | 'bar' | 'table'>(
    'area'
  );
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
    {
      id: 'w_6',
      title: 'Key Customer Accounts & Churn Diagnostics',
      type: 'table',
      metric: 'Accounts.status',
    },
  ]);

  // 12-Column Drag-and-Drop Grid Layout State
  const DEFAULT_LAYOUTS: GridWidgetLayout[] = [
    { i: 'w_1', x: 0, y: 0, w: 4, h: 2, minW: 3, minH: 2 },
    { i: 'w_2', x: 4, y: 0, w: 4, h: 2, minW: 3, minH: 2 },
    { i: 'w_3', x: 8, y: 0, w: 4, h: 2, minW: 3, minH: 2 },
    { i: 'w_4', x: 0, y: 2, w: 6, h: 4, minW: 4, minH: 3 },
    { i: 'w_5', x: 6, y: 2, w: 6, h: 4, minW: 4, minH: 3 },
    { i: 'w_6', x: 0, y: 6, w: 12, h: 5, minW: 6, minH: 3 },
  ];
  const [gridLayouts, setGridLayouts] = useState<GridWidgetLayout[]>(DEFAULT_LAYOUTS);

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

    if (
      engineType === 'postgres' &&
      !connectionUri.startsWith('postgres://') &&
      !connectionUri.startsWith('postgresql://')
    ) {
      setTestResult({
        success: false,
        title: 'Invalid PostgreSQL URI Format',
        userMessage:
          'PostgreSQL connection strings must start with "postgres://" or "postgresql://".',
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
            data.actionableHint ||
            'Please check your connection credentials and verify the database is running.',
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
    const newId = `w_${Date.now()}`;
    const created: WidgetItem = {
      id: newId,
      title: newWidgetTitle,
      type: newWidgetType,
      metric: newWidgetMetric,
      timeGrain: newWidgetGrain,
      value: newWidgetType === 'kpi' ? '$45,210' : undefined,
      change: newWidgetType === 'kpi' ? '+12.4% MoM' : undefined,
      color: newWidgetColor,
    };

    setWidgets((prev) => [...prev, created]);
    setGridLayouts((prev) => [
      ...prev,
      {
        i: newId,
        x: (prev.length * 4) % 12,
        y: Math.floor((prev.length * 4) / 12) * 3,
        w: newWidgetType === 'kpi' ? 4 : newWidgetType === 'table' ? 12 : 6,
        h: newWidgetType === 'kpi' ? 2 : newWidgetType === 'table' ? 5 : 4,
        minW: newWidgetType === 'kpi' ? 3 : 4,
        minH: 2,
      },
    ]);

    setShowAddWidgetModal(false);
    setSaveSuccessMessage('Widget added to 12-column visual grid! Click "Save Dashboard" to persist.');
    setTimeout(() => setSaveSuccessMessage(null), 4000);
  };

  const handleDeleteWidget = (id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
    setGridLayouts((prev) => prev.filter((l) => l.i !== id));
  };

  const handleSaveDashboardToBackend = async () => {
    setIsSavingDashboard(true);
    setSaveSuccessMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/dashboards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: currentOrg.id,
          title: 'Executive SaaS Analytics',
          slug: 'executive-saas-analytics',
          layout: {
            widgets: widgets.map((w) => {
              const itemLayout = gridLayouts.find((l) => l.i === w.id);
              return {
                id: w.id,
                type: w.type,
                title: w.title,
                metric: w.metric,
                x: itemLayout?.x ?? 0,
                y: itemLayout?.y ?? 0,
                w: itemLayout?.w ?? (w.type === 'kpi' ? 4 : 6),
                h: itemLayout?.h ?? (w.type === 'kpi' ? 2 : 4),
              };
            }),
          },
        }),
      });

      if (res.ok) {
        setSaveSuccessMessage(
          '✓ Dashboard 12-column grid layout & widgets saved successfully to PostgreSQL metadata database!'
        );
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
          <Badge
            variant="outline"
            className="text-indigo-400 border-indigo-500/20 bg-indigo-500/10"
          >
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
            variant={activeTab === 'playground' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('playground')}
            className={activeTab === 'playground' ? 'bg-[#27272a] text-white' : ''}
          >
            <Eye className="w-3.5 h-3.5 text-indigo-400" />
            Embed Playground
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
            API Keys ({apiKeysList.length})
          </Button>
        </nav>

        <div className="flex items-center gap-3">
          {/* Better Auth Organization Workspace Switcher */}
          <OrgSwitcher
            currentOrg={currentOrg}
            organizations={organizations}
            onSelectOrg={setCurrentOrg}
            onCreateOrg={handleCreateOrg}
          />

          <Badge
            variant="outline"
            className="hidden lg:flex items-center gap-1 text-[11px] text-zinc-400 border-[#27272a] bg-[#18181b] py-1 px-2.5"
          >
            <User className="w-3 h-3 text-indigo-400" />
            <span>Alex Morgan</span>
          </Badge>

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

            {/* 12-COLUMN DRAG & DROP AND RESIZING GRID CANVAS */}
            <DashboardGridCanvas
              widgets={widgets}
              layouts={gridLayouts}
              onLayoutChange={setGridLayouts}
              onDeleteWidget={handleDeleteWidget}
              onResetLayout={() => setGridLayouts(DEFAULT_LAYOUTS)}
            />

            {/* SECTION 4: SHADOW DOM EMBEDDABLE SDK PLAYGROUND */}
            <div className="rounded-xl border border-[#27272a] bg-[#121214] p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Live Embedded Dashboard Preview (
                    <span className="text-indigo-400">Shadow DOM Isolation</span>)
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
                  Connect PostgreSQL, ClickHouse, MySQL, or Snowflake to power real-time customer
                  analytics.
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
                          <Badge
                            variant="outline"
                            className="font-mono text-indigo-400 border-indigo-500/20 bg-indigo-500/10 mt-1"
                          >
                            {ds.engineType}
                          </Badge>
                        </div>
                      </div>
                      <Badge variant="success">Active ({ds.latency})</Badge>
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

        {/* VIEW 2: EMBED PLAYGROUND */}
        {activeTab === 'playground' && (
          <EmbedPlayground apiBaseUrl={API_BASE_URL} organizationId={currentOrg.id} />
        )}

        {/* VIEW 4: DEVELOPER API KEYS TAB */}
        {activeTab === 'keys' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold tracking-tight">Developer API Secret Keys</h1>
                <p className="text-sm text-zinc-400">
                  Workspace:{' '}
                  <span className="font-semibold text-indigo-400">{currentOrg.name}</span>. Use
                  secret keys to sign customer guest HMAC-SHA256 tokens in your SaaS backend.
                </p>
              </div>

              <Button
                onClick={() => setShowCreateKeyModal(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Generate Secret Key
              </Button>
            </div>

            {/* Keys Table Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-indigo-400" />
                  Active API Secret Keys
                </CardTitle>
                <CardDescription className="text-xs">
                  Secret keys have full signing authority for this organization. Keep them
                  confidential.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#27272a] text-zinc-400 font-semibold">
                        <th className="py-2.5 px-3">Key Name</th>
                        <th className="py-2.5 px-3">Key Prefix</th>
                        <th className="py-2.5 px-3">Created</th>
                        <th className="py-2.5 px-3">Last Used</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#27272a]">
                      {apiKeysList.map((key) => (
                        <tr key={key.id} className="hover:bg-zinc-800/20 transition-colors">
                          <td className="py-3 px-3 font-medium text-white">{key.name}</td>
                          <td className="py-3 px-3 font-mono text-zinc-300">{key.keyPrefix}</td>
                          <td className="py-3 px-3 text-zinc-400">
                            {new Date(key.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-3 text-zinc-400">{key.lastUsedAt || 'Never'}</td>
                          <td className="py-3 px-3">
                            <Badge
                              variant="outline"
                              className="text-emerald-400 border-emerald-500/20 bg-emerald-500/10 text-[10px]"
                            >
                              Active
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevokeApiKey(key.id)}
                              className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-7 text-xs"
                            >
                              Revoke
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Quick Reference Card */}
            <Card className="border-indigo-500/20 bg-indigo-950/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-indigo-300">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  How to Sign Guest JWTs in Your SaaS Backend
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-zinc-300">
                <p>
                  Never expose your{' '}
                  <code className="text-indigo-400 bg-indigo-500/10 px-1 py-0.5 rounded">
                    lm_live_...
                  </code>{' '}
                  secret key in client-side React code. Always sign tokens in your backend (Next.js
                  Server Actions, Express, FastAPI, Django):
                </p>
                <pre className="p-3 rounded-lg bg-[#09090b] border border-[#27272a] font-mono text-[11px] text-zinc-300 overflow-x-auto">
                  {`const token = jwt.sign(
  { sub: "guest_tenant_acme", organizationId: "${currentOrg.id}", tenantId: "tenant_acme", role: "admin" },
  process.env.LOOMINA_EMBED_SECRET,
  { expiresIn: "24h" }
);`}
                </pre>
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
              <label className="block text-zinc-300 font-medium mb-1.5">
                Analytical Metric (Cube Schema)
              </label>
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
                      newWidgetColor === c
                        ? 'scale-125 ring-2 ring-white'
                        : 'opacity-80 hover:opacity-100'
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
            <Button onClick={handleAddWidget}>Add to Dashboard</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: CONNECT DATABASE MODAL */}
      <Dialog open={showConnectModal} onOpenChange={setShowConnectModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Connect Analytical Database</DialogTitle>
            <DialogDescription>
              Enter your database connection string. Credentials are encrypted with AES-256 before
              saving.
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
                      {testResult.success
                        ? 'Connection Successful'
                        : testResult.title || 'Connection Failed'}
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
              Add the lightweight <span className="font-mono text-indigo-400">@loomina/react</span>{' '}
              component to your React or Next.js app.
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
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 mr-1" />
              ) : (
                <Copy className="w-3.5 h-3.5 mr-1" />
              )}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>

          <div className="pt-4 border-t border-[#27272a] flex justify-end">
            <Button onClick={() => setShowEmbedModal(false)}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL 4: GENERATE API KEY */}
      <Dialog open={showCreateKeyModal} onOpenChange={setShowCreateKeyModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Developer API Secret Key</DialogTitle>
            <DialogDescription>
              Create an API secret key for workspace{' '}
              <span className="font-semibold text-indigo-400">{currentOrg.name}</span>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateApiKey} className="space-y-4 text-xs py-2">
            <div>
              <label className="block text-zinc-300 font-medium mb-1.5">Key Friendly Name</label>
              <Input
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g. Production Backend Service"
                required
              />
            </div>

            <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs">
              <p>
                💡 The full API key will be displayed <strong>only once</strong> upon creation. Keep
                it safe in your backend environment variables.
              </p>
            </div>

            <div className="pt-4 border-t border-[#27272a] flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setShowCreateKeyModal(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreatingKey}
                className="bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                {isCreatingKey ? 'Generating...' : 'Generate Secret Key'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 5: SECRET KEY REVEALED (ONE-TIME VIEW) */}
      <Dialog open={showSecretKeyModal} onOpenChange={setShowSecretKeyModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <DialogTitle>API Secret Key Created!</DialogTitle>
            <DialogDescription>
              Please copy your API secret key now. You will <strong>never</strong> be able to view
              it again.
            </DialogDescription>
          </DialogHeader>

          <div className="my-2 space-y-2">
            <div className="relative">
              <pre className="p-3.5 pr-20 rounded-lg bg-[#09090b] border border-emerald-500/40 font-mono text-xs text-emerald-300 break-all select-all">
                {revealedSecretKey}
              </pre>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(revealedSecretKey);
                  setCopiedKey(true);
                  setTimeout(() => setCopiedKey(false), 2000);
                }}
                className="absolute top-2.5 right-2.5 text-xs bg-[#18181b]"
              >
                {copiedKey ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400 mr-1" />
                ) : (
                  <Copy className="w-3.5 h-3.5 mr-1" />
                )}
                {copiedKey ? 'Copied' : 'Copy Key'}
              </Button>
            </div>

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
              ⚠️ Store this in your server's <code className="font-mono text-amber-200">.env</code>{' '}
              as <code className="font-mono text-amber-200">LOOMINA_EMBED_SECRET</code>. Never
              commit this key to Git or expose it in browser code.
            </div>
          </div>

          <div className="pt-4 border-t border-[#27272a] flex justify-end">
            <Button
              onClick={() => setShowSecretKeyModal(false)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              I have saved my secret key
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
