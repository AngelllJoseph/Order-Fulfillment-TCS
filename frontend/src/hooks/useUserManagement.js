import { useState, useEffect } from 'react';
import { userService, roleService, logService, sessionService } from '../services/api';

export const useUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await userService.getUsers();
            setUsers(response.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const createUser = async (userData) => {
        try {
            const response = await userService.createUser(userData);
            await fetchUsers();
            return { success: true, data: response.data };
        } catch (err) {
            console.error('Error creating user:', err);
            return { success: false, error: err.response?.data || err.message };
        }
    };

    const updateUser = async (id, userData) => {
        try {
            const response = await userService.updateUser(id, userData);
            await fetchUsers();
            return { success: true, data: response.data };
        } catch (err) {
            console.error('Error updating user:', err);
            return { success: false, error: err.response?.data || err.message };
        }
    };

    const toggleStatus = async (id) => {
        try {
            const response = await userService.toggleUserStatus(id);
            await fetchUsers();
            return { success: true, data: response.data };
        } catch (err) {
            console.error('Error toggling user status:', err);
            return { success: false, error: err.response?.data || err.message };
        }
    };

    const resetPassword = async (id, password) => {
        try {
            const response = await userService.resetPassword(id, password);
            return { success: true, data: response.data };
        } catch (err) {
            console.error('Error resetting password:', err);
            return { success: false, error: err.response?.data || err.message };
        }
    };

    return { users, loading, error, refresh: fetchUsers, createUser, updateUser, toggleStatus, resetPassword };
};

export const useRoles = () => {
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [rolesRes, permsRes] = await Promise.all([
                roleService.getRoles(),
                roleService.getPermissions()
            ]);
            setRoles(rolesRes.data);
            setPermissions(permsRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return { roles, permissions, loading, refresh: fetchData };
};
