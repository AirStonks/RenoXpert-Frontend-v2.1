// src\components\Tables\OrderTable.tsx

import { useCallback, useEffect, useState } from 'react';
import { KTDataTable, KTModal } from '../../metronic/core';
import { Order, Sale } from '../../types';
import { useNavigate } from 'react-router-dom';
// import OrderDetailModal from '../Modals/OrderDetailModal';
// import DeleteModal from '../Modals/DeleteModal';
import { confirmOrder } from '../../services/api';
import { KTDataTableConfigInterface } from '../../metronic/core/components/datatable';
import { Slide, toast } from 'react-toastify';
import SaleInvoicesModal from '../Modals/SaleInvoicesModal';

function SalesTable() {
    const navigate = useNavigate();
    const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
    // const [selectedOrder, setSelectedOrder] = useState<{ id: number, name: string } | null>(null);

    let datatable;
    let element: HTMLElement;
    let dataTableOptions: KTDataTableConfigInterface;

    const notify = (type: 'success' | 'error', message: string) => {
        (toast[type] as (message: string, options?: object) => void)(message, {
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: localStorage.getItem('theme'),
            transition: Slide,
        });
    };

    const handleTableClick = useCallback(async (event: MouseEvent) => {
        const target = event.target as HTMLElement;

        // Find the delete button element
        const deleteButton = target.closest('[data-action="delete"]') as HTMLElement;
        const editButton = target.closest('[data-action="edit"]') as HTMLElement;
        const viewButton = target.closest('[data-action="view"]') as HTMLElement;
        const confirmButton = target.closest('[data-action="confirm"]') as HTMLElement;

        if (deleteButton) {
            const id = deleteButton.dataset.id;
            const name = deleteButton.dataset.name;

            if (id && name) {
                setSelectedOrder({ id: parseInt(id, 10), name });

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

            navigate('/sales/' + id);
        } else if (confirmButton) {
            const id = confirmButton.dataset.id;
            console.log('ID: ', id);

            try {
                const response = await confirmOrder(Number(id));

                if (response?.success) {
                    notify('success', 'Status updated.');

                    navigate(0);
                }

            } catch (error) {
                console.error('Product removal failed:', error);
            }
        }

    }, [navigate]);

    useEffect(() => {
        initSaleTable();
    }, []);

    const initSaleTable = () => {
        const apiUrl = 'https://sapi.renoxpert.my/api/sales';
        element = document.querySelector('#sales_table') as HTMLElement;
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
                sales_no: {
                    title: 'Order No.',
                    render: (item: string, data: Order) => `
                        <div class="flex flex-col gap-1">
                            <a
                                class="cursor-pointer text-orange-500"
                                data-action="view"
                                data-id=${data.id}
                            >
                                ${item}
                            </a>
                        </div>
                    `,
                },
                status: {
                    title: 'Status',
                    render: (item: string) => `
                        <div class="flex flex-col gap-1">
                            <div class="flex items-center">
                                <span class="badge badge-pill p-2 cursor-default
                                    ${item === 'issued' ? 'badge-primary' : ''} 
                                    ${item === 'partial-paid' ? 'badge-info' : ''} 
                                    ${item === 'fully-paid' ? 'badge-success' : ''} 
                                    badge-outline"
                                >
                                    ${item}
                                </span>
                            </div>
                        </div>
                    `
                },
                total_amount: {
                    title: 'Total Amount',
                    render: (item: number) => `
                        <div class="flex flex-col gap-1">
                            <span>RM ${item.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    `,
                },
                paid_amount: {
                    title: 'Paid Amount',
                    render: (item: number, data: Sale) => `
                        <div class="flex flex-col gap-1">
                            <span>RM ${(data.total_amount - data.remaining_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    `,
                },
                remaining_amount: {
                    title: 'Balance (Amount)',
                    render: (item: number) => `
                        <div class="flex flex-col gap-1">
                            <span>RM ${item.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    `,
                },
                remaining_percentage: {
                    title: 'Balance (%)',
                    render: (item: number) => `
                        <div class="flex flex-col gap-1">
                            <span>${item * 100}%</span>
                        </div>
                    `,
                },
                // action: {
                //     title: 'Action',
                //     render: (item: string, data: Order) => {
                //         const isConfirmed = data.status === 'confirmed';
                //         const isRevoked = data.status === 'revoked';

                //         return `
                //             <div class="flex justify-around gap-2">
                //                 ${!isConfirmed && !isRevoked ? `
                //                     <button 
                //                         class="btn-confirm btn btn-sm btn-success"
                //                         data-tooltip="#confirm_tooltip"
                //                         data-action="confirm"
                //                         data-id="${data.id}"
                //                     >
                //                         Confirm
                //                     </button>
                //                     <button 
                //                         class="btn-edit btn btn-sm btn-icon btn-clear btn-light"
                //                         data-tooltip="#edit_tooltip"
                //                         data-action="edit"
                //                         data-id="${data.id}"
                //                     >
                //                         <i class="ki-outline ki-notepad-edit"></i>
                //                     </button>
                //                     <button 
                //                         class="btn-delete btn btn-sm btn-icon btn-clear btn-light"
                //                         data-tooltip="#remove_tooltip"
                //                         data-action="delete"
                //                         data-id="${data.id}"
                //                         data-name="${data.order_no}"
                //                         data-modal-toggle="#delete_item_modal"
                //                     >
                //                         <i class="ki-outline ki-trash"></i>
                //                     </button>
                //                 ` : ''}
                
                //                 ${isConfirmed ? `
                //                     <button 
                //                         class="btn-edit btn btn-sm btn-icon btn-clear btn-light"
                //                         data-tooltip="#edit_tooltip"
                //                         data-action="edit"
                //                         data-id="${data.id}"
                //                     >
                //                         <i class="ki-outline ki-notepad-edit"></i>
                //                     </button>
                //                     <button 
                //                         class="btn-revoke btn btn-sm btn-danger"
                //                         data-tooltip="#revoke_tooltip"
                //                         data-action="revoke"
                //                         data-id="${data.id}"
                //                     >
                //                         Revoke
                //                     </button>
                //                 ` : ''}
                
                //                 ${isRevoked ? `
                //                     <button 
                //                         class="btn-regenerate btn btn-sm btn-warning"
                //                         data-tooltip="#regenerate_tooltip"
                //                         data-action="regenerate"
                //                         data-id="${data.id}"
                //                     >
                //                         Regenerate Order
                //                     </button>
                //                 ` : ''}
                //             </div>
                //         `;
                //     }
                // }

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

    // const handleCloseModal = async () => {
    //     setSelectedOrderId(null);
    // };

    return (
        <>
            <div className="grid">
                <div className="card card-grid min-w-full">
                    <div className="card-header flex-wrap gap-2">
                        <h3 className="card-title font-medium text-lg">
                            Sales List
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
                        <div data-datatable="true" id="sales_table">
                            <div className="scrollable-x-auto">
                                <table className="table table-auto align-middle text-gray-700 font-medium text-sm" data-datatable-table="true">
                                    <thead>
                                        <tr>
                                            <th className="w-[100px]" data-datatable-column="sales_no">
                                                <span className="sort">
                                                    <span className="sort-label">Sales No.</span>
                                                    <span className="sort-icon"></span>
                                                </span>
                                            </th>
                                            <th className="w-[100px]" data-datatable-column="status">
                                                <span className="sort">
                                                    <span className="sort-label">Status</span>
                                                    <span className="sort-icon"></span>
                                                </span>
                                            </th>
                                            <th className="w-[120px]" data-datatable-column="total_amount">
                                                <span className="sort">
                                                    <span className="sort-label">Total Amount</span>
                                                    <span className="sort-icon"></span>
                                                </span>
                                            </th>
                                            <th className="w-[80px]" data-datatable-column="remaining_amount">
                                                <span className="sort">
                                                    <span className="sort-label">Paid Amount</span>
                                                    <span className="sort-icon"></span>
                                                </span>
                                            </th>
                                            <th className="w-[80px]" data-datatable-column="remaining_amount">
                                                <span className="sort">
                                                    <span className="sort-label">Balance (Amount)</span>
                                                    <span className="sort-icon"></span>
                                                </span>
                                            </th>
                                            <th className="w-[150px]" data-datatable-column="remaining_percentage">
                                                <span className="sort">
                                                    <span className="sort-label">Balance (%)</span>
                                                    <span className="sort-icon"></span>
                                                </span>
                                            </th>
                                            <th className="w-[120px] text-center" data-datatable-column="created_at">
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

            <SaleInvoicesModal orderId={1}/>

            {/* <DeleteModal
                item={selectedOrder}
                modalTitle='Remove Order'
                modalPrompt='Are you sure to permanently remove this order:'
                notifySuccess='Order Removed Successfully!'
                notifyError='Order remove failed'
                navigateUrl='/orders'
                deleteFunction={removeOrder}
            /> */}
        </>
    );
}

export default SalesTable;