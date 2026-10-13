import { useState } from 'react';
import { AuthContext } from './AuthContextValue';
import api from '../utils/axios';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const userInfo = localStorage.getItem('userInfo');
            return userInfo ? JSON.parse(userInfo) : null;
        } catch (error) {
            console.error('Could not restore the saved user session:', error);
            localStorage.removeItem('userInfo');
            localStorage.removeItem('token');
            return null;
        }
    });
    const loading = false;

    const saveUser = (data) => {
        setUser(data);
        localStorage.setItem('userInfo', JSON.stringify(data));
        localStorage.setItem('token', data.token);
    };

    const login = async (email, password) => {
        try {
            const { data } = await api.post('/auth/login', { email, password });
            saveUser(data);
            return data;
        } catch (error) {
            const requestError = new Error(
                error.response?.data?.error || error.response?.data?.message || 'Login failed',
                { cause: error }
            );
            requestError.needsVerification = error.response?.data?.code === 'ACCOUNT_NOT_VERIFIED';
            throw requestError;
        }
    };

    const register = async (name, email, password) => {
        try {
            const { data } = await api.post('/auth/register', { name, email, password });
            return data; // Returns { message, email }
        } catch (error) {
            throw new Error(
                error.response?.data?.error || error.response?.data?.message || 'Registration failed',
                { cause: error }
            );
        }
    };

    const verifyOTP = async (email, otp) => {
        try {
            const { data } = await api.post('/auth/verify-otp', { email, otp });
            saveUser(data);
            return data;
        } catch (error) {
            throw new Error(
                error.response?.data?.error || error.response?.data?.message || 'OTP verification failed',
                { cause: error }
            );
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('userInfo');
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ user, login, register, verifyOTP, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};