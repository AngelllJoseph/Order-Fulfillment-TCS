import api from './api';

export const opsService = {
    getAlerts: () => api.get('/operations/alerts/'),
    getDelayRisks: () => api.get('/operations/delay-risks/'),
    reassignHub: (data) => api.post('/operations/reassign-hub/', data),
    extendETA: (data) => api.post('/operations/extend-eta/', data),
    notifyCustomer: (data) => api.post('/operations/notify-customer/', data),
};
