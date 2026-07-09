import { apiClient, API_BASE_URL } from './apiClient';
import * as signalR from '@microsoft/signalr';

const NOTIFICATION_HUB_URL = import.meta.env.VITE_NOTIFICATION_HUB_URL || `${API_BASE_URL}/notificationHub`;

export const createNotificationHubConnection = () => {
  return new signalR.HubConnectionBuilder()
    .withUrl(NOTIFICATION_HUB_URL, {
      accessTokenFactory: () => localStorage.getItem('accessToken') || '',
      transport: signalR.HttpTransportType.LongPolling // Force LongPolling to bypass WS Auth missing in Backend
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000])
    .configureLogging(signalR.LogLevel.Warning)
    .build();
};

export interface ApiNotification {
  notification_id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  target_type?: string;
  target_id?: string;
}

export const getNotifications = (): Promise<{ data: ApiNotification[] }> => {
  return apiClient('/api/notifications');
};

export const getUnreadNotificationCount = (): Promise<{ data: { count: number } }> => {
  return apiClient('/api/notifications/unread-count');
};

export const markAllNotificationsRead = (): Promise<{ success: boolean }> => {
  return apiClient('/api/notifications/mark-all-read', { method: 'PUT' });
};
