// src\pages\Master\MasterLayout.tsx

import { ReactNode, useEffect } from 'react';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import KTLayout from '../../metronic/app/layouts/demo1';
import KTComponent from '../../metronic/core';
import { ToastContainer } from 'react-toastify';
import { UserProvider } from '../../context/UserContext'; // Adjust the path if necessary

interface MasterLayoutProps {
    children: ReactNode;
}

function MasterLayout({ children }: MasterLayoutProps) {
    useEffect(() => {
        KTComponent.init();
        KTLayout.init();
    }, []);

    return (
        <UserProvider>
            <div className="flex grow">
                <Sidebar />
                <div className="wrapper flex grow flex-col">
                    <Header />
                    <main className="grow content scrollable" id="content" role="content">
                        <div className="container-fluid h-full pt-4" id="content_container">
                            {children}
                        </div>
                    </main>
                    <ToastContainer />
                    <Footer />
                </div>
            </div>
        </UserProvider>
    );
}

export default MasterLayout;
