// src\components\Tables\ContactTable.tsx

import { useCallback, useEffect, useState } from 'react';
import { KTDataTable } from '../../metronic/core';
import OwnerRegistrationFormModal from '../Modals/OwnerRegistrationFormModal';
import { approveRegistrationForm, rejectRegistrationForm } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { OwnerRegistrationForm } from '../../types';
import Tooltip from '../Tooltip';

function RegistrationFormTable() {
    const navigate = useNavigate();
    const [selectedFormId, setSelectedFormId] = useState<number | null>(null);

    let datatable;
    let element;
    let dataTableOptions;

    const handleTableClick = useCallback(async (event: MouseEvent) => {
        const target = event.target as HTMLElement;

        // Find the delete button element
        const viewButton = target.closest('[data-action="view"]') as HTMLElement;
        const approveButton = target.closest('[data-action="approve"]') as HTMLElement;
        const rejectButton = target.closest('[data-action="reject"]') as HTMLElement;
        const createQuotationButton = target.closest('[data-action="create_quotation"]') as HTMLElement;


        if (viewButton) {
            const id = viewButton.dataset.id;

            navigate('/registration-forms/' + id);
        }

        if (approveButton) {
            const id = approveButton.dataset.id;

            try {
                const res = await approveRegistrationForm(Number(id));

                if (res?.data.success) {
                    navigate(0);
                }
            } catch (error) {
                console.log(error);
            }
        }

        if (rejectButton) {
            const id = rejectButton.dataset.id;

            try {
                const res = await rejectRegistrationForm(Number(id));

                if (res?.data.success) {
                    navigate(0);
                }
            } catch (error) {
                console.log(error);
            }
        }

        if (createQuotationButton) {
            const id = createQuotationButton.dataset.id;

            navigate('/orders/create?formId=' + id);
        }

    }, []);

    useEffect(() => {
        initContactTable();
    }, []);

    const initContactTable = () => {
        const apiUrl = 'https://api.renoxpert.my/api/owner/reno-registration-form';
        element = document.querySelector('#registration_form_table') as HTMLElement;
        const token = localStorage.getItem('token');

        dataTableOptions = {
            apiEndpoint: apiUrl,
            requestMethod: 'GET',
            requestHeaders: {
                'Authorization': `Bearer ${token}`,
            },
            pageSize: 5,
            stateSave: false,
            columns: {
                id: {
                    title: 'ID',
                },
                name: {
                    title: 'Name',
                    render: (item: string, data: OwnerRegistrationForm) => `
                        <div class="flex">
                            ${data.user.name_first} ${data.user.name_last}
                        </div>
                    `,
                },
                phone_no: {
                    title: "Phone No",
                    render: (item: string, data: OwnerRegistrationForm) => `
                        <div class="flex">
                            ${data.user.country_code}${data.user.phone_no}
                        </div>
                    `
                },
                email: {
                    title: "Email",
                    render: (item: string, data: OwnerRegistrationForm) => `
                        <div class="flex">
                            ${data.user.email}
                        </div>
                    `
                },
                status: {
                    title: "Status"
                },
                action: {
                    title: 'Action',
                    render: (item: string, data: OwnerRegistrationForm) => `
                        <div class="flex justify-around gap-2">
                            <button 
                                class="btn-edit btn btn-sm btn-light"
                                data-tooltip="#view_tooltip"
                                data-action="view"
                                data-modal-toggle="#view_owner_reg_form_modal"
                                data-id="${data.id}"
                            >
                                View
                            </button>

                            ${data.status !== 'approved' && data.status !== 'rejected' ? `
                                <button 
                                    class="btn-delete btn btn-sm btn-success ${!data.property ? 'disabled' : ''}"
                                    data-tooltip="#${!data.property ? 'disabled_tooltip' : 'approve_tooltip'}"
                                    data-action="approve"
                                    data-id="${data.id}"
                                    data-modal-toggle="#confirm_item_modal"
                                >
                                    Approve
                                </button>

                                <button 
                                    class="btn-delete btn btn-sm btn-danger"
                                    data-tooltip="#reject_tooltip"
                                    data-action="reject"
                                    data-id="${data.id}"
                                    data-modal-toggle="#delete_item_modal"
                                >
                                    Reject
                                </button>
                            ` :
                            data.status === 'approved' ? `
                                <button 
                                    class="btn-create-quotation btn btn-sm btn-info"
                                    data-tooltip="#create_quotation_tooltip"
                                    data-action="create_quotation"
                                    data-id="${data.id}"
                                    data-modal-toggle="#create_quotation_modal"
                                >
                                    Create Quotation
                                </button>
                            ` : ''}
                        </div>
                    `
                }
            },
        };

        if (!datatable) {
            datatable = new KTDataTable(element, dataTableOptions);
        }

        if (element) {
            element.addEventListener('click', handleTableClick);

            return () => {
                element.removeEventListener('click', handleTableClick);
            };
        }
    }

    const handleRefresh = async () => {

        const newDatatable = new KTDataTable(element, dataTableOptions);
        console.log(dataTableOptions);


        // if (datatable) {
        //     // const element = document.querySelector('#contact_table') as HTMLElement;
        //     // datatable = KTDataTable.getInstance(element);

        //     // console.log(datatable);

        //     datatable.reload();
        // }

        // const datatableEl = document.querySelector('#contact_table') as HTMLElement;
        // KTDataTable.getInstance(datatableEl).reload();
    }

    return (
        <>
            <div className="grid">
                <div className="card card-grid min-w-full">
                    <div className="card-header flex-wrap gap-2">
                        <h3 className="card-title font-medium text-lg">
                            Form List
                        </h3>
                        <div className="flex flex-wrap gap-2 lg:gap-5 items-center">
                            <button
                                className="btn btn-sm btn-primary text-white"
                                onClick={handleRefresh}
                            >
                                Refresh
                            </button>
                        </div>
                    </div>
                    <div className="card-body">
                        <div data-datatable="true" id="registration_form_table">
                            <div className="scrollable-x-auto">
                                <table className="table table-auto align-middle text-gray-700 font-medium text-sm" data-datatable-table="true">
                                    <thead>
                                        <tr>
                                            <th className="w-[20px]" data-datatable-column="id">
                                                <span className="sort">
                                                    <span className="sort-label">ID</span>
                                                    <span className="sort-icon"></span>
                                                </span>
                                            </th>
                                            <th className="w-[150px]" data-datatable-column="name_preferred">
                                                <span className="sort">
                                                    <span className="sort-label">Name</span>
                                                    <span className="sort-icon"></span>
                                                </span>
                                            </th>
                                            <th className="w-[100px]" data-datatable-column="phone_no">
                                                <span className="sort">
                                                    <span className="sort-label">Phone No</span>
                                                    <span className="sort-icon"></span>
                                                </span>
                                            </th>
                                            <th className="w-[150px]" data-datatable-column="email">
                                                <span className="sort">
                                                    <span className="sort-label">Email</span>
                                                    <span className="sort-icon"></span>
                                                </span>
                                            </th>
                                            <th className="w-[100px]" data-datatable-column="email">
                                                <span className="sort">
                                                    <span className="sort-label">Status</span>
                                                    <span className="sort-icon"></span>
                                                </span>
                                            </th>
                                            <th className="w-[80px] text-center" data-datatable-column="action">
                                                <span className="sort">
                                                    <span className="sort-label">Action</span>
                                                    <span className="sort-icon"></span>
                                                </span>
                                            </th>
                                        </tr>
                                    </thead>
                                </table>
                            </div>
                            <div className="card-footer justify-center md:justify-between flex-col md:flex-row gap-3 text-gray-600 text-2sm font-medium">
                                <div className="flex items-center gap-2">
                                    Show
                                    <select className="select select-sm w-16" data-datatable-size="true" name="perpage"></select>
                                    per page
                                </div>
                                <div className="flex items-center gap-4">
                                    <span data-datatable-info="true"></span>
                                    <div className="pagination" data-datatable-pagination="true"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <OwnerRegistrationFormModal formId={selectedFormId} />

            {/*
            <DeleteModal 
                item={selectedContact}
                modalTitle='Remove Product'
                modalPrompt='Are you sure to permanently remove this contact:'
                notifySuccess='Contact Removed Successfully!'
                notifyError='Contact remove failed'
                navigateUrl='/contacts'
                deleteFunction={removeContact}
            /> */}


            <div className="tooltips">
                <Tooltip id='disabled_tooltip' content='Change property to enable this feature' />
            </div>
        </>
    );
}

export default RegistrationFormTable;