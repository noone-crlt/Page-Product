import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { askGemini } from '../../services/aiService';
import './Chat.css';

export default function HomeChatBox() {
  const { products, setSelectedProduct } = useApp();
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      role: 'model',
      text: 'Xin chào! Mình là Trợ lý Mua sắm thông minh AI. Bạn đang muốn tìm sản phẩm công nghệ nào? Hãy nói cho mình biết nhu cầu hoặc khoảng ngân sách của bạn nhé!',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isLoading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userText = message.trim();
    setMessage('');
    setErrorMessage('');

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
          'Chưa cấu hình API Key. Vui lòng thêm biến VITE_GEMINI_API_KEY vào tệp .env để kích hoạt AI Chat.'
        );
      } else {
        setErrorMessage('Đã xảy ra lỗi khi kết nối với AI. Vui lòng thử lại sau.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessageContent = (text) => {
    const parts = [];
    let lastIndex = 0;
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
    <section className="ai-home-chat-section" aria-label="AI Tư vấn mua sắm trực tuyến">
      {/* Cột giới thiệu bên trái */}
      <div className="ai-home-chat-intro">
        <span className="badge">AI shopping assistant</span>
        <h2>Trò chuyện với AI để mua sắm dễ dàng hơn</h2>
        <p>
          Hệ thống AI thông minh của chúng tôi đã đọc toàn bộ kho sản phẩm thực tế. 
          Hãy đặt câu hỏi để nhận tư vấn chính xác về thông số, giá bán và các chương trình khuyến mãi đang diễn ra!
        </p>
        
        <div className="ai-home-chat-features">
          <div className="ai-home-chat-feature-item">
            <i className="ri-checkbox-circle-fill"></i>
            <span>Tư vấn dựa trên ngân sách thực tế</span>
          </div>
          <div className="ai-home-chat-feature-item">
            <i className="ri-checkbox-circle-fill"></i>
            <span>So sánh các dòng sản phẩm nhanh chóng</span>
          </div>
          <div className="ai-home-chat-feature-item">
            <i className="ri-checkbox-circle-fill"></i>
            <span>Gợi ý cấu hình phù hợp với nhu cầu</span>
          </div>
        </div>
      </div>

      {/* Khung chat bên phải */}
      <div className="ai-chat-container ai-home-chat-container">
        {/* Header */}
        <div className="ai-chat-header">
          <div className="ai-chat-header-info">
            <div className="ai-chat-avatar">
              <i className="ri-shake-hands-line"></i>
            </div>
            <div className="ai-chat-title-wrapper">
              <span className="ai-chat-title">Tư Vấn Mua Sắm Trực Tuyến</span>
              <span className="ai-chat-subtitle">Hỗ trợ khách hàng 24/7</span>
            </div>
          </div>
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
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Bạn cần tư vấn sản phẩm nào? Gõ vào đây nhé..."
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading || !message.trim()}>
            <i className="ri-send-plane-2-line"></i>
          </button>
        </form>
      </div>
    </section>
  );
}
