import * as signalR from '@microsoft/signalr';
import { API_BASE_URL } from './apiClient';

const PAYMENT_HUB_URL =
  import.meta.env.VITE_PAYMENT_HUB_URL || `${API_BASE_URL}/paymentHub`;

export const createPaymentHubConnection = () =>
  new signalR.HubConnectionBuilder()
    .withUrl(PAYMENT_HUB_URL, {
      accessTokenFactory: () => localStorage.getItem('accessToken') || '',
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000])
    .configureLogging(signalR.LogLevel.Warning)
    .build();

const BANK_ACCOUNT = import.meta.env.VITE_SEPAY_BANK_ACCOUNT || '';
const BANK_NAME = import.meta.env.VITE_SEPAY_BANK_NAME || '';
const TRANSFER_PREFIX = import.meta.env.VITE_SEPAY_TRANSFER_PREFIX || 'DH';

export const createSepayQrUrl = ({ orderId, amount, content }) => {
  if (!BANK_ACCOUNT || !BANK_NAME || !orderId || !amount) return '';

  const query = new URLSearchParams({
    acc: BANK_ACCOUNT,
    bank: BANK_NAME,
    amount: String(Math.round(Number(amount))),
    des: content || `${TRANSFER_PREFIX}${orderId}`,
  });

  return `https://qr.sepay.vn/img?${query.toString()}`;
};

export const getDefaultTransferContent = (orderId) =>
  orderId ? `${TRANSFER_PREFIX}${orderId}` : '';

export { PAYMENT_HUB_URL };
