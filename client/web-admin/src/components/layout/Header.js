import { useContext } from "react";
import AuthContext from "../../contexts/AuthContext";


function Header(props) {
    const authCtx = useContext(AuthContext);
    return (
        <>
            <div className="w-full max-h-40 min-h-12 bg-[#ddd]">
                Header content here !
            </div>
            <button onClick={authCtx.handleLogOut}>Log-out</button></>
    )
}

export default Header;