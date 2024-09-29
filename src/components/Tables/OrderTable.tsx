// src\components\Tables\ContactTable.tsx

import { useCallback, useEffect, useState } from 'react';
import { KTDataTable, KTModal } from '../../metronic/core';
import { Order } from '../../types';
import { useNavigate } from 'react-router-dom';
import OrderDetailModal from '../Modals/OrderDetailModal';

function OrderTable() {
    const navigate = useNavigate();
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
    const [selectedContactId, setSelectedContactId] = useState<number>(null);
    const [selectedContact, setSelectedContact] = useState<{ id: number, name: string } | null>(null);

    let datatable;
    let element;
    let dataTableOptions;

    const handleTableClick = useCallback((event: MouseEvent) => {
        const target = event.target as HTMLElement;

        // Find the delete button element
        const deleteButton = target.closest('[data-action="delete"]') as HTMLElement;
        const editButton = target.closest('[data-action="edit"]') as HTMLElement;
        const viewButton = target.closest('[data-action="view"]') as HTMLElement;

        if (deleteButton) {
            const id = deleteButton.dataset.id;
            const name = deleteButton.dataset.name;

            if (id && name) {
                setSelectedContact({ id: parseInt(id, 10), name });

                // Close Modal
                const modalEl = document.querySelector('#delete_item_modal') as HTMLElement | null;

                if (modalEl) {
                    const modal = KTModal.getInstance(modalEl);
                    if (modal) {
                        modal.hide();
                    }
                }
            }
        } else if (editButton) {
            const id = editButton.dataset.id;

            if (id) {
                navigate(`/orders/edit/${id}`);
            }
        } else if (viewButton) {
            const id = viewButton.dataset.id;

            if (id) {
                setSelectedOrderId(parseInt(id, 10));
            }
        }
    }, [navigate]);

    useEffect(() => {
        initContactTable();
    }, []);

    const initContactTable = () => {
        const apiUrl = 'http://' + window.location.hostname + ':8000/api/orders';
        element = document.querySelector('#order_table') as HTMLElement;
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
                order_no: {
                    title: 'Order No.',
                },
                contact: {
                    title: 'Contact',
                    render: (item: string, data: any) => `
                        <div class="flex flex-col gap-1">
                            <span>${data.contact.name}</span>
                            <span class="text-xs text-slate-400">${data.contact.email}</span>
                            <span class="text-xs text-slate-700">${data.contact.phone_no}</span>
                        </div>
                    `,
                },
                unit: {
                    title: 'Unit',
                    render: (item: string, data: Order) => `
                        <div class="flex flex-col gap-1">
                            <span>${data.block}-${data.floor}-${data.unit_no}</span>
                        </div>
                    `,
                },
                property: {
                    title: 'Property',
                    render: (item: string, data: any) => `
                        <div class="flex flex-col gap-1">
                            <span>${data.property.name}</span>
                        </div>
                    `,
                },
                status: {
                    title: 'Status',
                },
                quotation: {
                    title: 'Quotation',
                    render: (item: string, data: any) => `
                        <div class="flex flex-col gap-1">
                            <button
                                class="btn btn-outline btn-primary btn-sm flex justify-center"
                                data-action="view"
                                data-id=${data.id}
                                data-modal-toggle="#order_detail_modal"
                            >
                                View Quotation
                            </button>
                        </div>
                    `,
                },
                action: {
                    title: 'Action',
                    render: (item: string, data: Order) => `
                        <div class="flex justify-around gap-2">
                            <button 
                                class="btn-edit btn btn-sm btn-icon btn-clear btn-light"
                                data-tooltip="#edit_tooltip"
                                data-action="edit"
                                data-id="${data.id}"
                            >
                                <i class="ki-outline ki-notepad-edit"></i>
                            </button>

                            <button 
                                class="btn-delete btn btn-sm btn-icon btn-clear btn-light"
                                data-tooltip="#remove_tooltip"
                                data-action="delete"
                                data-id="${data.id}"
                                data-name="${data.order_no}"
                                data-modal-toggle="#delete_item_modal">
                                <i class="ki-outline ki-trash"></i>
                            </button>
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

    const handleCloseModal = async () => {
        setSelectedOrderId(null);
    };

    return (
        <>
            <div className="grid">
                <div className="card card-grid min-w-full">
                    <div className="card-header flex-wrap gap-2">
                        <h3 className="card-title font-medium text-lg">
                            Contact List
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
                        <div data-datatable="true" id="order_table">
                            <div className="scrollable-x-auto">
                                <table className="table table-auto align-middle text-gray-700 font-medium text-sm" data-datatable-table="true">
                                    <thead>
                                        <tr>
                                            <th className="w-[150px]" data-datatable-column="order_no">
                                                <span className="sort">
                                                    <span className="sort-label">Order No.</span>
                                                    <span className="sort-icon"></span>
                                                </span>
                                            </th>
                                            <th className="w-[150px]" data-datatable-column="contact">
                                                <span className="sort">
                                                    <span className="sort-label">Contact</span>
                                                    <span className="sort-icon"></span>
                                                </span>
                                            </th>
                                            <th className="w-[80px]" data-datatable-column="unit">
                                                <span className="sort">
                                                    <span className="sort-label">Unit</span>
                                                    <span className="sort-icon"></span>
                                                </span>
                                            </th>
                                            <th className="w-[120px]" data-datatable-column="property">
                                                <span className="sort">
                                                    <span className="sort-label">Property</span>
                                                    <span className="sort-icon"></span>
                                                </span>
                                            </th>
                                            <th className="w-[80px]" data-datatable-column="status">
                                                <span className="sort">
                                                    <span className="sort-label">Status</span>
                                                    <span className="sort-icon"></span>
                                                </span>
                                            </th>
                                            <th className="w-[80px]" data-datatable-column="quotation">
                                                <span className="sort">
                                                    <span className="sort-label">Quotation</span>
                                                    <span className="sort-icon"></span>
                                                </span>
                                            </th>
                                            <th className="w-[110px] text-center" data-datatable-column="created_at">
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

            <OrderDetailModal orderId={selectedOrderId} onClose={handleCloseModal} />
            
            {/* <DeleteModal 
                item={selectedContact}
                modalTitle='Remove Product'
                modalPrompt='Are you sure to permanently remove this contact:'
                notifySuccess='Contact Removed Successfully!'
                notifyError='Contact remove failed'
                navigateUrl='/contacts'
                deleteFunction={removeContact}
            />  */}
        </>
    );
}

export default OrderTable;