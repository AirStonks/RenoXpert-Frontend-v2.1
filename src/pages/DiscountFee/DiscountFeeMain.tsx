// src\pages\DiscountFee\DiscountFeeMain.tsx

import { useEffect } from 'react';
import DiscountFeesTable from '../../components/Tables/DiscountFeesTable';
import AddDiscountFeeModal from '../../components/Modals/AddDiscountFeeModal';

function DiscountFeeMain() {
    useEffect(() => {
        //
    }, []);

    return (
        <>
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center flex-wrap">
                    <span className="text-2xl font-bold text-gray-900">
                        Discounts and Fees
                    </span>
                    <div className="flex gap-3 flex-wrap">
                        <button
                            className='btn btn-primary btn-sm'
                            data-modal-toggle="#add_discount_fee_modal"
                        >
                            <i className="ki-outline ki-plus-squared"></i>
                            New Discount/Fee
                        </button>
                    </div>
                </div>

                <DiscountFeesTable />
                <AddDiscountFeeModal />
            </div>
        </>
    );
}

export default DiscountFeeMain;
