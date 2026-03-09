import api from './api';

export const reportsService = {
    getOperationalStats: () => api.get('/orders/stats/'),
    getHubLoadStats: () => api.get('/hubs/hubs/monitoring-stats/'),
    exportExcel: () => { /* In practice, this would be a direct download link */ },
    exportPDF: () => { /* In practice, this would be a direct download link */ },
};

export default reportsService;
