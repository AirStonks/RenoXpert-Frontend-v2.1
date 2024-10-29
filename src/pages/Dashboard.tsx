// src\pages\Dashboard.tsx

// import Table from '../components/Table';
import KTLayout from '../metronic/app/layouts/demo1';
import KTComponent from '../metronic/core';
import { useEffect } from 'react';

function Dashboard() {
    useEffect(() => {
        KTComponent.init();
        KTLayout.init();
    }, []);
    return <></>
}

export default Dashboard;