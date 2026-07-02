import Footer from "./Footer";
import Header from "./Header";
import Maincontent from "./Maincontent";
import Sidemenu from "./Sidemenu";


function LayoutContainer(props) {

    return (
        <div className="w-[100vw] h-[100vh] overflow-hide flex flex-row">
            {/* sidemenu */}
            <Sidemenu />

            <div className="flex flex-col w-full h-full overflow-y-auto overflow-x-auto">
                {/* header */}
                <Header />
                {/* maincontent */}
                <Maincontent />
                {/* footer */}
                <Footer />
            </div>
        </div >
    )

}
export default LayoutContainer;