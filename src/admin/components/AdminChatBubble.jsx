import React, { useEffect, useRef, useState } from 'react';
import {
  createChatHubConnection,
  getChatMessages,
  getChatRooms,
  markChatRoomAsRead,
  sendChatMessage,
} from '../../services/chatApi';

const getResponseData = (response) => response?.data ?? response;
const getRoomId = (room) => {
  if (typeof room === 'number' || typeof room === 'string') return room;
  return room?.roomId
    ?? room?.room_id
    ?? room?.chatRoomId
    ?? room?.chat_room_id
    ?? room?.id;
};

const getRoomItems = (response) => {
  const data = getResponseData(response);
  if (Array.isArray(data)) return data;
  return data?.rooms ?? data?.items ?? data?.chatRooms ?? data?.chat_rooms ?? [];
};

const getMessageItems = (response) => {
  const data = getResponseData(response);
  if (Array.isArray(data)) return data;
  return data?.messages ?? data?.items ?? data?.chatMessages ?? data?.chat_messages ?? [];
};

const getUnreadCount = (room) => {
  const count = room?.unreadCount
    ?? room?.unread_count
    ?? room?.unreadMessages
    ?? room?.unread_messages
    ?? room?.unreadMessageCount
    ?? room?.unread_message_count;
  if (count !== undefined && count !== null) return Math.max(0, Number(count) || 0);

  const isRead = room?.isRead ?? room?.is_read ?? room?.lastMessageIsRead ?? room?.last_message_is_read;
  return isRead === false ? 1 : 0;
};

const getUserIdFromToken = () => {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    const encodedPayload = token.split('.')[1];
    const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')));
    return payload?.sub
      ?? payload?.userId
      ?? payload?.user_id
      ?? payload?.nameid
      ?? payload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
  } catch {
    return null;
  }
};

const normalizeReadStatus = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return ['true', 'read', 'seen'].includes(value.trim().toLowerCase());
  }
  return Boolean(value);
};

const toMessage = (item, userId) => ({
  id: item?.chatMessageId ?? item?.chat_message_id ?? item?.id,
  roomId: item?.roomId ?? item?.room_id ?? item?.chatRoomId ?? item?.chat_room_id,
  text: item?.messageText ?? item?.message_text ?? item?.text ?? '',
  mine: String(item?.senderId ?? item?.sender_id) === String(userId),
  isRead: normalizeReadStatus(
    item?.isRead
      ?? item?.is_read
      ?? item?.readAt
      ?? item?.read_at
      ?? item?.isSeen
      ?? item?.is_seen
      ?? item?.seenAt
      ?? item?.seen_at,
  ),
});

