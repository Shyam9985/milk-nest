
import { useState, useEffect } from "react";
import Model from "../../utils/ModelComponent";
import SideDrawer from "../../utils/SideDrawer";
import AlertMessage from "../../utils/AlertMessage";

function Maincontent(props) {
    const [isOpen, setIsOpen] = useState(props.isOpen || false);
    const [drawer, setDrawer] = useState(false);
    const [showAlert, setShowAlert] = useState(false);

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
        <div className="relative w-[25rem] h-full overflow-auto bg-[var(--bg-primary)] text-[var(--text-primary)] border-l border-[var(--border-primary)] transition-colors duration-300">

            Maincontent content here !

            <br />

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

            <AlertMessage
                message="This is an alert message"
                show={showAlert}
                type="success"
                duration={3000}
                onClose={alertClose}
            />

            <br />

            <button
                onClick={setOpen}
                className="px-4 py-2 rounded-md bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] border border-[var(--btn-primary-border)] hover:opacity-90 transition"
            >
                Open Model
            </button>

            <br />
            <br />

            <button
                onClick={drawerOpen}
                className="px-4 py-2 rounded-md bg-[var(--btn-secondary-bg)] text-[var(--btn-secondary-text)] border border-[var(--btn-secondary-border)] hover:bg-[var(--bg-secondary)] transition"
            >
                Open Drawer
            </button>

            <br />
            <br />

            <button
                onClick={alertOpen}
                className="px-4 py-2 rounded-md bg-[var(--brand-primary)] text-white border border-[var(--brand-primary)] hover:opacity-90 transition"
            >
                Show Alert
            </button>

        </div>
    )
}

export default Maincontent;