import { useContext, useState, useEffect } from "react";
import AuthContext from "../../contexts/AuthContext";
import ThemeContext from "../../contexts/ThemeContext";
import Sidemenu from "./Sidemenu";
import Maincontent from "./Maincontent";
import Header from "./Header";
import Footer from "./Footer";



export function ProtectedLayout(props) {
    // console.log('protected layout rendered');

    const themeCtx = useContext(ThemeContext);

    const [sidebarCollapsed, setSidebarCollapsed] = useState(
        window.innerWidth < 1024
            ? true
            : (JSON.parse(localStorage.getItem("sidebar-collapsed")) ?? false)
    );


    const [isTablet, setIsTablet] = useState(window.innerWidth < 1024);


    useEffect(() => {

        const handleResize = () => {
            setIsTablet(window.innerWidth < 1024);
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };

    }, []);

    // entering tablet range resets to collapsed; leaving it restores the saved desktop preference
    useEffect(() => {
        if (isTablet) {
            setSidebarCollapsed(true);
        } else {
            setSidebarCollapsed(JSON.parse(localStorage.getItem("sidebar-collapsed")) ?? false);
        }
    }, [isTablet]);

    // persist only the desktop preference, so tablet auto-collapse never overwrites it
    useEffect(() => {
        if (!isTablet) localStorage.setItem("sidebar-collapsed", JSON.stringify(sidebarCollapsed));
    }, [sidebarCollapsed, isTablet]);

    return (
        <div className="w-screen h-screen flex flex-col overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300">

            <Header />
            <div className="flex-1 flex overflow-hidden">

                <Sidemenu
                    collapsed={sidebarCollapsed}
                    onToggle={() =>
                        setSidebarCollapsed(prev => !prev)
                    }
                />

                <div className="flex-1 flex flex-col overflow-hidden">

                    <main className="flex-1 overflow-auto bg-[var(--bg-secondary)]">
                        <Maincontent />
                    </main>
                    <Footer />

                </div>
            </div>
        </div>
    )
}