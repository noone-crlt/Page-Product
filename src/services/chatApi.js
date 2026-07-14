import * as signalR from '@microsoft/signalr';
import { apiClient, API_BASE_URL } from './apiClient';

const CHAT_HUB_URL = import.meta.env.VITE_CHAT_HUB_URL || `${API_BASE_URL}/chatHub`;

export const createChatHubConnection = () =>
  new signalR.HubConnectionBuilder()
    .withUrl(CHAT_HUB_URL, {
      accessTokenFactory: () => localStorage.getItem('accessToken') || '',
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000])
    .configureLogging(signalR.LogLevel.Warning)
    .build();

export const getMyChatRoom = () => apiClient('/api/chat/my-room');

export const getChatRooms = () => apiClient('/api/chat/rooms');

export const getChatMessages = (roomId) =>
  apiClient(`/api/chat/${encodeURIComponent(roomId)}/messages`);

export const sendChatMessage = (roomId, messageText) =>
  apiClient(`/api/chat/${encodeURIComponent(roomId)}/messages`, {
    method: 'POST',
    body: JSON.stringify({ messageText }),
  });

export const markChatRoomAsRead = (roomId) =>
  apiClient(`/api/chat/${encodeURIComponent(roomId)}/read`, { method: 'PUT' });

export { CHAT_HUB_URL };
