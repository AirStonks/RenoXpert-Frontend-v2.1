import { ReactNode, useEffect } from 'react';
import KTComponent from '../../metronic/core';
import { ToastContainer } from 'react-toastify';

interface MasterLayoutProps {
    children: ReactNode;
}

function OwnerMasterLayout({ children }: MasterLayoutProps) {
    useEffect(() => {
        KTComponent.init();
    }, []);

    return (
        <main className="grow content pt-5" id="content" role="content">
            <div className="container-fluid relative" id="content_container">
                <div className="flex flex-col flex-wrap gap-6 pb-28 justify-center items-center">
                    <img className="default-logo min-h-[22px] h-[52px] max-w-none" src="/app/RenoExpert_logo-01.svg"></img>
                    {children}
                </div>
                <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2">
                </div>
            </div>

            <ToastContainer />
        </main>
    );
}

export default OwnerMasterLayout;