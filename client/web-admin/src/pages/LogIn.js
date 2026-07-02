import { useContext } from "react";
import AuthContext from "../contexts/AuthContext";

function Login(props) {

    const authCtx = useContext(AuthContext);
    
    return (
        <>
            <button onClick={authCtx.handleLogin}>Login</button>
            {/* <button onClick={authCtx.handleLogOut}>LogOut</button> */}
        </>
    )
}
export default Login;