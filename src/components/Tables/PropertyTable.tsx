// src\components\Tables\ContactTable.tsx

import { useCallback, useEffect, useState } from 'react';
import { KTDataTable, KTModal } from '../../metronic/core';
import EditPropertyModal from '../Modals/EditPropertyModal';
import { Contact, Property } from '../../types';
import DeleteModal from '../Modals/DeleteModal';
import { removeProperty } from '../../services/api';

function PropertyTable() {
    const [selectedPropertyId, setSelectedPropertyId] = useState<number>(null);
    const [selectedProperty, setSelectedProperty] = useState<{ id: number, name: string } | null>(null);
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
                setSelectedProperty({ id: parseInt(id, 10), name });

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
                setSelectedPropertyId(parseInt(id, 10));
            }
        }
    }, [setSelectedPropertyId]);

    useEffect(() => {
        initPropertyTable();
    }, []);

    const initPropertyTable = () => {
        const apiUrl = 'https://sapi.renoxpert.my/api/properties';
        element = document.querySelector('#property_table') as HTMLElement;
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
                    title: 'Property Name',
                },
                address: {
                    title: 'Address',
                    render: (item: string, data: Property) => {
                        const addressParts = [
                            data.address,
                            data.street,
                            data.postcode,
                            data.city,
                            data.state
                        ].filter(part => part !== null && part !== '');
                    
                        return `
                            <div class="flex flex-col gap-1">
                                <span>${addressParts.join(', ')}</span>
                            </div>
                        `;
                    },
                    
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
                                data-modal-toggle="#edit_property_modal"
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
        //     // const element = document.querySelector('#property_table') as HTMLElement;
        //     // datatable = KTDataTable.getInstance(element);
            
        //     // console.log(datatable);
            
        //     datatable.reload();
        // }

        // const datatableEl = document.querySelector('#property_table') as HTMLElement;
        // KTDataTable.getInstance(datatableEl).reload();
    }

    return (
        <>
            <div className="grid">
                <div className="card card-grid min-w-full">
                    <div className="card-header flex-wrap gap-2">
                        <h3 className="card-title font-medium text-lg">
                            Property List
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
                        <div data-datatable="true" id="property_table">
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
                                            <th className="w-[250px]" data-datatable-column="name">
                                                <span className="sort">
                                                    <span className="sort-label">Name</span>
                                                    <span className="sort-icon"></span>
                                                </span>
                                            </th>
                                            <th className="w-[700px]" data-datatable-column="address">
                                                <span className="sort">
                                                    <span className="sort-label">Address</span>
                                                    <span className="sort-icon"></span>
                                                </span>
                                            </th>
                                            <th className="w-[150px] text-center" data-datatable-column="created_at">
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

            <EditPropertyModal propertyId={selectedPropertyId} />
            
            <DeleteModal 
                item={selectedProperty}
                modalTitle='Remove Property'
                modalPrompt='Are you sure to permanently remove this property:'
                notifySuccess='Property Removed Successfully!'
                notifyError='Property remove failed'
                navigateUrl='/properties'
                deleteFunction={removeProperty}
            />
        </>
    );
}

export default PropertyTable;