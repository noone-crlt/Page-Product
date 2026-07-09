import { useState, useEffect } from 'react';
import { message } from 'antd';
import { ApiNotification, getNotifications, getUnreadNotificationCount, markAllNotificationsRead, createNotificationHubConnection } from '../../services/notificationApi';
import { NotificationItem, NotificationKind } from '../types/dashboard';

const mapNotification = (apiNotif: ApiNotification): NotificationItem => {
  let kind: NotificationKind = 'info';
  if (apiNotif.type === 'success' || apiNotif.type === 'order') kind = 'success';
  else if (apiNotif.type === 'warning' || apiNotif.type === 'stock') kind = 'warning';

  // Calculate relative time
  const dateStr = apiNotif.created_at.endsWith('Z') ? apiNotif.created_at : apiNotif.created_at + 'Z';
  const notifTime = new Date(dateStr).getTime();
  const diffMins = Math.floor((Date.now() - notifTime) / 60000);
  let timeStr = `${diffMins} phút`;
  if (diffMins >= 60) {
    timeStr = `${Math.floor(diffMins / 60)} giờ`;
  }
  if (diffMins >= 1440) {
    timeStr = `${Math.floor(diffMins / 1440)} ngày`;
  }

  return {
    id: String(apiNotif.notification_id),
    title: apiNotif.title,
    detail: apiNotif.message,
    time: timeStr,
    kind,
    unread: !apiNotif.is_read,
    originalType: apiNotif.type,
    targetType: apiNotif.target_type,
    targetId: apiNotif.target_id,
  };
};

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const [notifRes, countRes] = await Promise.all([
        getNotifications(),
        getUnreadNotificationCount(),
      ]);
      if (notifRes?.data) {
        setNotifications(notifRes.data.map(mapNotification));
      }
      if (countRes?.data) {
        setUnreadCount(countRes.data.count);
      }
    } catch (error) {
      console.error('Failed to load notifications', error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const connection = createNotificationHubConnection();

    connection.on('ReceiveNotification', (apiNotif: ApiNotification) => {
      console.log('Có thông báo mới nè:', apiNotif);
      message.info(apiNotif.title);
      
      const newNotif = mapNotification(apiNotif);
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    const startSignalR = async () => {
      try {
        await connection.start();
        console.log('Đã kết nối thành công tới Notification Hub!');
      } catch (err) {
        console.error('Lỗi kết nối SignalR: ', err);
      }
    };

    startSignalR();

    return () => {
      connection.stop();
    };
  }, []);

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark notifications as read', error);
    }
  };

  return {
    notifications,
    unreadCount,
    markAllAsRead,
    refreshNotifications: fetchNotifications,
  };
};
