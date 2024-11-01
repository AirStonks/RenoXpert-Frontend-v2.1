// src\components\Tables\QuotationTable.tsx

import { useCallback, useEffect, useState } from 'react';
import { KTDataTable, KTModal } from '../../metronic/core';
import { Package } from '../../types';
import DeleteModal from '../Modals/DeleteModal';
import QuotationDetailModal from '../Modals/QuotationDetailModal';
import { removeQuotation } from '../../services/api';
import { useNavigate } from 'react-router-dom';

function QuotationTable () {
    const navigate = useNavigate();
    const [selectedQuotationId, setSelectedQuotationId] = useState<number | null>(null);
    const [selectedQuotation, setSelectedQuotation] = useState<{ id: number, name: string } | null>(null);
    let datatable;

    const handleTableClick = useCallback((event: MouseEvent) => {
        const target = event.target as HTMLElement;
        const viewButton = target.closest('[data-action="view"]') as HTMLElement;
        const deleteButton = target.closest('[data-action="delete"]') as HTMLElement;

        if (viewButton) {
            const id = viewButton.dataset.id;
            navigate('/quotations/' + id);
        } else if (deleteButton) {
            console.log('yes');

            const id = deleteButton.dataset.id;
            const name = deleteButton.dataset.name;

            if (id && name) {
                setSelectedQuotation({ id: parseInt(id, 10), name });

                // Close Modal
                const modalEl = document.querySelector('#delete_quotation_modal') as HTMLElement | null;

                if (modalEl) {
                    const modal = KTModal.getInstance(modalEl);
                    if (modal) {
                        modal.hide();
                    }
                }
            }
        }
    }, [setSelectedQuotation]);

    const handleCloseModal = async () => {
        const detailModalEl = document.querySelector('#quotation_detail_modal') as HTMLElement;
        const detailModal = KTModal.getInstance(detailModalEl);


        detailModal.on('hidden', () => {
            const modalEl = document.querySelector('#edit_quotation_modal') as HTMLElement;
            const modal = KTModal.getInstance(modalEl);

            // Buffer for getting modal-open status
            setTimeout(() => {
                if (modal.isOpen() == false && detailModal.isOpen() == false) {
                    setSelectedQuotationId(null);
                    localStorage.removeItem('include_packages');
                }
            }, 200);

        });
    };

    const initPackageTable = useCallback(() => {
        const apiUrl = `https://api.renoxpert.my/api/quotations`;
        const element = document.querySelector('#quotation_table') as HTMLElement;
        const token = localStorage.getItem('token');

        const dataTableOptions = {
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
                },
                description: {
                    title: 'Description',
                },
                total_amount: {
                    title: 'Total Amount',
                    render: (item: number) => `RM ${item.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                },
                action: {
                    title: 'Action',
                    render: (item: string, data: Package) => `
                        <div class="flex justify-around gap-2">
                            <button 
                                class="btn btn-sm btn-secondary"
                                data-action="view"
                                data-id="${data.id}"
                            >
                                View
                            </button>
                            <button 
                                class="btn-delete btn btn-sm btn-icon btn-danger"
                                data-tooltip="#remove_tooltip"
                                data-action="delete"
                                data-id="${data.id}"
                                data-name="${data.name}"
                                data-modal-toggle="#delete_item_modal"
                            >
                                <i class="ki-outline ki-trash"></i>
                            </button>
                        </div>
                    `
                }
            },
        };

        datatable = new KTDataTable(element, dataTableOptions);
    }, []);

    useEffect(() => {
        initPackageTable();
        document.querySelector('#quotation_table')?.addEventListener('click', handleTableClick);

        return () => {
            document.querySelector('#quotation_table')?.removeEventListener('click', handleTableClick);
        };

    }, [initPackageTable, handleTableClick]);

    const handleRefresh = async () => {
        const element = document.querySelector('#quotation_table') as HTMLElement;

        const quotationTable = KTDataTable.getInstance(element);

        console.log('Element: ', element);
        console.log('DataTable: ', quotationTable);

        quotationTable.reload();
    }

    return (
        <>
            <div className="grid">
                <div className="card card-grid min-w-full">
                    <div className="card-header flex-wrap gap-2">
                        <h3 className="card-title font-medium text-lg">
                            Quotation List
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
                        <div data-datatable="true" id="quotation_table">
                            <div className="scrollable-x-auto">
                                <table className="table table-auto align-middle text-gray-700 font-medium text-sm" data-datatable-table="true">
                                    <thead>
                                        <tr>
                                            <th className="w-[10px]" data-datatable-column="id">
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
                                            <th className="w-[300px]" data-datatable-column="description">
                                                <span className="sort">
                                                    <span className="sort-label">Description</span>
                                                    <span className="sort-icon"></span>
                                                </span>
                                            </th>
                                            <th className="w-[110px]" data-datatable-column="total_amount">
                                                <span className="sort">
                                                    <span className="sort-label">Total Amount</span>
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
                        </div>
                    </div>
                </div>
            </div>

            <QuotationDetailModal quotationId={selectedQuotationId} onClose={handleCloseModal} />

            <DeleteModal
                item={selectedQuotation}
                modalTitle='Remove Quotation'
                modalPrompt='Are you sure to permanently remove this package:'
                notifySuccess='Quotation Removed Successfully!'
                notifyError='Quotation remove failed'
                navigateUrl='/quotations'
                deleteFunction={removeQuotation}
            />
        </>
    );
}

export default QuotationTable ;
