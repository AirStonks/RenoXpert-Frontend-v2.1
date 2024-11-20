// src\components\Tables\ContactTable.tsx

import { useCallback, useEffect, useState } from 'react';
import { KTDataTable, KTModal } from '../../metronic/core';
import EditContactModal from '../Modals/EditContactModal';
import { Contact } from '../../types';
import DeleteModal from '../Modals/DeleteModal';
import { removeContact } from '../../services/api';

function ContactTable() {
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
                setSelectedContactId(parseInt(id, 10));
            }
        }
    }, [setSelectedContactId]);

    useEffect(() => {
        initContactTable();
    }, []);

    const initContactTable = () => {
        const apiUrl = 'https://sapi.renoxpert.my/api/contacts';
        element = document.querySelector('#contact_table') as HTMLElement;
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
                    render: (item: string, data: Contact) => `
                        <div class="flex flex-col gap-1">
                            <span>${item}</span>
                            <span class="text-xs text-slate-400">${data.email}</span>
                            <span class="text-xs text-slate-700">${data.phone_no}</span>
                        </div>
                    `,
                },
                alt_phone_no: {
                    title: 'Alternate Phone No.',
                },
                gender: {
                    title: 'Gender',
                },
                race: {
                    title: 'Race',
                },
                nationality: {
                    title: 'Nationality',
                },
                action: {
                    title: 'Action',
                    render: (item: string, data: Contact) => `
                        <div class="flex justify-around gap-2">
                            <button 
                                class="btn-edit btn btn-sm btn-icon btn-clear btn-light"
                                data-tooltip="#edit_tooltip"
                                data-action="edit"
                                data-id="${data.id}"
                                data-modal-toggle="#edit_contact_modal"
                            >
                                <i class="ki-outline ki-notepad-edit"></i>
                            </button>

                            <button 
                                class="btn-delete btn btn-sm btn-icon btn-clear btn-light"
                                data-tooltip="#remove_tooltip"
                                data-action="delete"
                                data-id="${data.id}"
                                data-name="${data.name}"
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
                        <div data-datatable="true" id="contact_table">
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
                                            <th className="w-[150px]" data-datatable-column="name">
                                                <span className="sort">
                                                    <span className="sort-label">Name</span>
                                                    <span className="sort-icon"></span>
                                                </span>
                                            </th>
                                            <th className="w-[120px]" data-datatable-column="alternate_phone_no">
                                                <span className="sort">
                                                    <span className="sort-label">Alternate Phone No.</span>
                                                    <span className="sort-icon"></span>
                                                </span>
                                            </th>
                                            <th className="w-[80px]" data-datatable-column="gender">
                                                <span className="sort">
                                                    <span className="sort-label">Gender</span>
                                                    <span className="sort-icon"></span>
                                                </span>
                                            </th>
                                            <th className="w-[80px]" data-datatable-column="race">
                                                <span className="sort">
                                                    <span className="sort-label">Race</span>
                                                    <span className="sort-icon"></span>
                                                </span>
                                            </th>
                                            <th className="w-[80px]" data-datatable-column="nationality">
                                                <span className="sort">
                                                    <span className="sort-label">Nationality</span>
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

            <EditContactModal contactId={selectedContactId} />
            
            <DeleteModal 
                item={selectedContact}
                modalTitle='Remove Product'
                modalPrompt='Are you sure to permanently remove this contact:'
                notifySuccess='Contact Removed Successfully!'
                notifyError='Contact remove failed'
                navigateUrl='/contacts'
                deleteFunction={removeContact}
            />
        </>
    );
}

export default ContactTable;