export type ChartType = 'line' | 'bar' | 'area' | 'donut' | 'kpi' | 'table' | 'funnel' | 'heatmap';

export interface TimeDimension {
  dimension: string;
  granularity?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  dateRange?: string | [string, string];
}

export interface QueryFilter {
  member: string;
  operator:
    | 'equals'
    | 'notEquals'
    | 'contains'
    | 'notContains'
    | 'gt'
    | 'gte'
    | 'lt'
    | 'lte'
    | 'set'
    | 'notSet';
  values: string[];
}

export interface CubeQuery {
  measures?: string[];
  dimensions?: string[];
  filters?: QueryFilter[];
  timeDimensions?: TimeDimension[];
  limit?: number;
  offset?: number;
  order?: Record<string, 'asc' | 'desc'>;
}

export interface ActionHandler {
  type: 'webhook' | 'client-event';
  targetUrl?: string;
  eventName?: string;
}

export interface WidgetAction {
  id: string;
  label: string;
  icon?: string;
  requiresConfirmation?: boolean;
  handler: ActionHandler;
}

export interface WidgetLayout {
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

export interface WidgetConfig {
  id: string;
  title: string;
  description?: string;
  type: ChartType;
  query: CubeQuery;
  layout: WidgetLayout;
  actions?: WidgetAction[];
  customOptions?: Record<string, unknown>;
}

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceBorder: string;
  primary: string;
  textPrimary: string;
  textMuted: string;
  palette: [string, string, string, string, string, string];
}

export interface ThemeConfig {
  mode: 'dark' | 'light';
  fontFamily?: string;
  radius?: string;
  colors?: Partial<ThemeColors>;
}

export interface DashboardConfig {
  id: string;
  organizationId: string;
  title: string;
  description?: string;
  widgets: WidgetConfig[];
  theme?: ThemeConfig;
  createdAt: string;
  updatedAt: string;
}

export interface JWTPayload {
  sub: string;
  organizationId: string;
  tenantId: string;
  role?: string;
  allowedDashboards?: string[];
  filters?: Record<string, unknown>;
  iat?: number;
  exp: number;
}
