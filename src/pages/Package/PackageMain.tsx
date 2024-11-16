// src\pages\Product\Package\PackageMain.tsx

import ActivityCenter from '../../components/ActivityCenter';
import Button from '../../components/Buttons/Button';
import PackageTable from '../../components/Tables/PackageTable';
import KTComponent from '../../metronic/core';
import { useEffect } from 'react';

function PackageMain() {
    useEffect(() => {
        KTComponent.init();
    }, []);

    return (
        <>
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center flex-wrap">
                    <span className="text-2xl font-bold text-gray-900">
                        Package Overview
                    </span>
                    <div className="flex gap-3 flex-wrap">
                        <Button
                            url='/packages/create'
                            btnText='Add New Package'
                            btnSize='btn-sm'
                            icon='ki-outline ki-plus-squared'
                        />
                    </div>
                </div>


                {/* <ActivityCenter /> */}

                <PackageTable />
            </div>
        </>
    );
}

export default PackageMain;