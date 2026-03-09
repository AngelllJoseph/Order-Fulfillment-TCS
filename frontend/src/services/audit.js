import api from './api';

export const auditService = {
    getLogs: (params) => api.get('/audit/', { params }),
    getAIRecommendations: () => api.get('/audit/?module=AI'),
};

export default auditService;
