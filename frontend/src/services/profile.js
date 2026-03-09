import api from './api';

export const profileService = {
    getProfile: () => api.get('/auth/me/'),
    updateProfile: (data) => api.put('/auth/me/', data), // Placeholder if me/ supports PUT
};

export default profileService;
