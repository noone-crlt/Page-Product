import { apiClient } from './apiClient';

export interface CustomerApiRecord {
  user_id?: string;
  id?: string;
  full_name?: string;
  name?: string;
  email?: string;
  phone_number?: string;
  phone?: string;
  total_spent?: number;
  total_orders?: number;
  created_at?: string;
  join_date?: string;
  is_active?: boolean;
  status?: string;
  reviews?: unknown[];
}

export const getCustomers = () =>
  apiClient('/api/customers');

export const getCustomerById = (userId: string) =>
  apiClient(`/api/customers/${encodeURIComponent(userId)}`);

export const activateCustomer = (userId: string) =>
  apiClient(`/api/customers/${encodeURIComponent(userId)}/activate`, {
    method: 'PUT',
  });

export const deactivateCustomer = (userId: string) =>
  apiClient(`/api/customers/${encodeURIComponent(userId)}/deactivate`, {
    method: 'PUT',
  });
