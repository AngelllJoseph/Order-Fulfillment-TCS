import api from './api';

export const notificationService = {
  // Get all notifications for the current user (including broadcasts)
  getNotifications: () => api.get('/notifications/'),
  
  // Mark a notification as read
  markAsRead: (id) => api.patch(`/notifications/${id}/read/`),
  
  // Send a notification (Admin only)
  sendNotification: (data) => api.post('/notifications/send/', data),
};
