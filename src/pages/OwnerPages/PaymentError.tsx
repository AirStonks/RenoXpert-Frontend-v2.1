// 
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import Loading from '../../components/Loading';

function PaymentError() {
    const [errorData, setErrorData] = useState(null);
    const location = useLocation();

    useEffect(() => {
        // Parse query parameters
        const queryParams = new URLSearchParams(location.search);
        const errorDataStr = queryParams.get('errorData');

        if (errorDataStr) {
            setErrorData(JSON.parse(decodeURIComponent(errorDataStr)));
        }

        // Optionally clear the localStorage after retrieving if you had set it before
        localStorage.removeItem('errorData');
    }, [location]);

    if (!errorData) {
        return <Loading />; // Show loading state if data is not yet available
    }

    console.log(errorData);
    

    return (
        <div className="container-fluid" id="content_container">
            <div className="flex flex-col items-center justify-center h-[95%]">

                <div className="mb-10">
                    <img alt="image" className="dark:hidden max-h-[160px]" src="/public/media/illustrations/6.svg" />
                    <img alt="image" className="light:hidden max-h-[160px]" src="/public/media/illustrations/6.svg" />
                </div>
                <span className="badge badge-primary badge-outline mb-3">
                    Error Code: {errorData.errorCode}
                </span>
                <h3 className="text-2.5xl font-semibold text-gray-900 text-center mb-2">
                    Transaction Failed
                </h3>
                <div className="text-md text-center text-gray-700 mb-3">
                    There are something error while performing the payment transaction.
                </div>
                <div className="text-sm font-medium text-center text-gray-700 mb-10">
                    Invoice No: {errorData.invoiceNo}
                </div>
                <div className="relative">
                    <Link
                        to={errorData.returnUrl}
                        className="btn btn-lg btn-primary rounded-3xl shadow-lg">
                        Go Back
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default PaymentError;