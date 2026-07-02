import { useContext } from "react";
import AuthContext from "../../contexts/AuthContext";


function Header(props) {
    const authCtx = useContext(AuthContext);
    return (
        <>
            <div className="w-full max-h-[200px] min-h-[70px] bg-[#ddd]">
                Header content here !
            </div>
            <button onClick={authCtx.handleLogOut}>Log-out</button></>
    )
}

export default Header;