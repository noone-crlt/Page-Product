import { apiClient } from './apiClient';

export interface DashboardStats {
  total_new_customers: number;
  total_revenue: number;
  total_successful_orders: number;
}

export interface DashboardTopSellingVariant {
  product_variant_id: number;
  color: string;
  storage: string;
  stock_quantity: number;
  total_sold: number;
  price: number;
}

export interface DashboardTopSelling {
  product_id: number;
  product_name: string;
  category_name: string;
  total_sold: number;
  total_revenue: number;
  variants: DashboardTopSellingVariant[];
}

export interface DashboardRevenue {
  date: string;
  revenue: number;
}

export const getDashboardStats = (): Promise<{ data: DashboardStats }> => {
  return apiClient('/api/dashboard/stats');
};

export const getTopSelling = (): Promise<{ data: DashboardTopSelling[] }> => {
  return apiClient('/api/dashboard/top-selling');
};

export const getRevenueLast7Days = (): Promise<{ data: DashboardRevenue[] }> => {
  return apiClient('/api/dashboard/revenue-last-7-days');
};
