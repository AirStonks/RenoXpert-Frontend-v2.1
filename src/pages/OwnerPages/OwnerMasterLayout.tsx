import { ReactNode, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import { Link } from 'react-router-dom';

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/owner/' : '/';

interface MasterLayoutProps {
    children: ReactNode;
}

function OwnerMasterLayout({ children }: MasterLayoutProps) {
    useEffect(() => {

    }, []);

    return (
        <main className="grow items-center bg-gray-50" id="content" role="content">
            <div className="flex flex-col items-center bg-gray-50">
                <div className="container relative flex items-center justify-center" id="content_container">
                    <div className="flex flex-col flex-wrap pt-5 pb-40 justify-center items-center w-full max-w-4xl">
                        <Link
                            to={LOCAL_PATH_PREFIX + 'home'}
                            className='mb-4 w-full px-5'
                        >
                            <img className="default-logo min-h-[22px] h-[42px] max-w-none" src="/app/RenoExpert_logo-01.svg"></img>
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