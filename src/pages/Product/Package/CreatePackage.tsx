// src\pages\Product\Package\CreatePackage.tsx

import { useEffect, useState } from 'react';
import { toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import InputFieldGroup from '../../../components/Forms/TextFields/InputFieldGroup';
import IncludeProductModal from '../../../components/Modals/IncludeProductModal';
import { Package, Product } from '../../../types';
import { createPackage } from '../../../services/api';

function CreatePackage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        packageName: '',
        packagePrice: 0,
        description: '',
        products: [],
    });

    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [selectedProducts, setSelectedProducts] = useState([]);

    const handleBackClick = () => {
        localStorage.removeItem('include_prod_selected_products');
        navigate('/packages');
    };

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

        let addProducts: Product[] = [];

        console.log(storedProducts);

        try {
            let newProducts: Product[] = [];
            if (storedProducts) {
                const parsedProducts = JSON.parse(storedProducts);
                newProducts = parsedProducts.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    quantity: item.quantity, // Adjusting the key to match the Product interface
                    price: parseFloat(item.price), // Ensure the price is a number
                    // Add other properties if necessary
                }));
            }


            const packageData: Package = {
                name: formData.packageName,
                total_price: formData.packagePrice,
                description: formData.description,
                products: newProducts,
            };

            console.log(packageData);

            const response = await createPackage(packageData);

            if (response?.success) {
                notify('success', "Package Created Successfully!");
                localStorage.removeItem('include_prod_selected_products');
                navigate('/packages');
            }

        } catch (error) {
            if (error.response?.status === 422) {
                // Extract validation errors from the response
                const errors = error.response.data.data || {};
                // Convert array of errors to a single error message for each field
                const formattedErrors = Object.keys(errors).reduce((acc, key) => {
                    acc[key] = errors[key].join(' '); // Join array of errors into a single string
                    return acc;
                }, {} as Record<string, string>);

                setValidationErrors(formattedErrors);
                notify('error', "Product creation unsuccessful. Check the errors below.");
            } else {
                console.error('Product creation failed:', error);
            }
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
        const storedProducts = localStorage.getItem('include_prod_selected_products');
        if (storedProducts) {
            setSelectedProducts(JSON.parse(storedProducts));
        }
    }, []);

    const updateSelectedProducts = (products) => {
        setSelectedProducts(products);
        localStorage.setItem('include_prod_selected_products', JSON.stringify(products));
    };

    const updateLocalStorage = (products) => {
        localStorage.setItem('include_prod_selected_products', JSON.stringify(products));
    };

    const adjustQuantity = (id: string, action: 'increase' | 'decrease') => {
        setSelectedProducts((prevProducts) => {
            const updatedProducts = prevProducts.map((product) => {
                if (product.id === id) {
                    const newQty = action === 'increase' ? product.quantity + 1 : Math.max(1, product.quantity - 1);
                    return { ...product, quantity: newQty };
                }
                return product;
            });
            updateLocalStorage(updatedProducts); // Update localStorage
            return updatedProducts;
        });
    };

    const handleRemoveProduct = (id: string) => {
        setSelectedProducts((prevProducts) => {
            const updatedProducts = prevProducts.filter(product => product.id !== id);
            updateLocalStorage(updatedProducts); // Update localStorage
            return updatedProducts;
        });
    };

    return (
        <>
            <div className="flex justify-between items-center flex-wrap mb-6">
                <div className="flex gap-4 items-center">
                    <button className='text-gray-800 dark:text-gray-400' onClick={handleBackClick}>
                        <i className="ki-solid ki-arrow-left"></i>
                    </button>
                    <span className="text-2xl font-bold text-gray-900">
                        Create New Package
                    </span>
                </div>
            </div>

            <div className="flex flex-wrap gap-8 mb-8">
                <div className="left-column flex flex-col flex-[3] gap-8">
                    <div className="card">
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
                                error={validationErrors.name}
                            />

                            {/* Price */}
                            <InputFieldGroup
                                fieldTitle="Package Total Price"
                                description="A product name is required and recommended to be unique."
                                placeholder="Total Price"
                                name="packagePrice"
                                value={formData.packagePrice}
                                onChange={handleChange}
                                error={validationErrors.price}
                            />

                            {/* Description */}
                            <InputFieldGroup
                                fieldTitle="Description"
                                description="A product name is required and recommended to be unique."
                                placeholder="Description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                error={validationErrors.description}
                            />
                        </div>
                    </div>
                </div>

                <div className='flex flex-col right-column flex-[6] gap-8'>
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
                                                    <th className='w-[100px]'>Unit Price</th>
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
                                                            RM {parseFloat(product.price).toFixed(2)}
                                                        </td>
                                                        <td>
                                                            RM {(parseFloat(product.price) * product.quantity).toFixed(2)}
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

            <div className="flex justify-end gap-6">
                <button className="btn btn-lg btn-light">
                    Cancel
                </button>
                <button
                    className="btn btn-lg btn-primary"
                    onClick={handleSubmit} // Trigger form submission
                >
                    Create
                </button>
            </div>

            <IncludeProductModal
                selectedProducts={selectedProducts}
                updateSelectedProducts={updateSelectedProducts}
            />
        </>
    );
}

export default CreatePackage;
