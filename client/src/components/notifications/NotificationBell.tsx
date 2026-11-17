import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { getSocket } from '../../services/socket';

export interface InAppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationBellProps {
  initialNotifications?: InAppNotification[];
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  initialNotifications = [],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<InAppNotification[]>(
    initialNotifications.length > 0
      ? initialNotifications
      : [
          {
            id: 'mock-notif-1',
            type: 'EMERGENCY_BROADCAST',
            title: '🚨 CRITICAL: O+ Needed at Dhaka Medical College',
            body: '2 units needed immediately for trauma surgery patient.',
            isRead: false,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'mock-notif-2',
            type: 'DONOR_MATCH',
            title: 'Matched to Emergency Blood Request',
            body: 'Your profile matches a verified request in Chattogram.',
            isRead: false,
            createdAt: new Date(Date.now() - 3600000).toISOString(),
          },
        ]
  );

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    const socket = getSocket();

    const handleNewNotification = (notif: InAppNotification) => {
      setNotifications((prev) => [notif, ...prev]);
    };

    const handleEmergencyAlert = (data: { title: string; body: string }) => {
      const alertNotif: InAppNotification = {
        id: `emergency-${Date.now()}`,
        type: 'EMERGENCY_BROADCAST',
        title: data.title,
        body: data.body,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      setNotifications((prev) => [alertNotif, ...prev]);
    };

    socket.on('new_notification', handleNewNotification);
    socket.on('emergency_alert', handleEmergencyAlert);
    socket.on('emergency_broadcast', handleEmergencyAlert);

    return () => {
      socket.off('new_notification', handleNewNotification);
      socket.off('emergency_alert', handleEmergencyAlert);
      socket.off('emergency_broadcast', handleEmergencyAlert);
    };
  }, []);

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true }))
    );
  };

  const markSingleAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const removeNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="relative">
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-navy-900 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blood-500"
        aria-label="View notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blood-400 opacity-75"></span>
            <span className="relative inline-flex items-center justify-center rounded-full h-4 w-4 bg-blood-600 text-white text-[9px] font-black">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in-50 duration-150">
            {/* Header */}
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-navy-900">Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-blood-100 text-blood-700 font-bold text-xs">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs font-semibold text-blood-600 hover:text-blood-700 flex items-center gap-1 transition"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            {/* Notification List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No notifications yet.
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markSingleAsRead(n.id)}
                    className={`p-3.5 text-xs hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${
                      !n.isRead ? 'bg-red-50/40' : 'bg-white'
                    }`}
                  >
                    <span
                      className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${
                        !n.isRead ? 'bg-blood-600 ring-2 ring-blood-200' : 'bg-slate-300'
                      }`}
                    />
                    <div className="flex-1">
                      <div className="font-bold text-slate-900 leading-snug">
                        {n.title}
                      </div>
                      <div className="text-slate-600 mt-1 leading-relaxed">
                        {n.body}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1.5 flex items-center justify-between">
                        <span>
                          {new Date(n.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <button
                          onClick={(e) => removeNotification(n.id, e)}
                          className="hover:text-red-500 transition-colors"
                          title="Remove notification"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
              <span className="text-[11px] text-slate-500 font-medium">
                Real-time WebSocket alerts active
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
