import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (token?: string): Socket => {
  if (!socket) {
    const socketUrl = import.meta.env.VITE_API_URL || window.location.origin;
    socket = io(socketUrl, {
      path: '/socket.io',
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('[LifeLine] Connected to real-time notification socket:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[LifeLine] Disconnected from notification socket:', reason);
    });
  }

  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
