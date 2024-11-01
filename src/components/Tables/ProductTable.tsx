// src\components\Tables\ProductTable.tsx

import { useCallback, useEffect, useRef, useState } from 'react';
import { KTDataTable, KTModal } from '../../metronic/core'; // Adjust the import path as needed
import { useNavigate } from 'react-router-dom';
import DeleteModal from '../Modals/DeleteModal';
import { Product } from '../../types';
import Tooltip from '../Tooltip';
import { removeProduct } from '../../services/api';

function ProductTable() {
    const navigate = useNavigate(); // React Router's useNavigate hook
    const tableRef = useRef<HTMLDivElement>(null);
    const [selectedProduct, setSelectedProduct] = useState<{ id: number, name: string } | null>(null);

    let datatable;

    // Function to handle click events
    const handleTableClick = useCallback((event: MouseEvent) => {
        const target = event.target as HTMLElement;
        const editButton = target.closest('[data-action="edit"]');
        const deleteButton = target.closest('[data-action="delete"]');

        if (editButton instanceof HTMLElement) {
            const id = editButton.dataset.id;
            if (id) {
                navigate(`/products/edit/${id}`);
            }
        } else if (deleteButton instanceof HTMLElement) {
            const id = deleteButton.dataset.id;
            const name = deleteButton.dataset.name;
            if (id && name) {
                setSelectedProduct({ id: parseInt(id, 10), name });

                // Close Modal
                const modalEl = document.querySelector('#delete_item_modal') as HTMLElement;
                const modal = KTModal.getInstance(modalEl);
                modal.hide();
            }
        }
    }, [navigate]);

    const handleRefreshTable = async () => {
        datatable.reload();
    };

    useEffect(() => {
        // Initialize KTDataTable after component mounts
        const apiUrl = 'http://' + window.location.hostname + ':8000/api/products';
        const element = document.querySelector('#product_data_table') as HTMLElement;
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
                // status: {
                //     title: 'Status',
                //     render: (item: string, data: Product) => {

                //         let color = 'bg-gray-500';

                //         console.log(data);

                //         if (item === 'available') {
                //             color = 'bg-success';
                //         }

                //         return `
                //             <div class="p-1" data-tooltip="#status_tooltip_${data.id}">
                //                 <span class="badge badge-dot size-2 ${color} ${item}">
                //                 </span>
                //             </div>
                //             <div class="tooltip capitalize shadow-default transition-opacity duration-300" id="status_tooltip_${data.id}">
                //                 ${item}
                //             </div>
                //         `;
                //     },
                //     createdCell(cell: HTMLElement) {
                //         cell.classList.add('text-center');
                //     },
                // },
                name: {
                    title: 'Name',
                    createdCell(cell: HTMLElement) {
                        cell.classList.add('prod-name');
                    },
                    render: (item: string, data: Product) => `
                        <div class="flex flex-col">
                            <span>${item}</span>
                            <span class="text-xs text-slate-400">${data.description != null ? data.description : ''}</span>
                        </div>
                    `,
                },
                SKU: {
                    title: 'SKU',
                },
                selling_price: {
                    title: 'Selling Price',
                    render: (item: string, data: Product) => `
                        <div class="flex flex-col justify-center items-center">
                            <span>RM ${data.provisioning.supply.retail_price + data.provisioning.install.retail_price}</span>
                        </div>
                    `,
                },
                category: {
                    title: 'Category',
                    createdCell(cell: HTMLElement) {
                        cell.classList.add('capitalize');
                    },
                },
                type: {
                    title: 'Type',
                    createdCell(cell: HTMLElement) {
                        cell.classList.add('capitalize');
                    },
                },
                // product_retail_price: {
                //     title: 'Retail Price',
                //     render: (item: number) => `RM ${item.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, // Format as currency
                // },
                // product_cost_of_good_sold: {
                //     title: 'Cost of Good Sold',
                //     render: (item: number) => `RM ${item.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, // Format as currency
                // },
                // product_excluded_price: {
                //     title: 'Excluded Price',
                //     render: (item: number) => `RM ${item.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, // Format as currency
                // },
                id: {
                    title: 'Actions',
                    render: (item: number, data: Product) => `
                        <div class="flex justify-around gap-2">
                            <button
                                class="btn-edit btn btn-sm btn-icon btn-clear btn-light"
                                data-tooltip="#edit_tooltip"
                                data-action="edit"
                                data-id="${item}"
                            >
                                <i class="ki-outline ki-notepad-edit"></i>
                            </button>

                            <button
                                class="btn-delete btn btn-sm btn-icon btn-clear btn-light"
                                data-tooltip="#remove_tooltip"
                                data-action="delete"
                                data-id="${item}"
                                data-name="${data.name}"
                                data-modal-toggle="#delete_item_modal"
                            >
                                <i class="ki-outline ki-trash"></i>
                            </button>

                            <button
                                class="btn-delete btn btn-sm btn-icon btn-clear btn-light"
                                data-tooltip="#other_tooltip"
                                data-action="delete"
                                data-id="${item}"
                                data-name="${data.name}"
                            >
                                <i class="ki-outline ki-mouse-square"></i>
                            </button>
                        </div>
                    `,
                },
            },
        };

        if (element) {
            datatable = new KTDataTable(element, dataTableOptions);
            element.addEventListener('click', handleTableClick);

            return () => {
                element.removeEventListener('click', handleTableClick);
            };
        }

    }, [navigate, handleTableClick]);

    return (
        <>
            <div className="grid">
                <div className="card card-grid min-w-full">
                    <div className="card-header flex-wrap gap-2">
                        <h3 className="card-title font-medium text-lg">
                            Product List
                        </h3>
                        <div className="flex flex-wrap gap-2 lg:gap-5 items-center">
                            <button
                                className="btn-refresh"
                                onClick={handleRefreshTable}
                            >
                                <i className="ki-solid ki-arrows-circle text-lg"></i>
                            </button>
                            <div className="flex">
                                <label className="input input-sm">
                                    <i className="ki-filled ki-magnifier">
                                    </i>
                                    <input placeholder="Search products" type="text" />

                                </label>
                            </div>
                            <div className="flex flex-wrap gap-2.5">
                                <select className="select select-sm w-28">
                                    <option value="1">
                                        Latest
                                    </option>
                                    <option value="2">
                                        Older
                                    </option>
                                    <option value="3">
                                        Oldest
                                    </option>
                                </select>
                                <button className="btn btn-sm btn-outline btn-primary">
                                    <i className="ki-filled ki-setting-4">
                                    </i>
                                    Filters
                                </button>
                                <label className="switch switch-sm">
                                    <input className="order-2" name="check" type="checkbox" value="1" />
                                    <span className="switch-label order-1">Push Alerts</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div className="card-body">
                        <div data-datatable="true" id="product_data_table" ref={tableRef}>
                            <div className="scrollable-x-auto">
                                <table className="table table-auto align-middle text-gray-700 font-medium text-sm" data-datatable-table="true">
                                    <thead>
                                        <tr>
                                            <th className="w-[300px] text-center" data-datatable-column="name">
                                                <span className="sort">
                                                    <span className="sort-label">Name</span>
                                                    <span className="sort-icon"></span>
                                                </span>
                                            </th>
                                            <th className="w-[100px] text-center" data-datatable-column="SKU">
                                                <span className="sort">
                                                    <span className="sort-label">SKU</span>
                                                    <span className="sort-icon"></span>
                                                </span>
                                            </th>
                                            <th className="w-[100px] text-center" data-datatable-column="selling_price">
                                                <span className="sort">
                                                    <span className="sort-label">Selling Price</span>
                                                    <span className="sort-icon"></span>
                                                </span>
                                            </th>
                                            <th className="w-[120px] text-center" data-datatable-column="category">
                                                <span className="sort">
                                                    <span className="sort-label">Category</span>
                                                    <span className="sort-icon"></span>
                                                </span>
                                            </th>
                                            <th className="w-[120px] text-center" data-datatable-column="type">
                                                <span className="sort">
                                                    <span className="sort-label">Type</span>
                                                    <span className="sort-icon"></span>
                                                </span>
                                            </th>
                                            {/* <th className="w-[120px] text-center" data-datatable-column="price">
                                                <span className="sort">
                                                    <span className="sort-label">Retail Price</span>
                                                    <span className="sort-icon"></span>
                                                </span>
                                            </th>
                                            <th className="w-[120px] text-center" data-datatable-column="price">
                                                <span className="sort">
                                                    <span className="sort-label">Cost of Good Sold</span>
                                                    <span className="sort-icon"></span>
                                                </span>
                                            </th>
                                            <th className="w-[120px] text-center" data-datatable-column="price">
                                                <span className="sort">
                                                    <span className="sort-label">Excluded Price</span>
                                                    <span className="sort-icon"></span>
                                                </span>
                                            </th> */}
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

            <div className="tooltips">
                <Tooltip id='edit' content='Edit Product' />
                <Tooltip id='remove' content='Remove Product' />
                <Tooltip id='other' content='Other' />
            </div>

            <DeleteModal
                item={selectedProduct}
                modalTitle='Remove Product'
                modalPrompt='Are you sure to permanently remove this product:'
                notifySuccess='Product Removed Successfully!'
                notifyError='Product remove failed'
                navigateUrl='/products'
                deleteFunction={removeProduct}
            />
        </>
    );
}

export default ProductTable;