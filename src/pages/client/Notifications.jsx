import NotificationPanel from '../../components/ui/NotificationPanel';
import useNotifications from '../../hooks/useNotifications';

export default function Notifications() {
  const {
    notifications,
    unreadCount,
    isLoading,
    isError,
    error,
    refetch,
    markAsRead,
    markAllAsRead,
    isMarkingAll,
  } = useNotifications();

  return (
    <NotificationPanel
      notifications={notifications}
      unreadCount={unreadCount}
      isLoading={isLoading}
      isError={isError}
      error={error}
      onMarkAsRead={markAsRead}
      onMarkAllAsRead={markAllAsRead}
      onRefetch={refetch}
      isMarkingAll={isMarkingAll}
      userType="client"
    />
  );
}