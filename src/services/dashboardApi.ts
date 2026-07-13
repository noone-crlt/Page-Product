import { apiClient, API_BASE_URL } from './apiClient';

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

export const getDashboardStats = (fromDate?: string, toDate?: string): Promise<{ data: DashboardStats }> => {
  const query = new URLSearchParams();
  if (fromDate) query.append('fromDate', fromDate);
  if (toDate) query.append('toDate', toDate);
  return apiClient(`/api/dashboard/stats${query.toString() ? `?${query.toString()}` : ''}`);
};

export const getTopSelling = (fromDate?: string, toDate?: string): Promise<{ data: DashboardTopSelling[] }> => {
  const query = new URLSearchParams();
  if (fromDate) query.append('fromDate', fromDate);
  if (toDate) query.append('toDate', toDate);
  return apiClient(`/api/dashboard/top-selling${query.toString() ? `?${query.toString()}` : ''}`);
};

export const getRevenueLast7Days = (fromDate?: string, toDate?: string): Promise<{ data: DashboardRevenue[] }> => {
  const query = new URLSearchParams();
  if (fromDate) query.append('fromDate', fromDate);
  if (toDate) query.append('toDate', toDate);
  return apiClient(`/api/dashboard/revenue-last-7-days${query.toString() ? `?${query.toString()}` : ''}`);
};

export interface DashboardRevenueByCategory {
  category_name: string;
  total_revenue: string | number;
}

export const getRevenueByCategory = (fromDate?: string, toDate?: string): Promise<{ data: DashboardRevenueByCategory[] }> => {
  const query = new URLSearchParams();
  if (fromDate) query.append('fromDate', fromDate);
  if (toDate) query.append('toDate', toDate);
  return apiClient(`/api/dashboard/revenue-by-category${query.toString() ? `?${query.toString()}` : ''}`);
};

export const exportTopSelling = async (fromDate?: string, toDate?: string): Promise<Blob> => {
  const query = new URLSearchParams();
  if (fromDate) query.append('fromDate', fromDate);
  if (toDate) query.append('toDate', toDate);

  const accessToken = localStorage.getItem('accessToken');
  const headers = new Headers();
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_BASE_URL}/api/dashboard/top-selling/export${query.toString() ? `?${query.toString()}` : ''}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error('Export failed');
  }

  return response.blob();
};
