import { useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';

const typeStyles = {
  info: 'bg-blue-600 text-white',
  success: 'bg-green-600 text-white',
  warning: 'bg-amber-600 text-white',
  error: 'bg-red-600 text-white',
};

const ToastContainer = () => {
  const { notifications, removeNotification } = useNotifications();

  useEffect(() => {
    const timers = notifications.map((notification) =>
      setTimeout(() => removeNotification(notification.id), 4000)
    );

    return () => timers.forEach(clearTimeout);
  }, [notifications, removeNotification]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col gap-3 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`rounded-xl shadow-xl p-4 border border-gray-200 ${typeStyles[notification.type] || typeStyles.info}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="text-sm leading-5">{notification.message}</div>
            <button
              type="button"
              onClick={() => removeNotification(notification.id)}
              className="text-white opacity-80 hover:opacity-100"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
