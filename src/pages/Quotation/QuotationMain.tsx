// src\pages\Quotation\QuotationMain.tsx

import Button from '../../components/Buttons/Button';
import QuotationTable from '../../components/Tables/QuotationTable';
import { useEffect } from 'react';

function QuotationMain() {
    useEffect(() => {
        // Cleanup function to clear localStorage on unmount
        return () => {
            localStorage.removeItem('include_packages');
        };
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
