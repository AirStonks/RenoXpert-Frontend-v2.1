// src\pages\Order\OrderMain.tsx

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
// import CreatePropertyModal from '../../components/Modals/CreatePropertyModal';
// import PropertyTable from '../../components/Tables/PropertyTable';

function OrderMain() {
    useEffect(() => {
        //
    }, []);

    return (
        <>
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center flex-wrap">
                    <span className="text-2xl font-bold text-gray-900">
                        Orders
                    </span>
                    <div className="flex gap-3 flex-wrap">
                        <Link
                            to={'/orders/create'}
                            className='btn btn-primary btn-sm'
                            data-modal-toggle="#create_order_modal"
                        >
                            <i className="ki-outline ki-plus-squared"></i>
                            Add New Order
                        </Link>
                    </div>
                </div>

                {/* <PropertyTable  />
                <CreatePropertyModal /> */}
            </div>
        </>
    );
}

export default OrderMain;
