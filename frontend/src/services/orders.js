import api from './api';

export const opsOrderService = {
    getOrders: (params) => api.get('/orders/', { params }),
    getUnassignedOrders: () => api.get('/orders/?unassigned=true'),
    assignHub: (orderId, hubId) => api.post(`/orders/${orderId}/assign-hub/`, { hub_id: hubId }),
    updateStatus: (id, status, notes) => api.post(`/orders/${id}/update-status/`, { status, notes }),
    getStats: () => api.get('/orders/stats/'),
};

export default opsOrderService;
