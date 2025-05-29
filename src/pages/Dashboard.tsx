// src\pages\Dashboard.tsx

// import Table from '../components/Table';
import { Link } from 'react-router-dom';
import KTLayout from '../metronic/app/layouts/demo1';
import KTComponent from '../metronic/core';
import { useEffect, useState } from 'react';

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/staff/' : '/';

const MEDIA_URL =
    import.meta.env.VITE_APP_ENV === "local"
        ? '/public/media/'
        : '/media/';

function Dashboard() {

    useEffect(() => {
        document.title = "Dashboard | RenoXpert";
        KTComponent.init();
    }, []);
    return (
        <div className="card">
            <div className="card-body flex flex-col items-center gap-2.5 py-7.5">
                <div className="flex justify-center p-7.5 py-9">
                    <img alt="image" className="dark:hidden max-h-[230px]" src={`${MEDIA_URL}illustrations/22.svg`} />
                    <img alt="image" className="light:hidden max-h-[230px]" src={`${MEDIA_URL}illustrations/22-dark.svg`} />
                </div>
                <div className="flex flex-col gap-5 lg:gap-7.5">
                    <div className="flex flex-col gap-3 text-center">
                        <h2 className="text-1.5xl font-semibold text-gray-900">
                            Welcom to RenoXpert Dashboard
                        </h2>
                        <p className="text-sm text-gray-800">
                            Get starting with RenoXpert Dashboard with
                        </p>
                    </div>
                    <div className="flex justify-center mb-5 gap-4 flex-wrap">
                        <Link
                            to={LOCAL_PATH_PREFIX + 'orders'}
                            className='btn btn-primary btn-outline'
                        >
                            Orders
                        </Link>
                        <Link
                            to={LOCAL_PATH_PREFIX + 'sales'}
                            className='btn btn-primary btn-outline'
                        >
                            Sales
                        </Link>
                        <Link
                            to={LOCAL_PATH_PREFIX + 'registration-forms'}
                            className='btn btn-primary btn-outline'
                        >
                            Registration Forms List
                        </Link>
                        <Link
                            to={LOCAL_PATH_PREFIX + 'quotations'}
                            className='btn btn-primary btn-outline'
                        >
                            Quotations
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Dashboard;