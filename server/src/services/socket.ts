import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyAccessToken, AccessTokenPayload } from '../utils/tokens';
import { env } from '../config/env';

export interface AuthenticatedSocket extends Socket {
  user?: AccessTokenPayload;
}

let io: SocketIOServer | null = null;

export const initSocketServer = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // Socket authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, '') ||
      socket.handshake.query?.token;

    if (token && typeof token === 'string') {
      try {
        const payload = verifyAccessToken(token);
        socket.user = payload;
      } catch {
        // Allow unauthenticated connection for public emergency broadcast rooms
      }
    }
    next();
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.user?.userId;

    if (userId) {
      // Join user-specific notification room
      socket.join(`user:${userId}`);
    }

    // Join regional emergency rooms (e.g. "geo:Dhaka:Dhaka")
    socket.on('join_geo', (data: { division: string; district: string }) => {
      if (data?.division && data?.district) {
        socket.join(`geo:${data.division}:${data.district}`);
      }
    });

    socket.on('leave_geo', (data: { division: string; district: string }) => {
      if (data?.division && data?.district) {
        socket.leave(`geo:${data.division}:${data.district}`);
      }
    });

    socket.on('disconnect', () => {
      // Clean up handled automatically by Socket.io
    });
  });

  return io;
};

export const getIO = (): SocketIOServer | null => {
  return io;
};

/**
 * Emit an event to a specific user's connected clients.
 */
export const emitToUser = (userId: string, event: string, payload: unknown): void => {
  if (io) {
    io.to(`user:${userId}`).emit(event, payload);
  }
};

/**
 * Emit an emergency event to all clients in a specific Division + District.
 */
export const emitToGeo = (
  division: string,
  district: string,
  event: string,
  payload: unknown
): void => {
  if (io) {
    io.to(`geo:${division}:${district}`).emit(event, payload);
  }
};

/**
 * Broadcast an emergency announcement to all connected clients nationwide.
 */
export const broadcastEmergency = (event: string, payload: unknown): void => {
  if (io) {
    io.emit(event, payload);
  }
};
