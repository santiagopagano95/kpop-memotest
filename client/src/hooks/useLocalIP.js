import { useState, useEffect } from 'react';

// IP fija del equipo para compartir en la red local
const FIXED_IP = '192.168.1.15';

export function useLocalIP() {
  const [localIP, setLocalIP] = useState(null);

  useEffect(() => {
    // Si estamos en localhost, usar la IP fija
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      setLocalIP(FIXED_IP);
    }
  }, []);

  return localIP;
}

export function getFixedIP() {
  return FIXED_IP;
}
