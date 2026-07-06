import About from '../pages/About';
import authRoutes from '../pages/auth/auth.router'
import Dashboard from '../pages/Dashboard';
import PageNotFound from '../pages/PageNotFound';

export const publicRoutes = [
    ...authRoutes,
    { path: "*", component: PageNotFound, lazy: false },
];

export const protectedRoutes = [
    { path: "/dashboard", component: Dashboard, lazy: false },
    { path: "/about", component: About, lazy: false },
    { path: "*", component: PageNotFound, lazy: false },
];
