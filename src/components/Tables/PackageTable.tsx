import { useCallback, useEffect, useState } from 'react';
import { KTDataTable, KTModal } from '../../metronic/core';
import { Package } from '../../types';
import PackageDetailModal from '../Modals/PackageDetailModal';
import DeleteModal from '../Modals/DeleteModal';
import { removePackage } from '../../services/api';

function PackageTable() {
    const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
    const [selectedPackage, setSelectedPackage] = useState<{ id: number, name: string } | null>(null);
    let datatable;

    const handleTableClick = useCallback((event: MouseEvent) => {
        const target = event.target as HTMLElement;
        const viewButton = target.closest('[data-action="view"]') as HTMLElement;
        const deleteButton = target.closest('[data-action="delete"]') as HTMLElement;

        if (viewButton) {
            const id = viewButton.dataset.id;
            if (id) {
                setSelectedPackageId(parseInt(id, 10));
            }
        } else if (deleteButton) {
            const id = deleteButton.dataset.id;
            const name = deleteButton.dataset.name;

            if (id && name) {
                setSelectedPackage({ id: parseInt(id, 10), name });

                // Close Modal
                const modalEl = document.querySelector('#delete_item_modal') as HTMLElement | null;

                if (modalEl) {
                    const modal = KTModal.getInstance(modalEl);
                    if (modal) {
                        modal.hide();
                    }
                }
            }
        }
    }, [setSelectedPackage]);

    const handleCloseModal = async () => {
        const detailModalEl = document.querySelector('#package_detail_modal') as HTMLElement;
        const detailModal = KTModal.getInstance(detailModalEl);


        detailModal.on('hidden', () => {
            const modalEl = document.querySelector('#edit_package_modal') as HTMLElement;
            const modal = KTModal.getInstance(modalEl);

            // Buffer for getting modal-open status
            setTimeout(() => {
                if (modal.isOpen() == false && detailModal.isOpen() == false) {
                    setSelectedPackageId(null);
                    localStorage.removeItem('include_prod_selected_products');
                }
            }, 200);

        });
    };

    const initPackageTable = useCallback(() => {
        const apiUrl = `http://${window.location.hostname}:8000/api/packages`;
        const element = document.querySelector('#package_table') as HTMLElement;
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
                total_price: {
                    title: 'Price',
                    render: (item: number) => `RM ${item.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                },
                action: {
                    title: 'Action',
                    render: (item: string, data: Package) => `
                        <div class="flex justify-around gap-2">
                            <button 
                                class="btn btn-sm btn-secondary"
                                data-modal-toggle="#package_detail_modal"
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
        document.querySelector('#package_table')?.addEventListener('click', handleTableClick);

        return () => {
            document.querySelector('#package_table')?.removeEventListener('click', handleTableClick);
        };
    }, [initPackageTable, handleTableClick]);

    return (
        <>
            <div className="grid">
                <div className="card card-grid min-w-full">
                    <div className="card-header flex-wrap gap-2">
                        <h3 className="card-title font-medium text-lg">
                            Product Category List
                        </h3>
                    </div>
                    <div className="card-body">
                        <div data-datatable="true" id="package_table">
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
                                            <th className="w-[110px]" data-datatable-column="total_price">
                                                <span className="sort">
                                                    <span className="sort-label">Total Price</span>
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

            <PackageDetailModal packageId={selectedPackageId} onClose={handleCloseModal} />

            <DeleteModal
                item={selectedPackage}
                modalTitle='Remove Package'
                modalPrompt='Are you sure to permanently remove this package:'
                notifySuccess='Package Removed Successfully!'
                notifyError='Package remove failed'
                navigateUrl='/packages'
                deleteFunction={removePackage}
            />
        </>
    );
}

export default PackageTable;
