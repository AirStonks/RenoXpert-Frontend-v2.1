import React, { ReactNode, useEffect } from 'react';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import KTLayout from '../../metronic/app/layouts/demo1';
import KTComponent from '../../metronic/core';
import { ToastContainer } from 'react-toastify';

interface MasterLayoutProps {
    children: ReactNode;
}

function MasterLayout({ children }: MasterLayoutProps) {
    useEffect(() => {
        KTComponent.init();
        KTLayout.init();
    }, []);

    return (
        <>
            <div className="flex grow">
                <Sidebar />
                <div className="wrapper flex grow flex-col">
                    <Header />
                    <main className="grow content pt-5" id="content" role="content">
                        <div className="container-fixed" id="content_container">
                            {children}
                        </div>
                    </main>
                    <ToastContainer />
                    <Footer />
                </div>
            </div>
        </>
    );
}

export default MasterLayout;

// Container size
// mx-auto px-10