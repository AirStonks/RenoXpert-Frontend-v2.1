import ActivityCenter from "../components/ActivityCenter";
import { makePaymentIntent, testSms } from "../services/api";

function Test() {

    const handleGetToken = async () => {
        const res = await makePaymentIntent();

        console.log(res);
    }

    const handleSms = async () => {
        const res = await testSms();

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

            <button 
                className="btn btn-info"
                onClick={handleSms}    
            >
                Test SMS
            </button>

            
            <ActivityCenter />
        </>
    );
}

export default Test;