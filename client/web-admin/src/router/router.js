import About from '../pages/About';
import authRouter from '../pages/auth/auth.router'
import Dashboard from '../pages/Dashboard';
import PageNotFound from '../pages/PageNotFound';
import settingsRouter from '../pages/settings/settings.router';


export const publicRoutes = [
    ...authRouter,
    { path: "*", component: PageNotFound, lazy: false },
];

export const protectedRoutes = [
    ...settingsRouter,
    { path: "/dashboard", component: Dashboard, lazy: false },
    { path: "/about", component: About, lazy: true },
    { path: "*", component: PageNotFound, lazy: false },
];
