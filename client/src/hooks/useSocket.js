import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, { autoConnect: false });
  }
  return socket;
}

export function useSocket(eventHandlers = {}) {
  const s = getSocket();
  const handlersRef = useRef(eventHandlers);
  handlersRef.current = eventHandlers;

  useEffect(() => {
    s.connect();
    const entries = Object.entries(handlersRef.current);
    entries.forEach(([event, handler]) => s.on(event, handler));
    return () => {
      entries.forEach(([event, handler]) => s.off(event, handler));
    };
  }, []); // eslint-disable-line

  return s;
}
