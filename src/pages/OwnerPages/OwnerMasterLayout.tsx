import { ReactNode, useEffect } from 'react';
import KTComponent, { KTModal } from '../../metronic/core';
import { ToastContainer } from 'react-toastify';
import { Link } from 'react-router-dom';

interface MasterLayoutProps {
    children: ReactNode;
}

function OwnerMasterLayout({ children }: MasterLayoutProps) {
    useEffect(() => {
        KTComponent.init();

        const modalEl = document.querySelector('#modal_2') as HTMLElement;
        const modal = KTModal.getInstance(modalEl);

        console.log(modal);
        modal.show();
    }, []);

    return (
        <main className="grow pt-5 items-center" id="content" role="content">
            <div className="flex flex-col items-center">
                <div className="container relative flex items-center justify-center" id="content_container">
                    <div className="flex flex-col flex-wrap gap-6 pb-28 justify-center items-center w-full max-w-4xl">
                        <Link
                            to={'/owner/home'}
                        >
                            <img className="default-logo min-h-[22px] h-[48px] max-w-none" src="/app/RenoExpert_logo-01.svg"></img>
                        </Link>
                        {children}
                    </div>
                </div>
            </div>

            <div className="modal p-14" data-modal="true" id="modal_2">
                <div className="modal-content modal-center-y max-w-[500px]">
                    <div className="modal-header py-3 px-5">
                        <span className="text-lg text-gray-900 font-bold">Action Required</span>
                        <button
                            className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
                            data-modal-dismiss="true"
                        >
                            <i className="ki-filled ki-cross"></i>
                        </button>
                    </div>
                    <div className="modal-body p-0 pb-5">
                        <h3 className="text-lg font-medium text-gray-900 text-center my-4">
                            <i className="ki-solid ki-security-user text-7xl text-emerald-400"></i>
                        </h3>

                        <div className="text-2sm text-center text-gray-700 mb-6">
                            If you have pending Order Agreement, please complete the profile before agree on order agreement.
                        </div>

                        <div className="flex justify-center items-center gap-4">
                            <button className="btn btn-light" data-modal-dismiss="true">
                                Dismiss
                            </button>
                            <button
                                className="btn btn-info"
                                // onClick={handleSubmit}
                            >
                                Complete Profile
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <ToastContainer />
        </main>
    );
}

export default OwnerMasterLayout;