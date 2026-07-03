import { useContext, useState } from "react";
import AuthContext from "../../contexts/AuthContext";
import Footer from "./Footer";
import Maincontent from "./Maincontent";
import Sidemenu from "./Sidemenu";
import Login from "../../pages/LogIn";
import Header from "./Header";
import ThemeContext from "../../contexts/ThemeContext";

function LayoutContainer() {
    console.log('layout is rendering');

    const authCtx = useContext(AuthContext);
    const themeCtx = useContext(ThemeContext);

    const [sidebarCollapsed, setSidebarCollapsed] = useState(
        JSON.parse(localStorage.getItem("sidebarCollapsed")) ?? false
    );

    const toggleSidebar = () => {
        setSidebarCollapsed((prev) => {
            localStorage.setItem("sidebarCollapsed", JSON.stringify(!prev));
            return !prev;
        });
    };

    return (
        <div className="w-screen h-screen flex flex-col overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300">

            <Header />

            {!authCtx.isLogedIn ? (
                <div className="flex-1 overflow-auto bg-[var(--bg-primary)]">
                    <Login />
                </div>
            ) : (
                <div className="flex-1 flex overflow-hidden">

                    <Sidemenu
                        collapsed={sidebarCollapsed}
                        onToggle={toggleSidebar}
                    />

                    <div className="flex-1 flex flex-col overflow-hidden">

                        <main className="flex-1 overflow-auto bg-[var(--bg-secondary)]">
                            <Maincontent />
                        </main>
                        <Footer />

                    </div>

                </div>
            )}

        </div>
    );
}

export default LayoutContainer;