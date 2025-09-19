import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import NotificationService from '../services/notificationService';
import useAuth from './useAuth';

function normalizeNotification(n) {
  const read =
    n?.read === true ||
    n?.is_read === true ||
    Boolean(n?.read_at) ||
    n?.estado === 'vista' ||
    n?.estado === 'LEIDA' ||
    n?.status === 'read';
  
  return {
    id: n?.id ?? n?._id ?? `${n?.created_at || Date.now()}-${Math.random()}`,
    title: n?.title || n?.titulo || n?.subject || n?.tipo || 'Notificación',
    message: n?.message || n?.mensaje || n?.body || n?.descripcion || '',
    created_at: n?.created_at || n?.fecha || n?.date || null,
    tipo: n?.tipo || n?.type || 'general',
    estado: n?.estado || (read ? 'vista' : 'pendiente'),
    read,
    raw: n,
  };
}

export default function useNotifications(filters = {}) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['notifications', userId, filters],
    queryFn: async () => {
      if (!userId) return { notifications: [], pagination: {} };
      
      // Usar servicio mejorado con filtros
      const result = await NotificationService.getNotifications(filters);
      const normalizedNotifications = Array.isArray(result.notifications)
        ? result.notifications.map(normalizeNotification)
        : [];
      
      return {
        notifications: normalizedNotifications,
        pagination: result.pagination || { page: 1, total: normalizedNotifications.length, total_pages: 1 }
      };
    },
    enabled: Boolean(userId),
    staleTime: 30_000,
  });

  const notifications = data?.notifications || [];
  const pagination = data?.pagination || {};
  const unreadCount = notifications.reduce((acc, n) => acc + (n.read ? 0 : 1), 0);

  const markAsReadMutation = useMutation({
    mutationFn: async (id) => {
      if (!id) return false;
      return NotificationService.markAsRead(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => NotificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
  });

  const markAsRead = (id) => markAsReadMutation.mutate(id);
  const markAllAsRead = () => markAllAsReadMutation.mutate();

  return {
    notifications,
    pagination,
    unreadCount,
    isLoading,
    isError,
    error,
    refetch,
    markAsRead,
    markAllAsRead,
    isMarkingOne: markAsReadMutation.isPending,
    isMarkingAll: markAllAsReadMutation.isPending,
  };
}