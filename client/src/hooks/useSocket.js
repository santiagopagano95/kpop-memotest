import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

// For local development, use localhost for same-machine connections
// Mobile devices on the same network will use the IP from the URL
const getSocketURL = () => {
  const envUrl = import.meta.env.VITE_SOCKET_URL;
  if (envUrl) {
    return envUrl;
  }
  
  // Usar el hostname actual de la página
  // - localhost:5173 -> localhost:3001 (misma máquina)
  // - 192.168.1.15:5173 -> 192.168.1.15:3001 (misma red)
  const hostname = window.location.hostname;
  return `http://${hostname}:3001`;
};

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(getSocketURL(), { 
      autoConnect: true,
      transports: ['websocket', 'polling']
    });
    socket.on('connect', () => console.log('Socket connected:', socket.id));
    socket.on('connect_error', (err) => console.error('Socket error:', err.message));
  }
  return socket;
}

export function useSocket(eventHandlers = {}) {
  const s = getSocket();
  const handlersRef = useRef(eventHandlers);
  handlersRef.current = eventHandlers;

  useEffect(() => {
    // Register stable wrappers that always delegate to the latest handler via the ref.
    // This avoids stale closure issues when handlers capture React state.
    const events = Object.keys(handlersRef.current);
    const wrappers = events.map((event) => {
      const wrapper = (...args) => handlersRef.current[event]?.(...args);
      s.on(event, wrapper);
      return [event, wrapper];
    });
    return () => {
      wrappers.forEach(([event, wrapper]) => s.off(event, wrapper));
    };
  }, []); // stable: socket singleton never changes

  return s;
}
