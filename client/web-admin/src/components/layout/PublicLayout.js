
import { Outlet } from "react-router-dom";

export function PublicLayout(props) {
    
    console.log('plblic layout rendered');

    return (<>
        <Outlet />
    </>)
}