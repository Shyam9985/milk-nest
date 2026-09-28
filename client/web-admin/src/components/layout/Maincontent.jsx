
import { useState, useEffect } from "react";
import Model from "../../utils/ModelComponent";
import SideDrawer from "../../utils/SideDrawer";
import AlertMessage from "../../utils/AlertMessage";
import { Outlet, useNavigate } from "react-router-dom";
import Loader from "../Loading";

function Maincontent(props) {
    const [isOpen, setIsOpen] = useState(props.isOpen || false);
    const [drawer, setDrawer] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const navigate = useNavigate();

    function setOpen() {
        setIsOpen(true);
    }

    function drawerOpen() {
        setDrawer(true)
    }


    function alertClose() {
        setShowAlert(false)
    }

    function alertOpen() {
        setShowAlert(true);
    }
    function onSubmit() {
        console.log('on sibmit called');
    }
    function onClose() {
        setIsOpen(false);
    }

    return (
        <div className="relative h-full overflow-auto bg-[var(--bg-primary)] text-[var(--text-primary)] border-l border-[var(--border-primary)] transition-colors duration-300">
            <Model
                onSubmit={onSubmit}
                onClose={onClose}
                isOpen={isOpen}
                buttonName="Submit"
            >
                This is an alert model using to display alert messages.
            </Model>

            <SideDrawer
                isOpen={drawer}
                onClose={() => setDrawer(false)}
                title="Station Details"
                width="500px"
                direction="right"
            >
                Drawer Content
            </SideDrawer>

            <Outlet />

        </div>
    )
}

export default Maincontent;