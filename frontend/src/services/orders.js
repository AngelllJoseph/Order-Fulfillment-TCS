import api from './api';

export const opsOrderService = {
    getOrders: (params) => api.get('/orders/', { params }),
    getUnassignedOrders: () => api.get('/orders/?unassigned=true'),
    assignHub: (orderId, hubId) => api.post(`/orders/${orderId}/assign-hub/`, { hub_id: hubId }),
    updateStatus: (id, status, notes, extra = {}) => api.post(`/orders/${id}/update-status/`, { status, notes, ...extra }),
    getActivityLog: () => api.get('/orders/activity-log/'),
    getStats: () => api.get('/orders/stats/'),
    reassignItem: (itemId, newHubId, reason) => api.post('/orders/reassign-item/', { item_id: itemId, new_hub_id: newHubId, reason }),
};

export default opsOrderService;
