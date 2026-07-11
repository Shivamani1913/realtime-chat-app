import { useCallback, useEffect, useRef, useState } from 'react';
import { socket } from '../utils/socket';
import { fetchHistory, postMessage } from '../utils/api';

const ROOM = 'general';
const TYPING_TIMEOUT_MS = 1500;

export default function useChat(username) {
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [error, setError] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingHistory(true);
    fetchHistory(ROOM)
      .then((data) => {
        if (!cancelled) setMessages(data.messages || []);
      })
      .catch((err) => {
        console.error('Failed to load chat history:', err);
        if (!cancelled) setError('Could not load chat history. Is the backend running?');
      })
      .finally(() => {
        if (!cancelled) setLoadingHistory(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!username) return;

    setConnectionStatus('connecting');
    socket.connect();

    function handleConnect() {
      setConnectionStatus('connected');
      setError(null);
      socket.emit('user:join', { username, room: ROOM });
    }

    function handleDisconnect() {
      setConnectionStatus('disconnected');
    }

    function handleConnectError(err) {
      console.error('Socket connect_error:', err.message);
      setConnectionStatus('disconnected');
      setError('Unable to reach the chat server. Retrying...');
    }

    function handleNewMessage(message) {
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
    }

    function handleUsersOnline(users) {
      setOnlineUsers(users);
    }

    function handleTypingUpdate({ username: who, isTyping }) {
      setTypingUsers((prev) => {
        if (isTyping) {
          return prev.includes(who) ? prev : [...prev, who];
        }
        return prev.filter((u) => u !== who);
      });
    }

    function handleServerError(message) {
      setError(message);
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('message:new', handleNewMessage);
    socket.on('users:online', handleUsersOnline);
    socket.on('typing:update', handleTypingUpdate);
    socket.on('error:message', handleServerError);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('message:new', handleNewMessage);
      socket.off('users:online', handleUsersOnline);
      socket.off('typing:update', handleTypingUpdate);
      socket.off('error:message', handleServerError);
      socket.disconnect();
    };
  }, [username]);

  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim() || !username) return;

      if (isTypingRef.current) {
        socket.emit('typing:stop', { room: ROOM });
        isTypingRef.current = false;
      }
      clearTimeout(typingTimeoutRef.current);

      if (socket.connected) {
        socket.emit('message:send', { text, room: ROOM });
      } else {
        try {
          await postMessage({ username, text, room: ROOM });
        } catch (err) {
          console.error('Failed to send message via REST fallback:', err);
          setError('Failed to send message. Please try again.');
        }
      }
    },
    [username]
  );

  const notifyTyping = useCallback(() => {
    if (!socket.connected) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('typing:start', { room: ROOM });
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit('typing:stop', { room: ROOM });
    }, TYPING_TIMEOUT_MS);
  }, []);

  return {
    messages,
    onlineUsers,
    typingUsers: typingUsers.filter((u) => u !== username),
    connectionStatus,
    error,
    loadingHistory,
    sendMessage,
    notifyTyping,
  };
}
