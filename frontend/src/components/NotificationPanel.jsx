import { useState, useRef, useEffect } from 'react';
import { Bell, Check, Info, AlertCircle, CalendarClock } from 'lucide-react';

export default function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Timetable Updated',
      message: 'The timetable for Level I Physical Science has been published.',
      time: '10 mins ago',
      type: 'info',
      read: false,
    },
    {
      id: 2,
      title: 'Room Change',
      message: 'MAT121 class moved to MLT01 for this Friday.',
      time: '2 hours ago',
      type: 'alert',
      read: false,
    },
    {
      id: 3,
      title: 'New Leave Request',
      message: 'Dr. Smith submitted a leave request for next Monday.',
      time: '1 day ago',
      type: 'calendar',
      read: true,
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'alert': return <AlertCircle size={16} />;
      case 'calendar': return <CalendarClock size={16} />;
      default: return <Info size={16} />;
    }
  };

  return (
    <div className="notification-wrapper" ref={dropdownRef}>
      <button 
        className="icon-btn notification-trigger" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown dropdown-anim">
          <div className="notification-header">
            <span className="notification-title">Notifications</span>
            {unreadCount > 0 && (
              <button className="notification-mark-read" onClick={markAllRead}>
                <Check size={14} /> Mark all read
              </button>
            )}
          </div>
          
          <div className="notification-list">
            {notifications.length > 0 ? (
              notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className={`notification-icon type-${notification.type}`}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <div className="notification-item-title">{notification.title}</div>
                    <div className="notification-item-msg">{notification.message}</div>
                    <div className="notification-item-time">{notification.time}</div>
                  </div>
                  {!notification.read && <div className="notification-unread-dot"></div>}
                </div>
              ))
            ) : (
              <div className="notification-empty">
                No notifications right now.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
