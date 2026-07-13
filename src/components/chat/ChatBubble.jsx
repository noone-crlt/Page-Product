import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { askGemini } from '../../services/aiService';
import './Chat.css';

export default function ChatBubble() {
  const { products, setSelectedProduct } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      role: 'model',
      text: 'Xin chào! Mình là Trợ lý AI của My Store. Mình có thể giúp bạn tìm kiếm thiết bị công nghệ phù hợp hay giải đáp bất kỳ thắc mắc nào về sản phẩm. Bạn cần tư vấn sản phẩm gì hôm nay?',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Tự động cuộn xuống khi có tin nhắn mới
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isLoading]);

  // Focus ô nhập khi mở chat
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleToggle = () => {
    if (isOpen) {
      setIsClosing(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsClosing(false);
      }, 250); // Khớp thời gian animation close trong CSS
    } else {
      setIsOpen(true);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userText = message.trim();
    setMessage('');
    setErrorMessage('');
    
    // Thêm tin nhắn user vào lịch sử
    const newHistory = [...chatHistory, { role: 'user', text: userText }];
    setChatHistory(newHistory);
    setIsLoading(true);

    try {
      const aiResponse = await askGemini(userText, chatHistory, products);
      setChatHistory([...newHistory, { role: 'model', text: aiResponse }]);
    } catch (error) {
      console.error(error);
      if (error.message === 'API_KEY_MISSING') {
        setErrorMessage(
          'Chưa cấu hình API Key. Vui lòng thêm biến VITE_GEMINI_API_KEY vào tệp .env của dự án để kích hoạt Chat AI.'
        );
      } else {
        setErrorMessage('Đã xảy ra lỗi khi gửi yêu cầu tới AI. Vui lòng thử lại sau.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Render text tin nhắn kèm parse markdown bold & inline product links
  const renderMessageContent = (text) => {
    const parts = [];
    let lastIndex = 0;
    // Tìm các cụm dạng [Tên sản phẩm](#product-detail-ID)
    const regex = /\[(.*?)\]\(#product-detail-(\d+)\)/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      
      parts.push({
        type: 'product-link',
        name: match[1],
        id: parseInt(match[2], 10),
      });
      
      lastIndex = regex.lastIndex;
    }
    
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    if (parts.length === 0) {
      return (
        <span style={{ whiteSpace: 'pre-wrap' }}>
          {text.split('\n').map((line, i) => {
            const formattedLine = line
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/^\s*-\s+/g, '• ');
            return (
              <span
                key={i}
                style={{ display: 'block' }}
                dangerouslySetInnerHTML={{ __html: formattedLine }}
              />
            );
          })}
        </span>
      );
    }

    return (
      <span style={{ whiteSpace: 'pre-wrap' }}>
        {parts.map((part, idx) => {
          if (typeof part === 'string') {
            return (
              <span
                key={idx}
                dangerouslySetInnerHTML={{
                  __html: part
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/^\s*-\s+/gm, '• '),
                }}
              />
            );
          }
          
          return (
            <button
              key={idx}
              className="ai-chat-product-inline-link"
              onClick={() => {
                const prod = products.find((p) => p.id === part.id);
                if (prod) {
                  setSelectedProduct(prod);
                }
              }}
              title="Click để xem chi tiết sản phẩm"
            >
              {part.name} <i className="ri-external-link-line" style={{ fontSize: '10px' }}></i>
            </button>
          );
        })}
      </span>
    );
  };

  return (
    <>
      <button 
        className="ai-bubble-trigger" 
        onClick={handleToggle}
        aria-label="Nhắn tin với AI tư vấn"
        title="Trợ lý ảo AI tư vấn mua sắm"
      >
        {isOpen ? (
          <i className="ri-close-line" style={{ fontSize: '24px' }}></i>
        ) : (
          <div className="ai-bubble-avatar-wrapper">
            <i className="ri-robot-2-line"></i>
            <span className="ai-bubble-online-badge"></span>
          </div>
        )}
      </button>

      {/* Cửa sổ Chat */}
      {isOpen && (
        <div className={`ai-bubble-window ${isClosing ? 'closing' : ''}`}>
          <div className="ai-chat-container" style={{ height: '100%' }}>
            
            {/* Header */}
            <div className="ai-chat-header">
              <div className="ai-chat-header-info">
                <div className="ai-chat-avatar">
                  <i className="ri-robot-2-line"></i>
                </div>
                <div className="ai-chat-title-wrapper">
                  <span className="ai-chat-title">AI Shopping Assistant</span>
                  <span className="ai-chat-subtitle">
                    <span className="typing-dot" style={{ width: '4px', height: '4px', animationDuration: '1s', opacity: 1 }}></span> Trực tuyến
                  </span>
                </div>
              </div>
              <button 
                className="ai-chat-close-btn" 
                onClick={handleToggle}
                aria-label="Đóng khung chat"
              >
                <i className="ri-close-line"></i>
              </button>
            </div>

            {/* Cảnh báo thiếu API Key */}
            {errorMessage.includes('API Key') && (
              <div className="ai-chat-warning">
                <div>
                  <i className="ri-error-warning-line" style={{ marginRight: '6px' }}></i>
                  {errorMessage}
                </div>
              </div>
            )}

            {/* Danh sách tin nhắn */}
            <div className="ai-chat-messages">
              {chatHistory.map((msg, index) => (
                <div 
                  key={index} 
                  className={`ai-message ${msg.role === 'user' ? 'user' : 'ai'}`}
                >
                  {renderMessageContent(msg.text)}
                </div>
              ))}
              
              {isLoading && (
                <div className="ai-message typing">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              )}
              
              {errorMessage && !errorMessage.includes('API Key') && (
                <div className="ai-message ai" style={{ color: '#ef4444', borderColor: '#fecaca', background: '#fef2f2' }}>
                  <i className="ri-error-warning-line" style={{ marginRight: '6px' }}></i>
                  {errorMessage}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Khung nhập liệu */}
            <form className="ai-chat-input-bar" onSubmit={handleSend}>
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Hỏi về sản phẩm, giá bán, khuyến mãi..."
                disabled={isLoading}
              />
              <button type="submit" disabled={isLoading || !message.trim()}>
                <i className="ri-send-plane-2-line"></i>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