export default function AdminChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const connectionRef = useRef(null);
  const connectionPromiseRef = useRef(null);
  const connectionGenerationRef = useRef(0);
  const isOpenRef = useRef(false);
  const selectedRoomIdRef = useRef(null);
  const knownMessageIdsRef = useRef(new Set());
  const userIdRef = useRef(getUserIdFromToken());
  const messagesEndRef = useRef(null);
  const totalUnreadCount = rooms.reduce((total, room) => total + getUnreadCount(room), 0);

  const loadRooms = async () => {
    try {
      const loadedRooms = getRoomItems(await getChatRooms());
      const activeRoomId = selectedRoomIdRef.current;
      setRooms(loadedRooms.map((room) => (
        activeRoomId && String(getRoomId(room)) === String(activeRoomId)
          ? {
              ...room,
              unreadCount: 0,
              unread_count: 0,
              isRead: true,
              is_read: true,
            }
          : room
      )));
    } catch (loadError) {
      console.error('Lỗi tải phòng chat:', loadError);
      setError(loadError.message || 'Không thể tải danh sách phòng chat.');
    }
  };

  const replaceMessages = (items) => {
    const normalized = Array.isArray(items)
      ? items.map((item) => toMessage(item, userIdRef.current)).filter((item) => item.text)
      : [];
    knownMessageIdsRef.current = new Set(normalized.map((item) => item.id).filter(Boolean));
    setMessages((current) => {
      const currentById = new Map(
        current
          .filter((message) => message.id !== undefined && message.id !== null)
          .map((message) => [String(message.id), message]),
      );

      return normalized.map((message) => {
        const existing = currentById.get(String(message.id));
        return existing?.isRead && !message.isRead
          ? { ...message, isRead: true }
          : message;
      });
    });
  };

  const appendMessage = (item) => {
    const message = toMessage(item, userIdRef.current);
    if (!message.text) return false;
    if (message.roomId && selectedRoomIdRef.current && String(message.roomId) !== String(selectedRoomIdRef.current)) return false;
    if (message.id && knownMessageIdsRef.current.has(message.id)) return false;
    if (message.id) knownMessageIdsRef.current.add(message.id);
    setMessages((current) => [...current, message]);
    return true;
  };

  const markRoomAsRead = async (roomId) => {
    if (!roomId) return;

    setRooms((current) => current.map((room) => (
      String(getRoomId(room)) === String(roomId)
        ? {
            ...room,
            unreadCount: 0,
            unread_count: 0,
            isRead: true,
            is_read: true,
          }
        : room
    )));
    setMessages((current) => current.map((message) => (
      message.mine ? message : { ...message, isRead: true }
    )));

    try {
      await markChatRoomAsRead(roomId);
      if (String(selectedRoomIdRef.current) === String(roomId)) {
        replaceMessages(getMessageItems(await getChatMessages(roomId)));
      }
    } catch (markError) {
      console.error('Không thể đánh dấu phòng chat đã đọc:', markError);
    }
  };

  const disconnect = () => {
    connectionGenerationRef.current += 1;
    const connection = connectionRef.current;
    const roomId = selectedRoomIdRef.current;
    connectionRef.current = null;
    connectionPromiseRef.current = null;

    if (!connection) return;
    connection.off('ReceiveMessage');
    connection.off('RoomUpdated');
    void (async () => {
      try {
        if (roomId) await connection.invoke('LeaveRoom', roomId);
      } catch {
        // Kết nối có thể đã đóng trước khi LeaveRoom hoàn tất.
      } finally {
        await connection.stop().catch(() => undefined);
      }
    })();
  };

  const connect = async () => {
    if (connectionRef.current) return connectionRef.current;
    if (connectionPromiseRef.current) return connectionPromiseRef.current;

    const generation = connectionGenerationRef.current;
    let pendingPromise;
    pendingPromise = (async () => {
      const connection = createChatHubConnection();
      connection.on('RoomUpdated', (updatedRoomId) => {
        void loadRooms();
        if (
          selectedRoomIdRef.current
          && (!updatedRoomId || String(updatedRoomId) === String(selectedRoomIdRef.current))
        ) {
          void getChatMessages(selectedRoomIdRef.current)
            .then((response) => replaceMessages(getMessageItems(response)))
            .catch(() => undefined);
        }
      });
      connection.on('ReceiveMessage', (item) => {
        const incomingMessage = toMessage(item, userIdRef.current);
        const messageRoomId = incomingMessage.roomId;
        if (messageRoomId && String(messageRoomId) !== String(selectedRoomIdRef.current)) {
          void loadRooms();
          return;
        }
        appendMessage(item);
        if (!incomingMessage.mine && selectedRoomIdRef.current) {
          void markRoomAsRead(selectedRoomIdRef.current);
        }
        void loadRooms();
      });
      connection.onreconnected(async () => {
        if (selectedRoomIdRef.current) {
          await connection.invoke('JoinRoom', selectedRoomIdRef.current);
          replaceMessages(getMessageItems(await getChatMessages(selectedRoomIdRef.current)));
          await markRoomAsRead(selectedRoomIdRef.current);
        }
        await loadRooms();
      });
      connection.onclose(() => {
        if (connectionRef.current === connection) connectionRef.current = null;
      });

      try {
        await connection.start();
        if (generation !== connectionGenerationRef.current) {
          await connection.stop();
          return null;
        }
        connectionRef.current = connection;
        return connection;
      } catch (connectionError) {
        await connection.stop().catch(() => undefined);
        throw connectionError;
      } finally {
        if (connectionPromiseRef.current === pendingPromise) connectionPromiseRef.current = null;
      }
    })();

    connectionPromiseRef.current = pendingPromise;
    return pendingPromise;
  };

  const openWidget = async () => {
    isOpenRef.current = true;
    setIsOpen(true);
    setIsLoading(true);
    setError('');
    try {
      await Promise.all([connect(), loadRooms()]);
    } catch (connectionError) {
      console.error('Lỗi kết nối SignalR:', connectionError);
      setError(connectionError.message || 'Không thể kết nối tới hệ thống chat.');
    } finally {
      setIsLoading(false);
    }
  };

  const closeWidget = () => {
    isOpenRef.current = false;
    const connection = connectionRef.current;
    const roomId = selectedRoomIdRef.current;
    if (connection && roomId) {
      void connection.invoke('LeaveRoom', roomId).catch(() => undefined);
    }
    selectedRoomIdRef.current = null;
    knownMessageIdsRef.current = new Set();
    setSelectedRoom(null);
    setMessages([]);
    setMessageText('');
    setIsOpen(false);
  };

  const selectRoom = async (room) => {
    const nextRoomId = getRoomId(room);
    if (!nextRoomId) return;

    setIsLoading(true);
    setError('');
    try {
      const connection = await connect();
      if (!connection) return;
      const previousRoomId = selectedRoomIdRef.current;
      if (previousRoomId && String(previousRoomId) !== String(nextRoomId)) {
        await connection.invoke('LeaveRoom', previousRoomId).catch(() => undefined);
      }

      selectedRoomIdRef.current = nextRoomId;
      setSelectedRoom(room);
      await connection.invoke('JoinRoom', nextRoomId);
      replaceMessages(getMessageItems(await getChatMessages(nextRoomId)));
      await markRoomAsRead(nextRoomId);
    } catch (loadError) {
      console.error('Lỗi tải tin nhắn:', loadError);
      setError(loadError.message || 'Không thể tải nội dung cuộc trò chuyện.');
    } finally {
      setIsLoading(false);
    }
  };

  const send = async (event) => {
    event.preventDefault();
    const roomId = selectedRoomIdRef.current;
    const text = messageText.trim();
    if (!roomId || !text || isLoading) return;

    setMessageText('');
    setError('');
    try {
      const result = getResponseData(await sendChatMessage(roomId, text));
      if (result && !Array.isArray(result)) appendMessage(result);
    } catch (sendError) {
      console.error('Lỗi gửi tin nhắn:', sendError);
      setError(sendError.message || 'Không thể gửi tin nhắn.');
    }
  };

  useEffect(() => {
    const roomId = getRoomId(selectedRoom);
    if (!isOpen || !roomId) return undefined;

    let isRefreshing = false;
    const refreshTimer = window.setInterval(async () => {
      if (isRefreshing || String(selectedRoomIdRef.current) !== String(roomId)) return;
      isRefreshing = true;
      try {
        replaceMessages(getMessageItems(await getChatMessages(roomId)));
      } catch {
        // Giữ trạng thái hiện tại khi lần đồng bộ nền thất bại.
      } finally {
        isRefreshing = false;
      }
    }, 3000);

    return () => window.clearInterval(refreshTimer);
  }, [isOpen, selectedRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    void Promise.all([connect(), loadRooms()]).catch((connectionError) => {
      console.error('Lỗi kết nối SignalR:', connectionError);
      setError(connectionError.message || 'Không thể kết nối tới hệ thống chat.');
    });

    return () => disconnect();
  }, []);

  return (
    <>
      <button
        className="ai-bubble-trigger"
        onClick={isOpen ? closeWidget : openWidget}
        aria-label={isOpen ? 'Đóng chat khách hàng' : 'Mở chat khách hàng'}
        title="Chat với khách hàng"
      >
        {isOpen ? <i className="ri-close-line" aria-hidden="true" /> : <i className="ri-customer-service-2-line" aria-hidden="true" />}
        {totalUnreadCount > 0 && (
          <span className="ai-bubble-unread-badge" aria-label={`${totalUnreadCount} tin nhắn chưa đọc`}>
            {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="ai-bubble-window admin-chat-window">
          <div className="ai-chat-container admin-chat-container">
            <aside className="admin-chat-rooms">
              <strong className="admin-chat-rooms__title">Cuộc trò chuyện</strong>
              {rooms.map((room) => {
                const roomId = getRoomId(room);
                return (
                  <button
                    key={roomId}
                    type="button"
                    className={`admin-chat-room ${roomId === getRoomId(selectedRoom) ? 'admin-chat-room--active' : ''}`}
                    onClick={() => selectRoom(room)}
                  >
                    <span className="admin-chat-room__name">
                      {room.customerName
                        ?? room.customer_name
                        ?? room.customerFullName
                        ?? room.customer_full_name
                        ?? room.userName
                        ?? room.user_name
                        ?? `Phòng #${roomId}`}
                    </span>
                    {getUnreadCount(room) > 0 && (
                      <span className="admin-chat-room__badge" aria-label={`${getUnreadCount(room)} tin nhắn chưa đọc`}>
                        {getUnreadCount(room) > 99 ? '99+' : getUnreadCount(room)}
                      </span>
                    )}
                  </button>
                );
              })}
            </aside>

            <section className="admin-chat-conversation">
              <div className="ai-chat-header">
                <span className="ai-chat-title">Chat với khách hàng</span>
                <button className="ai-chat-close-btn" onClick={closeWidget} aria-label="Đóng chat khách hàng">
                  <i className="ri-close-line" aria-hidden="true" />
                </button>
              </div>
              <div className="ai-chat-messages" aria-live="polite">
                {!selectedRoom && !isLoading && (
                  <div className="ai-message ai">Chọn một cuộc trò chuyện để bắt đầu hỗ trợ.</div>
                )}
                {messages.map((item, index) => (
                  <div key={item.id ?? index} className={`ai-message ${item.mine ? 'user' : 'ai'}`}>
                    <span style={{ whiteSpace: 'pre-wrap' }}>{item.text}</span>
                    <span className={`admin-message-status ${item.isRead ? 'admin-message-status--read' : ''}`}>
                      <i className={item.isRead ? 'ri-check-double-line' : 'ri-check-line'} aria-hidden="true" />
                      {item.isRead ? 'Đã đọc' : 'Chưa đọc'}
                    </span>
                  </div>
                ))}
                {isLoading && (
                  <div className="ai-message typing" aria-label="Đang tải cuộc trò chuyện">
                    <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                  </div>
                )}
                {error && <div className="ai-message ai ai-message--error" role="alert">{error}</div>}
                <div ref={messagesEndRef} />
              </div>
              <form className="ai-chat-input-bar" onSubmit={send}>
                <input
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                  disabled={!selectedRoom || isLoading}
                  placeholder="Nhập phản hồi cho khách hàng..."
                />
                <button type="submit" disabled={!selectedRoom || isLoading || !messageText.trim()} aria-label="Gửi phản hồi">
                  <i className="ri-send-plane-2-line" aria-hidden="true" />
                </button>
              </form>
            </section>
          </div>
        </div>
      )}
    </>
  );
}
