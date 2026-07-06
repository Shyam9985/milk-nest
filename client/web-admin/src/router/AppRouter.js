import { Route, Routes } from "react-router-dom";
import { ProtectedLayout } from "../components/layout/ProtectedLayout";
import { PublicLayout } from "../components/layout/PublicLayout";
import { publicRoutes, protectedRoutes } from "../router/router";
import PublicRouteGuard from "./PublicRouterGuard";
import ProtectedRouteGuard from "./ProtectedRouterGuard";
import PageNotFound from "../pages/PageNotFound";
import { Suspense } from "react";
import Loader from "../components/Loading";

function AppRouter(props) {
    return <>
        <Routes>
            <Route element={<PublicRouteGuard />}>
                <Route element={<PublicLayout />}>
                    {publicRoutes.map(route => (
                        <Route key={route.path} path={route.path} element={
                            route.lazy ? (
                                <Suspense fallback={<Loader />}><route.component /></Suspense>)
                                : (<route.component />)
                        } />
                    ))}
                </Route>
            </Route>

            <Route element={<ProtectedRouteGuard />}>
                <Route element={<ProtectedLayout />}>
                    {protectedRoutes.map(route => (
                        <Route key={route.path} path={route.path} element={
                            route.lazy ? (
                                <Suspense fallback={<Loader />}><route.component /></Suspense>)
                                : (<route.component />)
                        } />
                    ))}
                </Route>
            </Route>
        </Routes>
    </>
}

export default AppRouter