import React, { useContext, useEffect, useState } from 'react';

const AuthContext = React.createContext({ isLoggedIn: false, user: null, handleLogin: undefined, handleLogOut: undefined });

export function AuthContextProvider(props) {
    const [loggedIn, setLogedIn] = useState(false);

    useEffect(() => {
        const loginSts = localStorage.getItem('isLoggedIn');
        console.log(loginSts, typeof loginSts);
        setLogedIn(loginSts === 'false' ? false : true);
    }, []);

    function onLogin() {
        setLogedIn(true);
        localStorage.setItem('isLoggedIn', true);
    }

    function onLogout() {
        setLogedIn(false);
        localStorage.setItem('isLoggedIn', false);

    }

    return (
        <AuthContext.Provider value={{ isLoggedIn: loggedIn, handleLogin: onLogin, handleLogOut: onLogout }}>
            {props.children}
        </AuthContext.Provider >
    )
}

export default AuthContext;