
import { useState, useEffect } from "react";
import Model from "../utility-components/ModelComponent";
import SideDrawer from "../utility-components/SideDrawer";
import AlertMessage from "../utility-components/AlertMessage";

function Maincontent(props) {
    const [isOpen, setIsOpen] = useState(props.isOpen || false);
    const [drawer, setDrawer] = useState(false);
    const [showAlert, setShowAlert] = useState(false);

    function setOpen() {
        console.log('in set open function', isOpen);
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
        console.log('on close called');
        setIsOpen(false);
    }

    return (
        <div className="relative bg-[#456785] w-[400px] h-full overflow-auto">
            Maincontent content here !
            <br />
            <Model onSubmit={onSubmit} onClose={onClose} isOpen={isOpen} buttonName="Submit">
                This is an alert medel using to display alert messages
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

            <AlertMessage message="This is an alert message" show={showAlert} type="success" duration={3000} onClose={alertClose} />

            <br /> <button onClick={setOpen} >open model</button>
            <br /> <button onClick={drawerOpen} >open drawer</button>
            <br /> <button onClick={alertOpen} >Alert</button>
        </div>
    )
}

export default Maincontent;