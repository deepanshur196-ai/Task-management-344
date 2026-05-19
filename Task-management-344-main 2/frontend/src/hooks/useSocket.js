import { useEffect } from 'react';
import { getSocket } from '../services/socket';

export const useSocketEvent = (event, handler, enabled = true) => {
  useEffect(() => {
    if (!enabled || !event || !handler) return;
    const socket = getSocket();
    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
  }, [event, handler, enabled]);
};
