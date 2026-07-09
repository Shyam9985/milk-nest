import React, { useContext, useEffect, useState } from 'react';

const AuthContext = React.createContext({ isLogedIn: false, user: null, handleLogin: undefined, handleLogOut: undefined });

export function AuthContextProvider(props) {
    const [loggedIn, setLogedIn] = useState(false);

    useEffect(() => {
        const loginSts = localStorage.getItem('isLogedIn');
        setLogedIn(loginSts === 'true' ? true : false);
    }, []);

    function onLogin(user) {
        setLogedIn(true);
        localStorage.setItem('isLogedIn', true);
        localStorage.setItem('user-data', JSON.stringify(user));
    }

    function onLogout() {
        setLogedIn(false);
        localStorage.setItem('isLogedIn', false);
        localStorage.removeItem('user-data');
        localStorage.removeItem('access-token');
    }

    return (
        <AuthContext.Provider value={{ isLogedIn: loggedIn, handleLogin: onLogin, handleLogOut: onLogout }}>
            {props.children}
        </AuthContext.Provider >
    )
}

export default AuthContext;