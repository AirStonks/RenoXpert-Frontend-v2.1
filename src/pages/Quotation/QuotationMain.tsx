// src\pages\Product\ProductMain.tsx

import Button from '../../components/Buttons/Button';
import QuotationTable from '../../components/Tables/QuotationTable ';
import KTComponent from '../../metronic/core';
import { useEffect } from 'react';
// import ProductTable from '../../components/Tables/ProductTable';

function QuotationMain() {
    useEffect(() => {
        KTComponent.init();
    }, []);

    return (
        <>
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center flex-wrap">
                    <span className="text-2xl font-bold text-gray-900">
                        Quotation Overview
                    </span>
                    <div className="flex gap-3 flex-wrap">
                        <Button 
                            url='/quotations/create'
                            btnText='Create Quotation'
                            btnSize='btn-sm' 
                            icon='ki-outline ki-plus-squared'
                        />
                    </div>
                </div>

                <QuotationTable />
            </div>
        </>
    );
}

export default QuotationMain;