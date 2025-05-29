import { ReactNode, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import { Link } from 'react-router-dom';

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/op/' : '/';

interface MasterLayoutProps {
    children: ReactNode;
}

function OperationMasterLayout({ children }: MasterLayoutProps) {
    useEffect(() => {

    }, []);

    return (
        <main className="grow pt-5 items-center" id="content" role="content">
            <div className="flex flex-col items-center">
                <div className="container relative flex items-center justify-center" id="content_container">
                    <div className="flex flex-col flex-wrap pb-40 justify-center items-center w-full max-w-4xl px-2">
                        <div className="flex mb-4">
                            <Link
                                to={LOCAL_PATH_PREFIX + 'home'}
                            >
                                <img className="default-logo min-h-[22px] h-[48px] max-w-none" src="/app/RenoExpert_logo-01.svg"></img>
                            </Link>
                        </div>
                        {children}
                    </div>
                </div>
            </div>

            <ToastContainer />
        </main>
    );
}

export default OperationMasterLayout;