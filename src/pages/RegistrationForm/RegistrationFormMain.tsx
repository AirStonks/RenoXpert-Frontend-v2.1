import { useEffect } from "react";
import RegistrationFormTable from "../../components/Tables/RegistrationFormTable";
import ClipboardJS from "clipboard";
import { Slide, toast } from "react-toastify";

function RegistrationFormMain() {

    const notify = (type: 'success' | 'error', message: string) => {
        (toast[type] as (message: string, options?: object) => void)(message, {
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: localStorage.getItem('theme'),
            transition: Slide,
        });
    };

    useEffect(() => {
        const clipboard = new ClipboardJS('.copy-link');

        clipboard.on('success', function (e) {
            notify('success', 'Copied to clipboard!');
            e.clearSelection();
            console.log('yeet');
        });

        return () => {
            clipboard.destroy();
        };

    }, []);

    return (
        <>
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center flex-wrap">
                    <span className="text-2xl font-bold text-gray-900">
                        Registration Form Requests
                    </span>
                    <div className="flex gap-3 flex-wrap">
                        <button
                            className="btn btn-sm btn-outline btn-info copy-link flex justify-center gap-2"
                            data-clipboard-text={`${location.protocol}//${window.location.host}/owner/reno-registration-form`}
                        >
                            <i className="ki-filled ki-copy"></i>
                            <span>Copy Registration Link</span>
                        </button>
                    </div>
                </div>

                <RegistrationFormTable />
            </div>
        </>
    );
}

export default RegistrationFormMain;