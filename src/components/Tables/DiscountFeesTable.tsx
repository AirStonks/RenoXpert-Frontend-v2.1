// src\components\Tables\OrderTable.tsx

import { useCallback, useEffect, useState } from 'react';
import { KTDataTable, KTModal } from '../../metronic/core';
import { DiscountFee, Order, Sale } from '../../types';
import { useNavigate } from 'react-router-dom';
import { confirmOrder } from '../../services/api';
import { KTDataTableConfigInterface } from '../../metronic/core/components/datatable';
import { Slide, toast } from 'react-toastify';
import SaleInvoicesModal from '../Modals/SaleInvoicesModal';

function DiscountFeesTable() {
    const navigate = useNavigate();
    // const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
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

    // const handleTableClick = useCallback(async (event: MouseEvent) => {
    //     const target = event.target as HTMLElement;

    //     // Find the delete button element
    //     const deleteButton = target.closest('[data-action="delete"]') as HTMLElement;
    //     const editButton = target.closest('[data-action="edit"]') as HTMLElement;
    //     const viewButton = target.closest('[data-action="view"]') as HTMLElement;
    //     const confirmButton = target.closest('[data-action="confirm"]') as HTMLElement;

    //     if (deleteButton) {
    //         const id = deleteButton.dataset.id;
    //         const name = deleteButton.dataset.name;

    //         if (id && name) {
    //             setSelectedOrder({ id: parseInt(id, 10), name });

    //             // Close Modal
    //             const modalEl = document.querySelector('#delete_item_modal') as HTMLElement | null;

    //             if (modalEl) {
    //                 const modal = KTModal.getInstance(modalEl);
    //                 if (modal) {
    //                     modal.hide();
    //                 }
    //             }
    //         }
    //     } else if (editButton) {
    //         const id = editButton.dataset.id;

    //         if (id) {
    //             navigate(`/orders/edit/${id}`);
    //         }
    //     } else if (viewButton) {
    //         const id = viewButton.dataset.id;

    //         navigate('/sales/' + id);
    //     } else if (confirmButton) {
    //         const id = confirmButton.dataset.id;
    //         console.log('ID: ', id);

    //         try {
    //             const response = await confirmOrder(Number(id));

    //             if (response?.success) {
    //                 notify('success', 'Status updated.');

    //                 navigate(0);
    //             }

    //         } catch (error) {
    //             console.error('Product removal failed:', error);
    //         }
    //     }

    // }, [navigate]);

    useEffect(() => {
        initDiscountFeeTable();
    }, []);

    const initDiscountFeeTable = () => {
        const apiUrl = 'http://' + window.location.hostname + ':8000/api/discountFees';
        element = document.querySelector('#discount_fee_table') as HTMLElement;
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
                    // render: (item: string) => `
                    //     <div class="flex flex-col gap-1">
                    //         <div class="flex items-center">
                    //             <span class="badge badge-pill p-2 cursor-default
                    //                 ${item === 'issued' ? 'badge-primary' : ''} 
                    //                 badge-outline"
                    //             >
                    //                 ${item}
                    //             </span>
                    //         </div>
                    //     </div>
                    // `
                },
                type: {
                    title: 'Type',
                    // render: (item: number) => `
                    //     <div class="flex flex-col gap-1">
                    //         <span>RM ${item.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    //     </div>
                    // `,
                },
                value: {
                    title: 'Value',
                    render: (item: number, data: DiscountFee) => {
                        return `
                            <div class="flex flex-col gap-1">
                                ${(data.percentage ? `${data.percentage * 100}%` : `RM ${data.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)}
                            </div>
                        `;
                    },
                
                },
            },
        };

        if (!datatable) {
            datatable = new KTDataTable(element, dataTableOptions);
        }

        // if (element) {
        //     element.addEventListener('click', handleTableClick);

        //     return () => {
        //         element.removeEventListener('click', handleTableClick);
        //     };
        // }
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
                            Discount and Fee List
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
                        <div data-datatable="true" id="discount_fee_table">
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
                                            <th className="w-[100px]" data-datatable-column="name">
                                                <span className="sort">
                                                    <span className="sort-label">Name</span>
                                                    <span className="sort-icon"></span>
                                                </span>
                                            </th>
                                            <th className="w-[120px]" data-datatable-column="type">
                                                <span className="sort">
                                                    <span className="sort-label">Type</span>
                                                    <span className="sort-icon"></span>
                                                </span>
                                            </th>
                                            <th className="w-[80px]" data-datatable-column="value">
                                                <span className="sort">
                                                    <span className="sort-label">Value</span>
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

            {/* <SaleInvoicesModal orderId={1}/> */}

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

export default DiscountFeesTable;