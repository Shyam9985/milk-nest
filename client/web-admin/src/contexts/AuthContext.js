import React, { useContext, useEffect, useState } from 'react';

const AuthContext = React.createContext({ isLogedIn: false, user: null, handleLogin: undefined, handleLogOut: undefined });

export function AuthContextProvider(props) {
    const [loggedIn, setLogedIn] = useState(false);

    useEffect(() => {
        const loginSts = localStorage.getItem('isLogedIn');
        setLogedIn(loginSts === 'true' ? true : false);
    }, []);

    function onLogin() {
        setLogedIn(true);
        localStorage.setItem('isLogedIn', true);
    }

    function onLogout() {
        setLogedIn(false);
        localStorage.setItem('isLogedIn', false);

    }

    return (
        <AuthContext.Provider value={{ isLogedIn: loggedIn, handleLogin: onLogin, handleLogOut: onLogout }}>
            {props.children}
        </AuthContext.Provider >
    )
}

export default AuthContext;