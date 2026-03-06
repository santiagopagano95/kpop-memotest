import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || `http://${window.location.hostname}:3001`;

// Singleton socket - connects once, reconnects forever
const socket = io(SOCKET_URL, { 
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 30000,
});

socket.on('connect', () => console.log('Connected:', socket.id));
socket.on('connect_error', (err) => console.warn('Connection error:', err.message));
socket.on('disconnect', (reason) => console.log('Disconnected:', reason));

export function getSocket() {
  return socket;
}

export function useSocket(eventHandlers = {}) {
  const handlersRef = useRef(eventHandlers);
  handlersRef.current = eventHandlers;

  useEffect(() => {
    const events = Object.keys(handlersRef.current);
    const wrappers = events.map((event) => {
      const wrapper = (...args) => handlersRef.current[event]?.(...args);
      socket.on(event, wrapper);
      return [event, wrapper];
    });
    return () => {
      wrappers.forEach(([event, wrapper]) => socket.off(event, wrapper));
    };
  }, []);

  return socket;
}
