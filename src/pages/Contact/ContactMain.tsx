// src\pages\Contact\ContactMain.tsx

import { useEffect } from 'react';
import CreateContactModal from '../../components/Modals/CreateContactModal';
import ContactTable from '../../components/Tables/ContactTable';

function ContactMain() {
    useEffect(() => {
        //
    }, []);

    return (
        <>
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center flex-wrap">
                    <span className="text-2xl font-bold text-gray-900">
                        Contacts
                    </span>
                    <div className="flex gap-3 flex-wrap">
                        <button
                            className='btn btn-primary btn-sm'
                            data-modal-toggle="#create_contact_modal"
                        >
                            <i className="ki-outline ki-plus-squared"></i>
                            New Contact
                        </button>
                    </div>
                </div>

                <ContactTable  />
                <CreateContactModal />        
            </div>
        </>
    );
}

export default ContactMain;
