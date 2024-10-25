import { ReactNode, useEffect } from 'react';
import KTComponent, { KTModal } from '../../metronic/core';
import { ToastContainer } from 'react-toastify';
import { Link } from 'react-router-dom';

interface MasterLayoutProps {
    children: ReactNode;
}

function OwnerMasterLayout({ children }: MasterLayoutProps) {
    useEffect(() => {

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

            <ToastContainer />
        </main>
    );
}

export default OwnerMasterLayout;