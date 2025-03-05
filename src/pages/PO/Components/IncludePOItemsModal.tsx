import { useEffect, useRef, useState } from "react";
import { productIndex } from "../../../services/api";
import Loading from "../../../components/Loading";
import { POItem, POPackage, Product } from "../../../types";
import { KTModal } from "../../../metronic/core";

interface IncludePOItemsModalProps {
    selectedPOPackageId: string;
    setSelectedPOPackageId: React.Dispatch<React.SetStateAction<string>>;
    selectedPOPackages: POPackage[];
    setSelectedPOPackages: React.Dispatch<React.SetStateAction<POPackage[]>>;
    isOpen: boolean;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    recalculateTotalAmount?: () => void
}

type SortOrder = 'asc' | 'desc' | null;

const IncludePOItemsModal: React.FC<IncludePOItemsModalProps> = ({
    selectedPOPackageId,
    setSelectedPOPackageId,
    selectedPOPackages,
    setSelectedPOPackages,
    isOpen,
    setIsOpen,
    recalculateTotalAmount
}) => {
    const [products, setProducts] = useState<Product[]>([]); // Initialize as an empty array
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState<number>(1);
    const [size, setSize] = useState<number>(10);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [sortField, setSortField] = useState<string>('');
    const [sortOrder, setSortOrder] = useState<SortOrder>(null);
    // const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (selectedPOPackageId && isOpen) {
            initProductTable(page, size, searchTerm, sortOrder, sortField);
        }

        const modalEl = document.querySelector('#add_item_modal') as HTMLElement;
        const modal = KTModal.getInstance(modalEl);

        const eventId = modal.on('hide', () => {
            setIsOpen(false);
            setProducts([]);
            setSelectedPOPackageId('');
        })

        // Cleanup function
        return () => {
            modal.off('hide', eventId);
        };

    }, [selectedPOPackageId, setSelectedPOPackageId, isOpen, setIsOpen, page, size, searchTerm, sortOrder, sortField]);

    const initProductTable = async (
        page: number,
        size: number,
        searchTerm?: string,
        order?: string,
        field?: string
    ) => {
        try {
            setIsLoading(true);
            const response = await productIndex(size, page, searchTerm, order, field);
            const data: Product[] = response?.data || [];

            // Exclude products where pm_category_id is 1
            const filteredData = data.filter(product => product.pm_category_id !== 1);

            setProducts(filteredData);
            setTotalItems(response?.totalCount || 0);
        } catch (error) {
            console.error('Error fetching products:', error);
            setError('Failed to load products');
        } finally {
            setIsLoading(false);
        }
    };


    const handleSearch = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSearchTerm(value);

        try {
            setIsLoading(true);
            const response = await productIndex(size, page, value);

            const data = response?.data || [];

            // Exclude products where pm_category_id is 1
            const filteredData = data.filter(product => product.pm_category_id !== 1);

            setProducts(filteredData);
            setTotalItems(response?.totalCount || 0);
        } catch (error) {
            console.error('Error searching products:', error);
            setError('Failed to search products');
        } finally {
            setIsLoading(false);
        }
    };


    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > Math.ceil(totalItems / size)) return;
        setPage(newPage);
    };

    const handleSizeChange = (newSize: number) => {
        setSize(newSize);
        setPage(1); // Reset to the first page when changing the page size
    };

    const totalPages = Math.ceil(totalItems / size);


    const handleSelectProduct = (selectedProd: Product, event: React.MouseEvent<HTMLButtonElement>) => {
        const selectBtn = event.currentTarget;

        if (selectBtn) {
            // Check if the product ID is already selected
            const selectedPackage = selectedPOPackages.find((poPackage) => poPackage.package_id === selectedPOPackageId);
            const productIndex = selectedPackage.po_items.findIndex(product => Number(product.product_id) === Number(selectedProd.id));

            if (productIndex > -1) {
                // If it is selected, remove it
                const updatedProducts = selectedPackage.po_items.filter(product => Number(product.product_id) !== Number(selectedProd.id));

                // update selectedPOPackages with updatedProducts
                setSelectedPOPackages(prevSelectedPOPackages => {
                    const updatedPackages = prevSelectedPOPackages.map((packageItem) => {
                        if (packageItem.package_id === selectedPOPackageId) {
                            return { ...packageItem, po_items: updatedProducts };
                        }
                        return packageItem;
                    });

                    return updatedPackages;
                });

                selectBtn.className = 'btn btn-primary btn-sm';
                selectBtn.innerText = 'Select';
                recalculateTotalAmount();

            } else {
                // If it is not selected, add it
                setSelectedPOPackages(prevSelectedPOPackages => {
                    const updatedPackages = prevSelectedPOPackages.map((packageItem) => {
                        if (packageItem.package_id === selectedPOPackageId) {
                            const updatedProducts = [
                                ...packageItem.po_items,
                                {
                                    product_id: String(selectedProd.id),
                                    product_name: selectedProd.name,
                                    product_desc: selectedProd.description,
                                    qty: 1,
                                    uom: selectedProd.uom,
                                    supply: true,
                                    install: true,
                                    unit_price: selectedProd.provisioning.supply.cogs + selectedProd.provisioning.install.cogs,
                                    supply_price: selectedProd.provisioning.supply.cogs,
                                    install_price: selectedProd.provisioning.install.cogs,
                                    total_price: selectedProd.provisioning.supply.cogs + selectedProd.provisioning.install.cogs,
                                }
                            ];

                            return { ...packageItem, po_items: updatedProducts };
                        }
                        return packageItem;
                    });

                    console.log(updatedPackages);
                    

                    return updatedPackages;
                });

                // setTotalAmount(totalAmount + selectedProd.provisioning.supply.cogs + selectedProd.provisioning.install.cogs);
                selectBtn.className = 'btn btn-danger btn-sm';
                selectBtn.innerText = 'Remove';
                recalculateTotalAmount();
            }
        }
    }


    return (
        <>
            {/* Loading Overlay */}
            {(isOpen === true && isLoading) && <Loading />}

            <div className="modal p-14" data-modal="true" data-modal-backdrop-static="true" id="add_item_modal">
                <div className="modal-content modal-center-y max-w-[900px]">
                    <div className="modal-header py-4 px-5">
                        <span className="text-lg text-gray-900 font-bold">Add Product into Package</span>
                        <button
                            className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
                            data-modal-dismiss="true"
                        >
                            <i className="ki-filled ki-cross"></i>
                        </button>
                    </div>
                    <div className="modal-body p-0 pb-5 ">
                        <div className="flex mb-2">
                            <label className="input input-lg">
                                <i className="ki-filled ki-magnifier"></i>
                                <input
                                    placeholder="Search products"
                                    type="text"
                                    value={searchTerm}
                                    onChange={handleSearch}
                                />
                            </label>
                        </div>
                    </div>
                    {products.length > 0 &&
                        <div className="modal-table overflow-y-auto scrollable-y max-h-[400px]">
                            <table className="table align-middle text-gray-700 font-medium text-sm">
                                <thead className="sticky top-0 ">
                                    <tr>
                                        <th className='text-center'>Item</th>
                                        <th className='min-w-[120px] text-center'>Price per Qty</th>
                                        <th className='min-w-[120px] text-center'>Supply Price</th>
                                        <th className='min-w-[120px] text-center'>Install Price</th>
                                        <th className='min-w-[120px] text-center'>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.length > 0 ? (
                                        products.map((product, prodIndex) => {
                                            const selectedPackage = selectedPOPackages.find((poPackage) => poPackage.package_id === selectedPOPackageId);
                                            const isSelected = selectedPackage.po_items.some(poProd => Number(poProd.product_id) === Number(product.id));

                                            const buttonClass = isSelected ? 'btn-danger' : 'btn-primary';
                                            const buttonText = isSelected ? 'Remove' : 'Select';

                                            return (
                                                <tr
                                                    key={prodIndex}
                                                    className={`${prodIndex % 2 === 0 ? '' : 'bg-gray-100'}`}
                                                >
                                                    <td>
                                                        <div className="flex flex-col">
                                                            <span>{product.name}</span>
                                                            <span className="text-xs text-slate-400">{product.description || ''}</span>
                                                        </div>
                                                    </td>
                                                    <td className='text-center'>
                                                        RM {(product.provisioning.supply.cogs + product.provisioning.install.cogs).toFixed(2)}
                                                    </td>
                                                    <td className='text-center'>
                                                        RM {product.provisioning.supply.cogs.toFixed(2)}
                                                    </td>
                                                    <td className='text-center'>
                                                        RM {product.provisioning.install.cogs.toFixed(2)}
                                                    </td>
                                                    <td className='text-center'>
                                                        <div className="flex justify-around gap-2">
                                                            <button
                                                                className={`btn ${buttonClass} btn-sm`}
                                                                // Pass current button into handleSelectProduct
                                                                onClick={(e) => handleSelectProduct(product, e)}
                                                            >
                                                                {buttonText}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="text-center text-gray-500">
                                                No products available
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    }
                    <div className="modal-footer justify-center md:justify-between flex-col md:flex-row gap-3 text-gray-600 text-2sm font-medium">
                        <div className="flex items-center gap-2">
                            Show
                            <select
                                className="select select-sm w-16"
                                name="perpage"
                                value={size}
                                onChange={(e) => handleSizeChange(parseInt(e.target.value))}
                            >
                                <option value="5">5</option>
                                <option value="10">10</option>
                                <option value="20">20</option>
                                <option value="30">30</option>
                                <option value="50">50</option>
                            </select>
                            per page
                        </div>
                        <div className="flex items-center gap-4">
                            <span>{(page - 1) * size + 1}-{Math.min(page * size, totalItems)} of {totalItems}</span>
                            <div className="pagination">
                                {/* Previous Page Button */}
                                <button
                                    className={`btn ${page === 1 ? 'disabled' : ''}`}
                                    onClick={() => handlePageChange(page - 1)}
                                >
                                    <i className="ki-outline ki-black-left"></i>
                                </button>

                                {/* Page Number Buttons with Ellipses */}
                                {totalPages > 0 && (
                                    <>
                                        {page > 3 && (
                                            <>
                                                <button
                                                    className="btn"
                                                    onClick={() => handlePageChange(1)}
                                                >
                                                    1
                                                </button>
                                                <span className="btn btn-disabled">...</span>
                                            </>
                                        )}

                                        {Array.from({
                                            length: Math.min(3, totalPages)
                                        }, (_, index) => {
                                            // Determine the start of the 3-page window
                                            const startPage = Math.max(1,
                                                Math.min(
                                                    page - 1,
                                                    totalPages - 2
                                                )
                                            );

                                            const currentPage = startPage + index;
                                            return (
                                                <button
                                                    key={currentPage}
                                                    className={`btn ${page === currentPage ? 'active' : ''}`}
                                                    onClick={() => handlePageChange(currentPage)}
                                                >
                                                    {currentPage}
                                                </button>
                                            );
                                        })}

                                        {page < totalPages - 2 && (
                                            <>
                                                <span className="btn btn-disabled">...</span>
                                                <button
                                                    className="btn"
                                                    onClick={() => handlePageChange(totalPages)}
                                                >
                                                    {totalPages}
                                                </button>
                                            </>
                                        )}
                                    </>
                                )}

                                {/* Next Page Button */}
                                <button
                                    className={`btn ${page === totalPages ? 'disabled' : ''}`}
                                    onClick={() => handlePageChange(page + 1)}
                                >
                                    <i className="ki-outline ki-black-right"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default IncludePOItemsModal;