import { useMemo } from 'react';
import { useNotifications } from '../context/NotificationContext';

const notificationColors = {
  info: 'bg-blue-50 text-blue-700',
  success: 'bg-green-50 text-green-700',
  warning: 'bg-amber-50 text-amber-700',
  error: 'bg-red-50 text-red-700',
};

const NotificationsPanel = ({ open, onClose }) => {
  const { notifications, markAllAsRead } = useNotifications();

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.seen).length,
    [notifications]
  );

  if (!open) return null;

  return (
    <div className="fixed right-4 top-20 z-50 w-[360px] max-h-[calc(100vh-5rem)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b px-4 py-3 bg-slate-50">
        <div>
          <div className="text-sm font-semibold">Notifications</div>
          <div className="text-xs text-slate-500">{unreadCount} unread</div>
        </div>
        <button
          type="button"
          onClick={markAllAsRead}
          className="text-xs text-slate-600 hover:text-slate-900"
        >
          Mark read
        </button>
      </div>
      <div className="max-h-[calc(100vh-8rem)] overflow-y-auto px-4 py-3 space-y-3">
        {notifications.length === 0 ? (
          <div className="text-sm text-slate-500">No notifications yet.</div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`rounded-2xl border px-3 py-3 ${notificationColors[notification.type] || notificationColors.info}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-slate-800">{notification.type.toUpperCase()}</span>
                <span className="text-xs text-slate-600">{new Date(notification.createdAt).toLocaleTimeString()}</span>
              </div>
              <p className="mt-1 text-sm text-slate-700">{notification.message}</p>
            </div>
          ))
        )}
      </div>
      <div className="border-t px-4 py-3 bg-slate-50 flex justify-end">
        <button onClick={onClose} className="text-sm text-slate-600 hover:text-slate-900">
          Close
        </button>
      </div>
    </div>
  );
};

export default NotificationsPanel;
