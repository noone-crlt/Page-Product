export type MetricTone = 'blue' | 'green' | 'amber' | 'rose';
export type ActivityKind = 'order' | 'customer' | 'stock' | 'payment';
export type NotificationKind = 'success' | 'warning' | 'info';
export type DashboardStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

export interface DashboardMetric {
  id: string;
  label: string;
  value: number;
  format: 'currency' | 'number' | 'percent';
  change: number;
  comparison: string;
  tone: MetricTone;
}

export interface RevenuePoint {
  label: string;
  revenue: number;
  orders: number;
}

export interface SalesChannel {
  id: string;
  label: string;
  value: number;
  color: string;
}

export interface ActivityItem {
  id: string;
  title: string;
  detail: string;
  time: string;
  kind: ActivityKind;
}

export interface NotificationItem {
  id: string;
  title: string;
  detail: string;
  time: string;
  kind: NotificationKind;
  unread: boolean;
  originalType: string;
  targetType?: string;
  targetId?: string;
}

export interface TopProduct {
  id: string;
  name: string;
  category: string;
  sold: number;
  revenue: number;
  growth: number;
  stock: number;
  image?: string;
}

export interface DashboardFilters {
  period: '7d' | '30d' | '90d';
  channel: 'all' | 'website' | 'marketplace' | 'store';
  query: string;
}

export interface DashboardData {
  metrics: DashboardMetric[];
  revenue: RevenuePoint[];
  channels: SalesChannel[];
  activities: ActivityItem[];
  notifications: NotificationItem[];
  topProducts: TopProduct[];
}

export interface DashboardState {
  status: DashboardStatus;
  data: DashboardData;
  errorMessage: string;
}
