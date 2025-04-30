// src\components\Modals\EditPackageModal.tsx

import { useEffect, useState } from "react";
import InputFieldGroup from "../Forms/TextFields/InputFieldGroup";
import { Package, Product } from '../../types/index';
import IncludeProductModal from "./IncludeProductModal";
import { Slide, toast } from "react-toastify";
import { updatePackage } from "../../services/api";
import { KTModal } from "../../metronic/core";

type EditPackageModalProps = {
    packageDetail: Package;
};

const EditPackageModal: React.FC<EditPackageModalProps> = ({ packageDetail }) => {
    const [formData, setFormData] = useState({
        packageId: 0,
        packageName: '',
        packagePrice: 0,
        description: '',
        products: [],
    });

    const [selectedProducts, setSelectedProducts] = useState([]);
    const [totalPrice, setTotalPrice] = useState<number>(0);

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = async () => {
        const storedProducts = localStorage.getItem('include_prod_selected_products');

        try {
            let newProducts: Product[] = [];
            if (storedProducts) {
                const parsedProducts = JSON.parse(storedProducts);
                newProducts = parsedProducts.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    quantity: item.quantity,
                    price: parseFloat(item.price),
                }));
            }


            const packageData: Package = {
                id: formData.packageId,
                name: formData.packageName,
                total_price: formData.packagePrice,
                description: formData.description,
                products: newProducts,
            };

            console.log(packageData);

            const response = await updatePackage(packageData);

            if (response?.success) {
                notify('success', "Package Updated Successfully!");
                localStorage.removeItem('include_prod_selected_products');

                const modalEl = document.querySelector('#package_detail_modal') as HTMLElement;
                const modal = KTModal.getInstance(modalEl);

                modal.toggle();
            }

        } catch (error) {
            console.error('Error:', error);

            // if (error.response?.status === 422) {
            //     // Extract validation errors from the response
            //     const errors = error.response.data.data || {};
            //     // Convert array of errors to a single error message for each field
            //     const formattedErrors = Object.keys(errors).reduce((acc, key) => {
            //         acc[key] = errors[key].join(' '); // Join array of errors into a single string
            //         return acc;
            //     }, {} as Record<string, string>);

            //     setValidationErrors(formattedErrors);
            //     notify('error', "Product creation unsuccessful. Check the errors below.");
            // } else {
            //     console.error('Product creation failed:', error);
            // }
        }
    };

    const openAddProductModal = () => {
        const datatableEl = document.querySelector('#products_table') as HTMLElement;
        if (datatableEl) {
            const datatable = (datatableEl as any).instance;

            if (datatable) {
                datatable.reload();
            }
        }
    };

    useEffect(() => {
        if (packageDetail) {
            setFormData({
                packageId: packageDetail.id,
                packageName: packageDetail.name,
                packagePrice: packageDetail.total_price || 0,
                description: packageDetail.description || '',
                products: packageDetail.products || [],
            });

            restorePackageLocalStorage();

            const storedProducts = localStorage.getItem('include_prod_selected_products');

            if (storedProducts) {
                setSelectedProducts(JSON.parse(storedProducts));
            }

            setTotalPrice(packageDetail.total_price);
        }
    }, [packageDetail, setTotalPrice]);

    const updateSelectedProducts = (products: Product[]) => {
        setSelectedProducts(products);
    };


    const updateTotalPrice = (price: number, operator: string) => {

        setTotalPrice(prevTotal => {
            switch (operator) {
                case '+':
                    return prevTotal + price;
                case '-':
                    return prevTotal - price;
                default:
                    throw new Error('Invalid operator');
            }
        });
    };

    const adjustQuantity = (id: number, action: 'increase' | 'decrease') => {
        setSelectedProducts((prevProducts) => {
            const updatedProducts = prevProducts.map((product) => {
                if (product.id === id) {
                    const newQty = action === 'increase' ? product.quantity + 1 : Math.max(1, product.quantity - 1);
                    console.log(newQty);
                    const operator = action === 'increase' ? '+' : '-';

                    if (product.quantity > 1 || action === 'increase') {
                        updateTotalPrice(product.price, operator);
                    }

                    return { ...product, quantity: newQty };
                }
                return product;
            });
            return updatedProducts;
        });
    };

    const handleRemoveProduct = (id: string) => {
        setSelectedProducts((prevProducts) => {
            const updatedProducts = prevProducts.filter(product => product.id !== id);
            const removedProduct = prevProducts.find(product => product.id === id);
            if (removedProduct) {
                // Update total price based on the removed product
                updateTotalPrice(removedProduct.price * removedProduct.quantity, '-');
            }
            return updatedProducts;
        });
    };

    const restorePackageLocalStorage = () => {
        // Retrieve the current selected products from localStorage
        const selectedProducts = [];

        // Set the localStorage for exists package
        packageDetail.products.map((product) => {
            selectedProducts.push(product);
        });

    }


    if (!packageDetail) return null; // Early return for null packageId

    console.log(selectedProducts);

    return (
        <>
            <div className="modal" data-modal="true" data-modal-backdrop-static="true" id="edit_package_modal">
                <div className="modal-content modal-center-y max-w-[1180px] max-h-[620px]">
                    <div className="modal-header py-4 px-5">
                        <span className="text-lg text-gray-900 font-bold">Edit Package</span>
                        <button
                            className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
                            data-modal-toggle="#package_detail_modal"
                        >
                            <i className="ki-filled ki-cross"></i>
                        </button>
                    </div>
                    <div className="modal-body p-5 pb-5 scrollable">
                        <div className="flex flex-wrap gap-8 mb-8">

                            <div className="left-column flex flex-col flex-[3]">
                                <div className="card mb-4">
                                    <div className="card-body">
                                        <h2 className='text-xl mb-4 font-semibold text-gray-900'>Package Detail</h2>

                                        {/* Package Name */}
                                        <InputFieldGroup
                                            fieldTitle="Package Name"
                                            description="A product name is required and recommended to be unique."
                                            placeholder="Package name"
                                            name="packageName"
                                            value={formData.packageName}
                                            onChange={handleChange}
                                        // error={validationErrors.name}
                                        />

                                        {/* Description */}
                                        <InputFieldGroup
                                            fieldTitle="Description"
                                            description="A product name is required and recommended to be unique."
                                            placeholder="Description"
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                        // error={validationErrors.description}
                                        />
                                    </div>
                                </div>

                                <div className="card">
                                    <div className="card-body">
                                        <div className="flex flex-col">
                                            <label className='mb-2 text-sm font-medium text-gray-900'>
                                                Package Total Price
                                            </label>

                                            <span className="text-xs text-gray-600 tracking-wide mb-2">
                                                The total price will be reflected based on selected products and quantity.
                                            </span>

                                            <span className="text-lg font-medium text-gray-900">
                                                RM {totalPrice}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className='flex flex-col right-column flex-[6] gap-8 '>
                                <div className="card">
                                    <div className="card-body">
                                        <h2 className='text-xl mb-4 font-semibold text-gray-900'>Products</h2>

                                        <button
                                            className='btn btn-outline btn-primary w-full flex justify-center items-center mb-4'
                                            data-modal-toggle="#include_product_modal"
                                            onClick={openAddProductModal}
                                        >
                                            <i className="ki-outline ki-plus-squared"></i>
                                            Add Products
                                        </button>

                                        <div className="product-list flex flex-col">
                                            <div className="card min-w-full">
                                                <div className="card-table">
                                                    <table className="table align-middle text-gray-700 font-medium text-sm">
                                                        <thead>
                                                            <tr>
                                                                <th className='w-[150px]'>Product</th>
                                                                <th className='w-[100px] text-center'>Quantity</th>
                                                                <th className='w-[100px]'>Retail Price</th>
                                                                <th className='w-[100px]'>Total Price</th>
                                                                <th className='w-[80px] text-center'>Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {selectedProducts.map((product) => (
                                                                <tr key={product.id}>
                                                                    <td>
                                                                        <div className="flex flex-col">
                                                                            <span>{product.name}</span>
                                                                            <span className="text-xs text-slate-400">{product.description}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className='text-center text-lg'>
                                                                        <button
                                                                            data-action='decrease'
                                                                            onClick={() => adjustQuantity(product.id, 'decrease')}
                                                                        >
                                                                            <i className="ki-solid ki-minus-squared"></i>
                                                                        </button>
                                                                        <span className="mx-2 text-base">
                                                                            {product.quantity}
                                                                        </span>
                                                                        <button
                                                                            data-action='increase'
                                                                            onClick={() => adjustQuantity(product.id, 'increase')}
                                                                        >
                                                                            <i className="ki-solid ki-plus-squared"></i>
                                                                        </button>
                                                                    </td>
                                                                    <td>
                                                                        RM {product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                    </td>
                                                                    <td>
                                                                        RM {(product.price * product.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                    </td>
                                                                    <td className='text-center'>
                                                                        <button
                                                                            className="btn btn-sm btn-danger"
                                                                            onClick={() => handleRemoveProduct(product.id)}
                                                                        >
                                                                            Remove
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                        <hr />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer flex justify-end gap-6">
                        <button className="btn btn-lg btn-light">
                            Cancel
                        </button>
                        <button
                            className="btn btn-lg btn-primary"
                            onClick={handleSubmit} // Trigger form submission
                        >
                            Update
                        </button>
                    </div>
                </div>
            </div>

            <IncludeProductModal
                selectedProducts={selectedProducts}
                updateSelectedProducts={updateSelectedProducts}
                updateTotalPrice={updateTotalPrice}
                previousModalId="edit_package_modal"
            />
        </>

    );
}

export default EditPackageModal;