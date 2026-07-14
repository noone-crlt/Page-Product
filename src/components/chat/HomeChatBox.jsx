import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { askGemini } from '../../services/aiService';

const INITIAL_MESSAGES = [
  {
    role: 'model',
    text: 'Xin chào! Mình là Trợ lý Mua sắm thông minh AI. Bạn đang muốn tìm sản phẩm công nghệ nào? Hãy cho mình biết nhu cầu hoặc khoảng ngân sách của bạn nhé!',
  },
];

export function useAIChat() {
  const { products } = useApp();
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState(INITIAL_MESSAGES);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const sendAIMessage = async (event) => {
    event.preventDefault();
    const userText = aiInput.trim();
    if (!userText || aiLoading) return;

    setAiInput('');
    setAiError('');
    setAiLoading(true);
    const previousMessages = aiMessages;
    const nextMessages = [...previousMessages, { role: 'user', text: userText }];
    setAiMessages(nextMessages);

    try {
      const response = await askGemini(userText, previousMessages, products);
      setAiMessages((current) => [...current, { role: 'model', text: response }]);
    } catch (error) {
      console.error('Lỗi kết nối với AI:', error);
      setAiError(
        error.message === 'API_KEY_MISSING'
          ? 'Chưa cấu hình API Key. Vui lòng thêm biến VITE_GEMINI_API_KEY vào tệp .env để kích hoạt Trợ lý AI.'
          : 'Đã xảy ra lỗi khi kết nối với AI. Vui lòng thử lại sau.',
      );
    } finally {
      setAiLoading(false);
    }
  };

  return {
    aiInput,
    setAiInput,
    aiMessages,
    aiLoading,
    aiError,
    sendAIMessage,
  };
}

const renderPlainText = (text) => (
  <span style={{ whiteSpace: 'pre-wrap' }}>
    {text.split('\n').map((line, lineIndex) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const isListItem = /^\s*-\s+/.test(line);

      return (
        <span key={lineIndex} style={{ display: 'block' }}>
          {isListItem ? '• ' : ''}
          {parts.map((part, partIndex) => {
            const cleanedPart = isListItem && partIndex === 0
              ? part.replace(/^\s*-\s+/, '')
              : part;
            return /^\*\*.*\*\*$/.test(cleanedPart)
              ? <strong key={partIndex}>{cleanedPart.slice(2, -2)}</strong>
              : <React.Fragment key={partIndex}>{cleanedPart}</React.Fragment>;
          })}
        </span>
      );
    })}
  </span>
);

function AIMessageContent({ text }) {
  const { products, setSelectedProduct } = useApp();
  const parts = [];
  const productLinkPattern = /\[(.*?)\]\(#product-detail-(\d+)\)/g;
  let lastIndex = 0;
  let match;

  while ((match = productLinkPattern.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    parts.push({ name: match[1], id: Number(match[2]) });
    lastIndex = productLinkPattern.lastIndex;
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  if (!parts.some((part) => typeof part !== 'string')) return renderPlainText(text);

  return (
    <span style={{ whiteSpace: 'pre-wrap' }}>
      {parts.map((part, index) => {
        if (typeof part === 'string') return <React.Fragment key={index}>{renderPlainText(part)}</React.Fragment>;

        return (
          <button
            key={`${part.id}-${index}`}
            type="button"
            className="ai-chat-product-inline-link"
            onClick={() => {
              const product = products.find((item) => String(item.id) === String(part.id));
              if (product) setSelectedProduct(product);
            }}
            title="Xem chi tiết sản phẩm"
          >
            {part.name} <i className="ri-external-link-line" aria-hidden="true" />
          </button>
        );
      })}
    </span>
  );
}

export function AIMessageList({ messages, isLoading, error, messagesEndRef }) {
  return (
    <div className="ai-chat-messages" aria-live="polite">
      {messages.map((message, index) => (
        <div key={`${message.role}-${index}`} className={`ai-message ${message.role === 'user' ? 'user' : 'ai'}`}>
          <AIMessageContent text={message.text} />
        </div>
      ))}

      {isLoading && (
        <div className="ai-message typing" aria-label="Trợ lý AI đang trả lời">
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

export function AIChatInput({ value, onChange, onSubmit, isLoading, inputRef }) {
  return (
    <form className="ai-chat-input-bar" onSubmit={onSubmit}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Bạn cần tư vấn sản phẩm nào?"
        disabled={isLoading}
      />
      <button type="submit" disabled={isLoading || !value.trim()} aria-label="Gửi câu hỏi cho Trợ lý AI">
        <i className="ri-send-plane-2-line" aria-hidden="true" />
      </button>
    </form>
  );
}

export default function HomeChatBox({ chat }) {
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.aiMessages, chat.aiLoading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="support-chat-panel" aria-label="Trợ lý AI">
      <AIMessageList
        messages={chat.aiMessages}
        isLoading={chat.aiLoading}
        error={chat.aiError}
        messagesEndRef={messagesEndRef}
      />
      <AIChatInput
        value={chat.aiInput}
        onChange={chat.setAiInput}
        onSubmit={chat.sendAIMessage}
        isLoading={chat.aiLoading}
        inputRef={inputRef}
      />
    </div>
  );
}
