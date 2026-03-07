import { useState, useEffect } from 'react';

// Lee la IP de la variable de entorno VITE_LOCAL_IP
// Si no esta definida, retorna null y WaitingRoom mostrara input manual
const ENV_IP = import.meta.env.VITE_LOCAL_IP || null;

export function useLocalIP() {
  const [localIP, setLocalIP] = useState(null);

  useEffect(() => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocal && ENV_IP) {
      setLocalIP(ENV_IP);
    }
  }, []);

  return localIP;
}

export function getFixedIP() {
  return ENV_IP;
}
