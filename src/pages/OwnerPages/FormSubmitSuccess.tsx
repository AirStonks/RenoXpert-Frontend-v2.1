import { useEffect } from "react";
import { Link } from "react-router-dom";

const token = localStorage.getItem('o_token');

function FormSubmitSuccess() {

    useEffect(() => {
        document.title = "Success | RenoXpert";
    }, []);

    return (
        <main className="grow pt-5 items-center" id="content" role="content">
            <div className="flex flex-col items-center">
                <div className="container relative flex flex-col items-center justify-center" id="content_container">
                    <div className="flex flex-col flex-wrap gap-6 pb-40 justify-center items-center w-full max-w-4xl px-2">
                        <img className="default-logo min-h-[22px] h-[48px] max-w-none" src="/app/RenoExpert_logo-01.svg"></img>
                    </div>
                </div>

                <div className="flex flex-col justify-center items-center gap-6">
                    <div className="flex">
                        <i className="ki-duotone ki-verify text-9xl text-green-500"></i>
                    </div>

                    <div className="flex flex-col mx-8 justify-center items-center text-center">
                        <span className="text-2xl font-semibold text-gray-900">Thank You!</span>
                    </div>

                    <div className="flex flex-col mx-8 justify-center items-center text-center">
                        <span className="text-xl font-semibold text-gray-500">Reno Registration Form has been successfully submitted.</span>
                    </div>

                    <div className="flex flex-col mx-8 justify-center items-center text-center">
                        {token ?
                            <span className="text-lg font-medium text-gray-900">You can now go back to <Link to={'/owner/home'} className="link underline">Home Page</Link></span>
                            :
                            <span className="text-lg font-medium text-gray-900">You can now proceed to <Link to={'/owner/login'} className="link underline">Login</Link></span>
                        }
                    </div>
                </div>
            </div>
        </main>
    );
}

export default FormSubmitSuccess;