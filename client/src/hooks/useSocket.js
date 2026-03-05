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
