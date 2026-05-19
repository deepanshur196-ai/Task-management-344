import { createContext, useContext, useMemo, useState } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = ({ message, type = 'info', link = null }) => {
    const notification = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      message,
      type,
      link,
      createdAt: new Date().toISOString(),
      seen: false,
    };
    setNotifications((prev) => [notification, ...prev].slice(0, 10));
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, seen: true })));
  };

  return (
    <NotificationContext.Provider
      value={useMemo(
        () => ({ notifications, addNotification, removeNotification, markAllAsRead }),
        [notifications]
      )}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
