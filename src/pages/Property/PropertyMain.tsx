// src\pages\Contact\ContactMain.tsx

import { useEffect } from 'react';
import CreatePropertyModal from '../../components/Modals/CreatePropertyModal';
import PropertyTable from '../../components/Tables/PropertyTable';

function PropertyMain() {
    useEffect(() => {
        document.title = "Property | RenoXpert";
    }, []);

    return (
        <>
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center flex-wrap">
                    <span className="text-2xl font-bold text-gray-900">
                        Property List
                    </span>
                    <div className="flex gap-3 flex-wrap">
                        <button
                            className='btn btn-primary btn-sm'
                            data-modal-toggle="#create_property_modal"
                        >
                            <i className="ki-outline ki-plus-squared"></i>
                            New Property
                        </button>
                    </div>
                </div>

                <PropertyTable  />
                <CreatePropertyModal />        
            </div>
        </>
    );
}

export default PropertyMain;
