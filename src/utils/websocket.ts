import { io, Socket } from 'socket.io-client';

const chat_socket: Socket = io('http://127.0.0.1:18888/chatbot'); // 注意去掉 ws://，改用 http:// 或 https://

chat_socket.on('connect', () => {
  console.log('Connected to WebSocket server');
});

chat_socket.on('disconnect', () => {
  console.log('Disconnected from WebSocket server');
});

chat_socket.on('chat_response', (message: { data: string }) => {
  console.log(`Message from server: ${message.data}`);
});

export default chat_socket;
