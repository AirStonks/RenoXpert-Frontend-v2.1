import { useEffect } from "react";
import KTComponent from "../../metronic/core";

const O_TOKEN = localStorage.getItem('o_token');

function OwnerHome() {

    useEffect(() => {
        KTComponent.init();
        console.log(O_TOKEN);
        
    }, []);

    return (
        <>
            <span>YAY</span>
        </>
    )
}

export default OwnerHome;