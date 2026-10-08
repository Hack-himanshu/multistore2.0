import axios from 'axios';

// FIXED: this used to silently fall back to a relative '/api' path with no
// warning. On Vercel that means every request (including login) hits the
// frontend's own domain instead of the Render backend and 404s — which is
// exactly what was happening. It still falls back gracefully for local dev
// (where the Vite proxy in vite.config.js handles '/api'), but now it's loud
// about it in a real production build so this doesn't silently break again.
if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
    // eslint-disable-next-line no-console
    console.error(
        '[MultiStore] VITE_API_URL is not set in this production build. ' +
        'API calls will go to this site\'s own domain instead of your backend, ' +
        'and things like login will fail with 404s. Set VITE_API_URL in your ' +
        'Vercel/hosting environment variables and redeploy.'
    );
}

const apiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

const api = axios.create({
    baseURL: apiUrl ? `${apiUrl}/api` : '/api',
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ─── Request Interceptor: Attach JWT ─────────────────────────────────────────
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('ms_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ─── Response Interceptor: Handle 401 globally ───────────────────────────────
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response ?.status === 401) {
            // Token expired or invalid — clear auth state and redirect
            localStorage.removeItem('ms_token');
            localStorage.removeItem('ms_user');
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// ─── Auth Services ────────────────────────────────────────────────────────────
export const authService = {
    register: (data) => api.post('/auth/register', data),
    registerCustomer: (data) => api.post('/auth/register-customer', data),
    login: (data) => api.post('/auth/login', data),
    getMe: () => api.get('/auth/me'),
    updateProfile: (data) => api.patch('/auth/update-profile', data),
    changePassword: (data) => api.patch('/auth/change-password', data),
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
    resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
};

// ─── Store Services ───────────────────────────────────────────────────────────
export const storeService = {
    getMyStore: () => api.get('/stores/my-store'),
    updateMyStore: (data) => api.patch('/stores/my-store', data),
    updateTheme: (themeSettings) => api.patch('/stores/my-store/theme', { themeSettings }),
    updateHomepage: (homepageSections) => api.patch('/stores/my-store/homepage', { homepageSections }),
    getPublicStore: (slug) => api.get(`/stores/public/${slug}`),
};

// ─── Admin Services ───────────────────────────────────────────────────────────
export const adminService = {
    getAllStores: (params) => api.get('/stores/admin/stores', { params }),
    getPlatformStats: () => api.get('/stores/admin/stats'),
    toggleStoreActive: (storeId) => api.patch(`/stores/admin/stores/${storeId}/toggle-active`),
};

// ─── Product Services (Phase 1) ───────────────────────────────────────────────
export const productService = {
    getAll: (params) => api.get('/products', { params }),
    getOne: (id) => api.get(`/products/${id}`),
    create: (data) => api.post('/products', data),
    update: (id, data) => api.patch(`/products/${id}`, data),
    delete: (id) => api.delete(`/products/${id}`),
    getPublic: (storeSlug, params) => api.get(`/products/public/${storeSlug}`, { params }),
    getPublicOne: (storeSlug, productSlug) => api.get(`/products/public/${storeSlug}/${productSlug}`),
};

// ─── Category Services (Phase 1) ─────────────────────────────────────────────
export const categoryService = {
    getAll: () => api.get('/categories'),
    create: (data) => api.post('/categories', data),
    update: (id, data) => api.patch(`/categories/${id}`, data),
    delete: (id) => api.delete(`/categories/${id}`),
    getPublic: (storeSlug) => api.get(`/categories/public/${storeSlug}`),
};

// ─── Order Services (Phase 1) ─────────────────────────────────────────────────
export const orderService = {
    getAll: (params) => api.get('/orders', { params }),
    getOne: (id) => api.get(`/orders/${id}`),
    updateStatus: (id, status, note, trackingNumber) => api.patch(`/orders/${id}/status`, { status, note, trackingNumber }),
    createPublic: (storeSlug, data) => api.post(`/orders/public/${storeSlug}`, data),
    getDashboardStats: () => api.get('/orders/stats/dashboard'),
};

// ─── Upload Service (Device Image Upload) ─────────────────────────────────────
export const uploadService = {
    uploadImage: (file) => {
        const formData = new FormData();
        formData.append('image', file);
        return api.post('/upload/image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
};

// ─── AI Services (Phase 5) ───────────────────────────────────────────────────
export const aiService = {
    chat: (messages, storeContext) => api.post('/ai/chat', { messages, storeContext }),
};

// ─── Payment Services (Razorpay) ──────────────────────────────────────────────
export const paymentService = {
    createGatewayOrder: (storeSlug, orderId) =>
        api.post(`/payments/public/${storeSlug}/create-order`, { orderId }),
    verifyPayment: (storeSlug, payload) =>
        api.post(`/payments/public/${storeSlug}/verify`, payload),
};

// ─── Payment Settings (owner connects their OWN Razorpay/Stripe/PayPal) ───────
export const paymentSettingsService = {
    get: () => api.get('/stores/my-store/payment-settings'),
    update: (payload) => api.patch('/stores/my-store/payment-settings', payload),
};

export default api;