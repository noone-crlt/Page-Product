import React, { useEffect, useRef, useState } from 'react';
import {
  createChatHubConnection,
  getChatMessages,
  getMyChatRoom,
  markChatRoomAsRead,
  sendChatMessage,
} from '../../services/chatApi';
import { useApp } from '../../context/AppContext';
import HomeChatBox, { useAIChat } from './HomeChatBox';
import './Chat.css';

const getResponseData = (response) => response?.data ?? response;

const getRoomData = (response) => {
  const data = getResponseData(response);
  return data?.room ?? data?.chatRoom ?? data?.chat_room ?? data;
};

const getMessageItems = (response) => {
  const data = getResponseData(response);
  if (Array.isArray(data)) return data;
  return data?.messages ?? data?.items ?? data?.chatMessages ?? data?.chat_messages ?? [];
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

const getRoomId = (room) => {
  if (typeof room === 'number' || typeof room === 'string') return room;
  return room?.roomId
    ?? room?.room_id
    ?? room?.chatRoomId
    ?? room?.chat_room_id
    ?? room?.id;
};

const getRoomUnreadCount = (room) => {
  const count = room?.unreadCount
    ?? room?.unread_count
    ?? room?.unreadMessages
    ?? room?.unread_messages
    ?? room?.unreadMessageCount
    ?? room?.unread_message_count;
  if (count !== undefined && count !== null) return Math.max(0, Number(count) || 0);

  const isRead = room?.isRead ?? room?.is_read ?? room?.lastMessageIsRead ?? room?.last_message_is_read;
  if (isRead === false) return 1;
  if (isRead === true) return 0;
  return null;
};

const toAdminMessage = (item, userId) => {
  const readStatus = item?.isRead ?? item?.is_read ?? item?.readAt ?? item?.read_at;
  return {
    id: item?.chatMessageId ?? item?.chat_message_id ?? item?.id,
    roomId: item?.roomId ?? item?.room_id ?? item?.chatRoomId ?? item?.chat_room_id,
    text: item?.messageText ?? item?.message_text ?? item?.text ?? '',
    isMine: String(item?.senderId ?? item?.sender_id) === String(userId),
    isRead: readStatus === undefined || readStatus === null ? null : Boolean(readStatus),
  };
};

function AdminMessageList({ messages, isLoading, error, messagesEndRef }) {
  return (
    <div className="ai-chat-messages" aria-live="polite">
      {messages.map((message, index) => (
        <div key={message.id ?? index} className={`ai-message ${message.isMine ? 'user' : 'ai'}`}>
          <span style={{ whiteSpace: 'pre-wrap' }}>{message.text}</span>
          <span className={`admin-message-status ${message.isRead ? 'admin-message-status--read' : ''}`}>
            <i className={message.isRead ? 'ri-check-double-line' : 'ri-check-line'} aria-hidden="true" />
            {message.isRead ? 'Đã đọc' : 'Chưa đọc'}
          </span>
        </div>
      ))}

      {isLoading && (
        <div className="ai-message typing" aria-label="Đang tải cuộc trò chuyện">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
      )}

      {error && (
        <div className="ai-message ai ai-message--error" role="alert">
          <i className="ri-error-warning-line" aria-hidden="true" /> {error}
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}

function AdminChatInput({ value, onChange, onSubmit, disabled, inputRef }) {
  return (
    <form className="ai-chat-input-bar" onSubmit={onSubmit}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Nhập tin nhắn của bạn..."
        disabled={disabled}
      />
      <button type="submit" disabled={disabled || !value.trim()} aria-label="Gửi tin nhắn cho quản trị viên">
        <i className="ri-send-plane-2-line" aria-hidden="true" />
      </button>
    </form>
  );
}

export default function ChatBubble() {
  const { user } = useApp();
  const aiChat = useAIChat();
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [activeTab, setActiveTab] = useState('ai');
  const [adminUnreadCount, setAdminUnreadCount] = useState(0);
  const [adminMessages, setAdminMessages] = useState([]);
  const [adminInput, setAdminInput] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');

  const connectionRef = useRef(null);
  const connectionPromiseRef = useRef(null);
  const connectionGenerationRef = useRef(0);
  const roomIdRef = useRef(null);
  const userIdRef = useRef(null);
  const knownMessageIdsRef = useRef(new Set());
  const activeTabRef = useRef('ai');
  const isOpenRef = useRef(false);
  const adminMessagesEndRef = useRef(null);
  const adminInputRef = useRef(null);

  const replaceAdminMessages = (items) => {
    const normalized = Array.isArray(items)
      ? items.map((item) => toAdminMessage(item, userIdRef.current)).filter((item) => item.text)
      : [];
    knownMessageIdsRef.current = new Set(normalized.map((item) => item.id).filter(Boolean));
    setAdminMessages((current) => {
      const unchanged = current.length === normalized.length
        && current.every((message, index) => (
          message.id === normalized[index].id
          && message.text === normalized[index].text
          && message.isRead === normalized[index].isRead
          && message.isMine === normalized[index].isMine
        ));
      return unchanged ? current : normalized;
    });
    if (!isOpenRef.current || activeTabRef.current !== 'admin') {
      const unreadFromMessages = normalized.filter((item) => !item.isMine && item.isRead === false).length;
      if (unreadFromMessages > 0) setAdminUnreadCount(unreadFromMessages);
    }
  };

  const appendAdminMessage = (item) => {
    const message = toAdminMessage(item, userIdRef.current);
    if (!message.text) return false;
    if (message.roomId && roomIdRef.current && String(message.roomId) !== String(roomIdRef.current)) return false;
    if (message.id && knownMessageIdsRef.current.has(message.id)) return false;
    if (message.id) knownMessageIdsRef.current.add(message.id);
    setAdminMessages((current) => [...current, message]);
    return true;
  };

  const refreshAdminMessages = async () => {
    if (!roomIdRef.current) return;
    const response = await getChatMessages(roomIdRef.current);
    replaceAdminMessages(getMessageItems(response));
  };

  const markAdminChatAsRead = async () => {
    if (!roomIdRef.current) return;
    try {
      await markChatRoomAsRead(roomIdRef.current);
      setAdminUnreadCount(0);
      setAdminMessages((current) => current.map((message) => (
        message.isMine ? message : { ...message, isRead: true }
      )));
    } catch (error) {
      console.error('Không thể đánh dấu phòng chat đã đọc:', error);
    }
  };

  const disconnectAdminChat = () => {
    connectionGenerationRef.current += 1;
    const connection = connectionRef.current;
    const roomId = roomIdRef.current;
    connectionRef.current = null;
    connectionPromiseRef.current = null;
    roomIdRef.current = null;

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

  const initializeAdminChat = async () => {
    if (!localStorage.getItem('accessToken')) {
      setAdminError('Vui lòng đăng nhập để nhắn tin với nhân viên hỗ trợ.');
      return;
    }

    if (connectionRef.current) {
      await refreshAdminMessages();
      return;
    }
    if (connectionPromiseRef.current) return connectionPromiseRef.current;

    const generation = connectionGenerationRef.current;
    let connectionPromise;
    connectionPromise = (async () => {
      setAdminLoading(true);
      setAdminError('');
      let connection;

      try {
        const roomResponse = await getMyChatRoom();
        const room = getRoomData(roomResponse);
        const roomId = getRoomId(room);
        if (!roomId) {
          console.error('Phản hồi API phòng chat không có ID hợp lệ:', roomResponse);
          throw new Error('Không tìm thấy mã phòng chat trong phản hồi của máy chủ.');
        }

        roomIdRef.current = roomId;
        const responseData = getResponseData(roomResponse);
        const unreadCount = getRoomUnreadCount(responseData) ?? getRoomUnreadCount(room);
        if (unreadCount !== null) setAdminUnreadCount(unreadCount);
        userIdRef.current = room?.userId
          ?? room?.user_id
          ?? room?.customerId
          ?? room?.customer_id
          ?? getUserIdFromToken();
        await refreshAdminMessages();

        connection = createChatHubConnection();
        connection.on('RoomUpdated', (updatedRoomId) => {
          if (
            updatedRoomId
            && roomIdRef.current
            && String(updatedRoomId) !== String(roomIdRef.current)
          ) return;
          void refreshAdminMessages();
        });
        connection.on('ReceiveMessage', (item) => {
          const wasAdded = appendAdminMessage(item);
          if (!wasAdded) return;

          const message = toAdminMessage(item, userIdRef.current);
          if (!message.isMine && (!isOpenRef.current || activeTabRef.current !== 'admin')) {
            setAdminUnreadCount((count) => count + 1);
          } else if (!message.isMine) {
            void markAdminChatAsRead();
          }
        });
        connection.onreconnected(async () => {
          if (!roomIdRef.current) return;
          await connection.invoke('JoinRoom', roomIdRef.current);
          await refreshAdminMessages();
          if (isOpenRef.current && activeTabRef.current === 'admin') await markAdminChatAsRead();
        });
        connection.onclose(() => {
          if (connectionRef.current === connection) connectionRef.current = null;
        });

        await connection.start();
        if (generation !== connectionGenerationRef.current) {
          await connection.stop();
          return;
        }
        await connection.invoke('JoinRoom', roomId);
        connectionRef.current = connection;
        if (isOpenRef.current && activeTabRef.current === 'admin') {
          await markAdminChatAsRead();
        }
      } catch (error) {
        await connection?.stop().catch(() => undefined);
        if (error?.status === 401) disconnectAdminChat();
        setAdminError(error.message || 'Không thể kết nối tới hệ thống chat. Vui lòng thử lại.');
        console.error('Lỗi khởi tạo chat với quản trị viên:', error);
      } finally {
        setAdminLoading(false);
        if (connectionPromiseRef.current === connectionPromise) {
          connectionPromiseRef.current = null;
        }
      }
    })();

    connectionPromiseRef.current = connectionPromise;
    return connectionPromise;
  };

  const selectTab = (tab) => {
    activeTabRef.current = tab;
    setActiveTab(tab);
    if (tab !== 'admin') return;

    setAdminUnreadCount(0);
    void initializeAdminChat().then(() => {
      void markAdminChatAsRead();
      requestAnimationFrame(() => adminMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }));
      adminInputRef.current?.focus();
    });
  };

  const closeWidget = () => {
    isOpenRef.current = false;
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 250);
  };

  const toggleWidget = () => {
    if (isOpen) {
      closeWidget();
      return;
    }
    activeTabRef.current = 'ai';
    isOpenRef.current = true;
    setActiveTab('ai');
    setIsOpen(true);
  };

  const sendAdminMessage = async (event) => {
    event.preventDefault();
    const messageText = adminInput.trim();
    if (!messageText || adminLoading || !roomIdRef.current) return;

    setAdminInput('');
    setAdminError('');
    setAdminLoading(true);
    try {
      const response = await sendChatMessage(roomIdRef.current, messageText);
      const sentMessage = getResponseData(response);
      if (sentMessage && !Array.isArray(sentMessage)) appendAdminMessage(sentMessage);
    } catch (error) {
      if (error?.status === 401) disconnectAdminChat();
      setAdminError(error.message || 'Không thể gửi tin nhắn. Vui lòng thử lại.');
      console.error('Lỗi gửi tin nhắn:', error);
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'admin') {
      adminMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTab, adminMessages, adminLoading]);

  useEffect(() => {
    if (!isOpen || activeTab !== 'admin' || adminLoading || !roomIdRef.current) return undefined;

    let isRefreshing = false;
    const refreshTimer = window.setInterval(async () => {
      if (isRefreshing) return;
      isRefreshing = true;
      try {
        await refreshAdminMessages();
      } catch (error) {
        console.error('Không thể đồng bộ trạng thái đã đọc:', error);
      } finally {
        isRefreshing = false;
      }
    }, 3000);

    return () => window.clearInterval(refreshTimer);
  }, [isOpen, activeTab, adminLoading]);

  useEffect(() => {
    if (user && localStorage.getItem('accessToken')) {
      void initializeAdminChat();
    } else if (!localStorage.getItem('accessToken')) {
      disconnectAdminChat();
      setAdminUnreadCount(0);
    }
  }, [user]);

  useEffect(() => () => {
      isOpenRef.current = false;
      disconnectAdminChat();
  }, []);

  return (
    <>
      <button
        className="ai-bubble-trigger"
        onClick={toggleWidget}
        aria-label={isOpen ? 'Đóng cửa sổ tư vấn' : 'Mở cửa sổ tư vấn'}
        title="Tư vấn trực tuyến"
      >
        {isOpen
          ? <i className="ri-close-line" aria-hidden="true" />
          : (
            <div className="ai-bubble-avatar-wrapper">
              <i className="ri-customer-service-2-line" aria-hidden="true" />
              <span className="ai-bubble-online-badge" />
            </div>
          )}
        {!isOpen && adminUnreadCount > 0 && (
          <span className="ai-bubble-unread-badge" aria-label={`${adminUnreadCount} tin nhắn chưa đọc`}>
            {adminUnreadCount > 99 ? '99+' : adminUnreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={`ai-bubble-window ${isClosing ? 'closing' : ''}`}>
          <div className="ai-chat-container support-chat-container">
            <div className="ai-chat-header">
              <div className="ai-chat-header-info">
                <div className="ai-chat-avatar"><i className="ri-customer-service-2-line" aria-hidden="true" /></div>
                <div className="ai-chat-title-wrapper">
                  <span className="ai-chat-title">Tư vấn trực tuyến</span>
                  <span className="ai-chat-subtitle">AI và nhân viên hỗ trợ</span>
                </div>
              </div>
              <button className="ai-chat-close-btn" onClick={closeWidget} aria-label="Đóng khung tư vấn">
                <i className="ri-close-line" aria-hidden="true" />
              </button>
            </div>

            <div className="support-chat-tabs" role="tablist" aria-label="Chọn hình thức tư vấn">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'ai'}
                className={`support-chat-tab ${activeTab === 'ai' ? 'support-chat-tab--active' : ''}`}
                onClick={() => selectTab('ai')}
              >
                <i className="ri-robot-2-line" aria-hidden="true" /> Trợ lý AI
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'admin'}
                className={`support-chat-tab ${activeTab === 'admin' ? 'support-chat-tab--active' : ''}`}
                onClick={() => selectTab('admin')}
              >
                <i className="ri-user-heart-line" aria-hidden="true" /> Quản trị viên
                {adminUnreadCount > 0 && (
                  <span className="support-chat-tab-badge" aria-label={`${adminUnreadCount} tin nhắn chưa đọc`}>
                    {adminUnreadCount > 99 ? '99+' : adminUnreadCount}
                  </span>
                )}
              </button>
            </div>

            {activeTab === 'ai' ? (
              <HomeChatBox chat={aiChat} />
            ) : (
              <div className="support-chat-panel" aria-label="Chat với quản trị viên">
                <AdminMessageList
                  messages={adminMessages}
                  isLoading={adminLoading}
                  error={adminError}
                  messagesEndRef={adminMessagesEndRef}
                />
                <AdminChatInput
                  value={adminInput}
                  onChange={setAdminInput}
                  onSubmit={sendAdminMessage}
                  disabled={adminLoading || !roomIdRef.current}
                  inputRef={adminInputRef}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
