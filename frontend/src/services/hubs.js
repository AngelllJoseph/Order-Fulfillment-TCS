import api from './api';

export const opsHubService = {
    getHubs: () => api.get('/hubs/hubs/'),
    getMonitoringStats: () => api.get('/hubs/hubs/monitoring-stats/'),
    getSKUMappings: (hubId) => api.get(`/hubs/mappings/${hubId ? `?hub_id=${hubId}` : ''}`),
};

export default opsHubService;
