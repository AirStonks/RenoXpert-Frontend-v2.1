// src\pages\Sales\SalesMain.tsx

import { useEffect } from 'react';
import SalesTable from '../../components/Tables/SalesTable';
// import CreatePropertyModal from '../../components/Modals/CreatePropertyModal';
// import PropertyTable from '../../components/Tables/PropertyTable';

function SalesMain() {
    useEffect(() => {
        //
    }, []);

    return (
        <>
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center flex-wrap">
                    <span className="text-2xl font-bold text-gray-900">
                        Sales
                    </span>
                    <div className="flex gap-3 flex-wrap">
                        
                    </div>
                </div>

                <SalesTable  />
                {/* <CreatePropertyModal /> */}
            </div>
        </>
    );
}

export default SalesMain;
