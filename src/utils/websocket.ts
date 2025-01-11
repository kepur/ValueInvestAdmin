import { io, Socket } from 'socket.io-client';
import { chatSocketURL, RecommendationSocketURL } from '@/utils/baseURL';
/**
 * 创建 WebSocket 连接并绑定通用事件
 * @param url WebSocket 服务器的 URL
 * @param eventHandlers 事件处理函数对象
 * @returns 返回 Socket 实例
 */
export function createWebSocket(
  url: string,
  eventHandlers: {
    onConnect?: () => void;
    onDisconnect?: () => void;
    onMessage?: (message: any) => void;
    onError?: (error: Error) => void;
  } = {}
): Socket {
  const socket: Socket = io(url);

  // 绑定通用事件
  socket.on('connect', () => {
    console.log(`Connected to WebSocket server at ${url}`);
    eventHandlers.onConnect?.();
  });

  socket.on('disconnect', () => {
    console.log(`Disconnected from WebSocket server at ${url}`);
    eventHandlers.onDisconnect?.();
  });

  socket.on('chat_response', (message: any) => {
    console.log(`Message from server at ${url}:`, message);
    eventHandlers.onMessage?.(message);
  });

  socket.on('error', (error: Error) => {
    console.error(`WebSocket error at ${url}:`, error);
    eventHandlers.onError?.(error);
  });

  return socket;
}

/**
 * 初始化 ChatSocket 连接
 * @param eventHandlers 事件处理函数对象
 * @returns 返回 Socket 实例
 */
export function createChatSocket(eventHandlers: {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMessage?: (message: any) => void;
  onError?: (error: Error) => void;
}): Socket {
  return createWebSocket(chatSocketURL, eventHandlers);
}

/**
 * 初始化 RecommendationSocket 连接
 * @param eventHandlers 事件处理函数对象
 * @returns 返回 Socket 实例
 */
export function createRecommendationSocket(eventHandlers: {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMessage?: (message: any) => void;
  onError?: (error: Error) => void;
}): Socket {
  return createWebSocket(RecommendationSocketURL, eventHandlers);
}
