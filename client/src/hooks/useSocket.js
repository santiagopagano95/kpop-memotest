import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const getSocketURL = () => {
  const envUrl = import.meta.env.VITE_SOCKET_URL;
  if (envUrl) return envUrl;
  
  const hostname = window.location.hostname;
  return `http://${hostname}:3001`;
};

let socket = null;

export function getSocket() {
  if (!socket) {
    const url = getSocketURL();
    console.log('Connecting to:', url);
    socket = io(url, { 
      autoConnect: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });
    socket.on('connect', () => console.log('Socket connected:', socket.id));
    socket.on('connect_error', (err) => console.error('Socket error:', err.message));
    socket.on('disconnect', (reason) => console.log('Socket disconnected:', reason));
    socket.on('reconnect', (attempt) => console.log('Reconnected after', attempt, 'attempts'));
  }
  return socket;
}

export function useSocket(eventHandlers = {}) {
  const s = getSocket();
  const handlersRef = useRef(eventHandlers);
  handlersRef.current = eventHandlers;

  useEffect(() => {
    const events = Object.keys(handlersRef.current);
    const wrappers = events.map((event) => {
      const wrapper = (...args) => handlersRef.current[event]?.(...args);
      s.on(event, wrapper);
      return [event, wrapper];
    });
    return () => {
      wrappers.forEach(([event, wrapper]) => s.off(event, wrapper));
    };
  }, []);

  return s;
}
