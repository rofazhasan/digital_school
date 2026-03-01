import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { verifyToken } from './auth';

export interface CollaborationSession {
  id: string;
  questionId: string;
  participants: Array<{
    userId: string;
    name: string;
    role: string;
    joinedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CollaborationMessage {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  type: 'comment' | 'suggestion' | 'question' | 'approval';
  content: string;
  timestamp: Date;
  metadata?: any;
}

class SocketService {
  private io: SocketIOServer | null = null;
  private sessions: Map<string, CollaborationSession> = new Map();
  private userSessions: Map<string, Set<string>> = new Map();

  initialize(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const payload = await verifyToken(token);
        if (!payload) {
          return next(new Error('Invalid token'));
        }

        socket.data.user = payload;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket) => {
      const userId = socket.data.user.userId;
      console.log(`User connected: ${userId}`);

      // Join personal room for private notifications (like forced logout)
      socket.join(`user-${userId}`);

      // Join question collaboration room
      socket.on('join-question-session', async (data) => {
        const { questionId } = data;
        const userId = socket.data.user.userId;
        const userName = socket.data.user.name || socket.data.user.email;

        await this.joinQuestionSession(socket, questionId, userId, userName);
      });

      // Leave question collaboration room
      socket.on('leave-question-session', async (data) => {
        const { questionId } = data;
        const userId = socket.data.user.userId;

        await this.leaveQuestionSession(socket, questionId, userId);
      });

      // Send collaboration message
      socket.on('send-message', async (data) => {
        const { sessionId, type, content, metadata } = data;
        const userId = socket.data.user.userId;
        const userName = socket.data.user.name || socket.data.user.email;

        await this.sendCollaborationMessage(socket, sessionId, userId, userName, type, content, metadata);
      });

      // Typing indicator
      socket.on('typing-start', (data) => {
        const { sessionId } = data;
        const userId = socket.data.user.userId;
        const userName = socket.data.user.name || socket.data.user.email;

        socket.to(sessionId).emit('user-typing', {
          userId,
          userName,
          isTyping: true
        });
      });

      socket.on('typing-stop', (data) => {
        const { sessionId } = data;
        const userId = socket.data.user.userId;

        socket.to(sessionId).emit('user-typing', {
          userId,
          isTyping: false
        });
      });

      // Question approval/review
      socket.on('question-status-change', async (data) => {
        const { questionId, newStatus, reviewNotes } = data;
        const userId = socket.data.user.userId;
        const userName = socket.data.user.name || socket.data.user.email;

        await this.handleQuestionStatusChange(socket, questionId, userId, userName, newStatus, reviewNotes);
      });

      // Disconnect
      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.data.user.userId}`);
        this.handleUserDisconnect(socket);
      });
    });
  }

  private async joinQuestionSession(socket: any, questionId: string, userId: string, userName: string) {
    const sessionId = `question-${questionId}`;

    // Join the room
    socket.join(sessionId);

    // Get or create session
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = {
        id: sessionId,
        questionId,
        participants: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.sessions.set(sessionId, session);
    }

    // Add participant if not already present
    const existingParticipant = session.participants.find(p => p.userId === userId);
    if (!existingParticipant) {
      session.participants.push({
        userId,
        name: userName,
        role: socket.data.user.role,
        joinedAt: new Date()
      });
    }

    session.updatedAt = new Date();

    // Track user sessions
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, new Set());
    }
    this.userSessions.get(userId)!.add(sessionId);

    // Notify others in the room
    socket.to(sessionId).emit('user-joined', {
      userId,
      userName,
      role: socket.data.user.role,
      joinedAt: new Date()
    });

    // Send current session info to the joining user
    socket.emit('session-info', {
      sessionId,
      participants: session.participants,
      questionId
    });

    console.log(`User ${userName} joined question session ${sessionId}`);
  }

  private async leaveQuestionSession(socket: any, questionId: string, userId: string) {
    const sessionId = `question-${questionId}`;

    // Leave the room
    socket.leave(sessionId);

    // Remove from session participants
    const session = this.sessions.get(sessionId);
    if (session) {
      session.participants = session.participants.filter(p => p.userId !== userId);
      session.updatedAt = new Date();

      // Remove session if no participants
      if (session.participants.length === 0) {
        this.sessions.delete(sessionId);
      }
    }

    // Remove from user sessions tracking
    const userSessions = this.userSessions.get(userId);
    if (userSessions) {
      userSessions.delete(sessionId);
      if (userSessions.size === 0) {
        this.userSessions.delete(userId);
      }
    }

    // Notify others in the room
    socket.to(sessionId).emit('user-left', {
      userId,
      leftAt: new Date()
    });

    console.log(`User ${userId} left question session ${sessionId}`);
  }

  private async sendCollaborationMessage(
    socket: any,
    sessionId: string,
    userId: string,
    userName: string,
    type: string,
    content: string,
    metadata?: any
  ) {
    const message: CollaborationMessage = {
      id: `${sessionId}-${Date.now()}-${userId}`,
      sessionId,
      userId,
      userName,
      type: type as any,
      content,
      timestamp: new Date(),
      metadata
    };

    // Broadcast to all users in the session
    this.io?.to(sessionId).emit('new-message', message);

    // Store message in database (you can implement this)
    await this.storeCollaborationMessage(message);

    console.log(`Message sent in session ${sessionId}: ${type} by ${userName}`);
  }

  private async handleQuestionStatusChange(
    socket: any,
    questionId: string,
    userId: string,
    userName: string,
    newStatus: string,
    reviewNotes?: string
  ) {
    const sessionId = `question-${questionId}`;

    // Broadcast status change to all users in the session
    this.io?.to(sessionId).emit('question-status-changed', {
      questionId,
      userId,
      userName,
      newStatus,
      reviewNotes,
      timestamp: new Date()
    });

    // Send notification to question creator if they're not in the session
    const session = this.sessions.get(sessionId);
    if (session) {
      // You can implement notification logic here
      console.log(`Question ${questionId} status changed to ${newStatus} by ${userName}`);
    }
  }

  private handleUserDisconnect(socket: any) {
    const userId = socket.data.user.userId;
    const userSessions = this.userSessions.get(userId);

    if (userSessions) {
      // Remove user from all sessions they were in
      userSessions.forEach(sessionId => {
        const session = this.sessions.get(sessionId);
        if (session) {
          session.participants = session.participants.filter(p => p.userId !== userId);
          session.updatedAt = new Date();

          // Remove session if no participants
          if (session.participants.length === 0) {
            this.sessions.delete(sessionId);
          } else {
            // Notify remaining participants
            this.io?.to(sessionId).emit('user-left', {
              userId,
              leftAt: new Date()
            });
          }
        }
      });

      this.userSessions.delete(userId);
    }
  }

  private async storeCollaborationMessage(message: CollaborationMessage) {
    // This is a placeholder - you can implement database storage here
    // For now, we'll just log it
    console.log('Storing collaboration message:', message);
  }

  // Public methods for external use
  getIO(): SocketIOServer | null {
    return this.io;
  }

  getActiveSessions(): CollaborationSession[] {
    return Array.from(this.sessions.values());
  }

  getSessionParticipants(sessionId: string): CollaborationSession['participants'] {
    const session = this.sessions.get(sessionId);
    return session?.participants || [];
  }

  // Send notification to specific user (securely via room)
  sendNotificationToUser(userId: string, notification: any) {
    this.io?.to(`user-${userId}`).emit('notification', {
      userId,
      ...notification
    });

    // Specifically handle forced logout for convenience
    if (notification.type === 'forced-logout') {
      this.io?.to(`user-${userId}`).emit('forced-logout', notification);
    }
  }

  // Broadcast to all connected users
  broadcastToAll(event: string, data: any) {
    this.io?.emit(event, data);
  }
}

export const socketService = new SocketService(); 