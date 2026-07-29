import React, { useContext, useEffect, useState } from 'react';
import { registerLogoutHandler } from '../store/interceptor';

const AuthContext = React.createContext({ isLoggedIn: false, user: null, handleLogin: undefined, handleLogOut: undefined });

export function AuthContextProvider(props) {
    const [loggedIn, setLoggedIn] = useState(false);

    function onLogin(user) {
        setLoggedIn(true);
        localStorage.setItem('isLoggedIn', true);
        localStorage.setItem('user-data', JSON.stringify(user));
        localStorage.setItem('landing-url', user?.landing_url)
    }

    function onLogout() {
        setLoggedIn(false);
        localStorage.setItem('isLoggedIn', false);
        localStorage.removeItem('user-data');
        localStorage.removeItem('access-token');
    }

    useEffect(() => {
        const loginSts = localStorage.getItem("isLoggedIn");
        setLoggedIn(loginSts === "true");

        registerLogoutHandler(onLogout);

        return () => registerLogoutHandler(null);
    }, []);

    return (
        <AuthContext.Provider value={{ isLoggedIn: loggedIn, handleLogin: onLogin, handleLogOut: onLogout }}>
            {props.children}
        </AuthContext.Provider >
    )
}

export default AuthContext;