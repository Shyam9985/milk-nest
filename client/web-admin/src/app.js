import { useContext } from "react";
import Layout from "./components/layout/LayoutContainer";
import Login from "./pages/LogIn";
import AuthContext from "./contexts/AuthContext";

function App() {

    const authCtx = useContext(AuthContext);
    return (
        <>
            {authCtx.isLoggedIn ? <Layout /> : <Login />}
        </>
    )
}

export default App;