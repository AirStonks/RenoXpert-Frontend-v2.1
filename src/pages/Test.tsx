import { makePaymentIntent } from "../services/api";

function Test() {

    const handleGetToken = async () => {
        const res = await makePaymentIntent()

        console.log(res);
    }

    return (
        <>
            <button 
                className="btn btn-primary"
                onClick={handleGetToken}
            >
                Test Payex Get Token
            </button>
        </>
    );
}

export default Test;