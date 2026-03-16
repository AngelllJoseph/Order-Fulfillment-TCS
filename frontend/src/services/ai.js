import api from './api';

export const aiService = {
    getDecisions: (params) => api.get('/ai/decisions/', { params }),
    getDecision: (id) => api.get(`/ai/decisions/${id}/`),
    recommend: (orderId) => api.post('/ai/decisions/recommend/', { order_id: orderId }),
    bulkRecommend: () => api.post('/ai/decisions/bulk-recommend/'),
    approve: (id, reason = '') => api.post(`/ai/decisions/${id}/approve/`, { reason }),
    reject: (id, reason = '') => api.post(`/ai/decisions/${id}/reject/`, { reason }),
    getAccuracyStats: () => api.get('/ai/accuracy-stats/'),
    getApprovalHistory: (params) => api.get('/ai/approval-history/', { params }),
};

export default aiService;
