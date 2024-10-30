// src\pages\Product\Package\CreatePackage.tsx

import React, { useEffect, useState } from 'react';
import { toast, Slide } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import InputFieldGroup from '../../../components/Forms/TextFields/InputFieldGroup';
import IncludeProductModal from '../../../components/Modals/IncludeProductModal';
import { Package, Product } from '../../../types';
import { createPackage } from '../../../services/api';

function CreatePackage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        packageName: '',
        // packagePrice: 0,
        description: '',
        description_internal: '',
        products: [],
    });

    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [selectedProducts, setSelectedProducts] = useState([]);
    // const [totalPrice, setTotalPrice] = useState<number>(0);

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleVisibilityToggle = (id: number) => {
        setSelectedProducts((prevProducts) => {
            const updatedProducts = prevProducts.map((product) => {
                if (product.id === id) {
                    // Toggle the visibility of the product
                    return { ...product, visibility: !product.visibility };
                }
                return product;
            });

            // Update localStorage with the new state
            updateLocalStorage(updatedProducts);

            return updatedProducts;
        });
    };

    const handleNoteChange = (id: string | number, value: string) => {

        setSelectedProducts((prevProducts) => {
            const updatedProducts = prevProducts.map((product) => {
                if (product.id === id) {
                    return { ...product, note: value }; // Update note
                }
                return product; // Return unchanged product
            });
            updateLocalStorage(updatedProducts); // Persist updated products
            return updatedProducts; // Update state
        });
    }

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
                    visibility: item.visibility,
                    // product_retail_price: parseFloat(item.product_retail_price),
                    internal_note: item.note,
                    supply: item.supply,
                    install: item.install,
                }));
            }

            const packageData: Package = {
                name: formData.packageName,
                // total_price: formData.packagePrice,
                description: formData.description,
                products: newProducts,
                description_internal: formData.description_internal
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
            const parsedProducts = JSON.parse(storedProducts);
            console.log(parsedProducts);
            
            setSelectedProducts(parsedProducts);
            // const initialTotalPrice = parsedProducts.reduce((acc, product) => acc + (product.price * product.quantity), 0);
            // setTotalPrice(initialTotalPrice);
        }
    }, []);

    const updateSelectedProducts = (products: Product[]) => {
        setSelectedProducts(products);
        localStorage.setItem('include_prod_selected_products', JSON.stringify(products));
    };

    const updateLocalStorage = (products: Product[]) => {
        localStorage.setItem('include_prod_selected_products', JSON.stringify(products));
    };

    // const updateTotalPrice = (price: number, operator: string) => {

    //     setTotalPrice(prevTotal => {
    //         switch (operator) {
    //             case '+':
    //                 return prevTotal + price;
    //             case '-':
    //                 return prevTotal - price;
    //             default:
    //                 throw new Error('Invalid operator');
    //         }
    //     });
    // };

    const adjustQuantity = (id: number, action: 'increase' | 'decrease') => {
        setSelectedProducts((prevProducts) => {
            const updatedProducts = prevProducts.map((product) => {
                if (product.id == id) {
                    const newQty = action === 'increase' ? product.quantity + 1 : Math.max(1, product.quantity - 1);
                    const operator = action === 'increase' ? '+' : '-';

                    if (product.quantity > 1 || action === 'increase') {
                        // updateTotalPrice(product.price, operator);
                    }

                    return { ...product, quantity: newQty };
                }
                return product;
            });
            updateLocalStorage(updatedProducts); // Update localStorage
            return updatedProducts;
        });
    };


    const handleRemoveProduct = (id: number) => {
        setSelectedProducts((prevProducts) => {
            console.log('Previous: ', prevProducts);

            const updatedProducts = prevProducts.filter(product => product.id !== id);
            const removedProduct = prevProducts.find(product => product.id === id);
            if (removedProduct) {
                // // Update total price based on the removed product
                // updateTotalPrice(removedProduct.price * removedProduct.quantity, '-');
            }
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
                <div className="left-column flex flex-col flex-[3] gap-4">

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
                                    {/* RM {totalPrice} */}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-body">
                            <h2 className='text-xl mb-4 font-semibold text-gray-900'>Package Detail</h2>

                            {/* Package Name */}
                            <InputFieldGroup
                                fieldTitle="Package Name"
                                description="A package name is required and recommended to be unique."
                                placeholder="Package name"
                                name="packageName"
                                value={formData.packageName}
                                onChange={handleChange}
                                error={validationErrors.name}
                            />

                            {/* Description */}
                            <InputFieldGroup
                                fieldTitle="Description"
                                description="The information of the package related to the package"
                                placeholder="Description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                error={validationErrors.description}
                            />

                        </div>
                    </div>

                    <div className="card bg-slate-50">
                        <div className="card-body">
                            <div className="flex flex-col mb-8">
                                <label className='mb-2 text-sm font-medium text-gray-900'>
                                    Description <span className='text-slate-500'>(Internal)</span>
                                </label>
                                <span className="text-xs text-gray-600 tracking-wide mb-2">
                                    Note down the remark for internal reference. (Not public in owner view quotation)
                                </span>

                                <textarea
                                    className="textarea"
                                    placeholder="This description will not visible on owner view"
                                    name='description_internal'
                                    rows={6}
                                    value={formData.description_internal}
                                    onChange={handleChange}
                                >
                                </textarea>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='flex flex-col right-column flex-[7] gap-8'>
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

                            <div className="badge badge-lg badge-dark text-yellow-300 mb-4">
                                The Internal Reference Note is not visible in Owner View
                            </div>

                            <div className="product-list flex flex-col">
                                <div className="card min-w-full">
                                    <div className="card-table">
                                        <table className="table align-middle text-gray-700 font-medium text-sm">
                                            <thead>
                                                <tr>
                                                    <th className='w-[250px]'>Product</th>
                                                    <th className='w-[100px] text-center'>Quantity</th>
                                                    {/* <th className='w-[120px] text-center'>Retail Price</th> */}
                                                    {/* <th className='w-[120px] text-center'>Total Price</th> */}
                                                    <th className='w-[60px] text-center'>Visibility</th>
                                                    <th className='w-[60px] text-center'>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedProducts.map((product) => (
                                                    <React.Fragment key={product.id}>
                                                        <tr>
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
                                                            {/* <td>
                                                                RM {product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </td> */}
                                                            {/* <td>
                                                                RM {(product.price * product.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </td> */}
                                                            <td className='text-center'>
                                                                <label className="switch flex justify-center">
                                                                    <input
                                                                        name="visibility"
                                                                        type="checkbox"
                                                                        checked={product.visibility}
                                                                        value={product.visibility}
                                                                        onChange={() => handleVisibilityToggle(product.id)}
                                                                    />
                                                                </label>
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
                                                        <tr>
                                                            <td colSpan={8}>
                                                                <input
                                                                    type="text"
                                                                    placeholder="Add a internal reference note"
                                                                    className="input w-full border p-2"
                                                                    onChange={(e) => handleNoteChange(product.id, e.target.value)}
                                                                />
                                                            </td>
                                                        </tr>
                                                    </React.Fragment>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
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

            <button className="btn btn-outline btn-info rounded-e-none px-3 fixed top-20 right-0 z-20" data-drawer-toggle="#drawer_6">
                <i className="ki-filled ki-message-notify"></i>
            </button>

            <div className="drawer drawer-end border-r drawer-open:shadow-2xl rounded-s-xl flex flex-col max-w-[90%] w-[500px]" data-drawer="true" data-drawer-backdrop="false" data-drawer-disable-scroll="false" id="drawer_6">
                <div className="flex items-center justify-between px-5 py-4 border-b">
                    <h3 className="text-base font-semibold text-gray-900">
                        Activity Center
                    </h3>
                    <button className="btn btn-xs btn-icon btn-light" data-drawer-dismiss="true">
                        <i className="ki-outline ki-cross">
                        </i>
                    </button>
                </div>
                <div className="px-5">
                    <div className="tabs mb-5" data-tabs="true">
                        <button className="tab active" data-tab-toggle="#tab_1_1">
                            Activities
                        </button>
                        <button className="tab" data-tab-toggle="#tab_1_2">
                            Comments
                        </button>
                    </div>
                    <div className="overflow-y-auto scrollable h-screen" id="tab_1_1">
                        <div className="flex flex-col gap-4">

                        </div>
                    </div>
                    <div className="overflow-y-auto scrollable h-screen" id="tab_1_2">
                        <div className="flex flex-col gap-4">
                            <div className="card w-[85%]">
                                <div className="card-body flex flex-col px-4">
                                    <div className="flex mb-2 items-center gap-2">
                                        <div className="rounded-full">
                                            <img alt="" className="size-9 rounded-full border-2 border-success shrink-0" src="/media/avatars/300-2.png" />
                                        </div>
                                        <span className='text-slate-900 text-sm font-semibold'>Jane Doe</span>
                                    </div>
                                    <span className='text-slate-900 text-sm mb-4'>
                                        Please take note that the owner have some requested to have partition room.
                                    </span>
                                    <div className="flex justify-end">
                                        <span className='text-slate-400 text-xs'>12:07 pm </span>
                                    </div>
                                </div>
                            </div>
                            <div className="card w-[85%] ml-auto bg-violet-100">
                                <div className="card-body flex flex-col px-4 justify-end">
                                    <div className="flex mb-2 items-center gap-2">
                                        <div className="rounded-full">
                                            <img alt="" className="size-9 rounded-full border-2 border-success shrink-0" src="/media/avatars/300-2.png" />
                                        </div>
                                        <span className='text-slate-900 text-sm font-semibold'>Jane Doe</span>
                                    </div>
                                    <span className='text-slate-900 text-sm mb-4'>
                                        Please take note that the owner have some requested to have partition room.
                                    </span>
                                    <div className="flex justify-end">
                                        <span className='text-slate-400 text-xs'>12:07 pm </span>
                                    </div>
                                </div>
                            </div>
                            <div className="card w-[85%]">
                                <div className="card-body flex flex-col px-4">
                                    <div className="flex mb-2 items-center gap-2">
                                        <div className="rounded-full">
                                            <img alt="" className="size-9 rounded-full border-2 border-success shrink-0" src="/media/avatars/300-2.png" />
                                        </div>
                                        <span className='text-slate-900 text-sm font-semibold'>Jane Doe</span>
                                    </div>
                                    <span className='text-slate-900 text-sm mb-4'>
                                        Please take note that the owner have some requested to have partition room.
                                    </span>
                                    <div className="flex justify-end">
                                        <span className='text-slate-400 text-xs'>12:07 pm </span>
                                    </div>
                                </div>
                            </div>
                            <div className="card w-[85%] ml-auto bg-violet-100">
                                <div className="card-body flex flex-col px-4 justify-end">
                                    <div className="flex mb-2 items-center gap-2">
                                        <div className="rounded-full">
                                            <img alt="" className="size-9 rounded-full border-2 border-success shrink-0" src="/media/avatars/300-2.png" />
                                        </div>
                                        <span className='text-slate-900 text-sm font-semibold'>Jane Doe</span>
                                    </div>
                                    <span className='text-slate-900 text-sm mb-4'>
                                        Please take note that the owner have some requested to have partition room.
                                    </span>
                                    <div className="flex justify-end">
                                        <span className='text-slate-400 text-xs'>12:07 pm </span>
                                    </div>
                                </div>
                            </div>
                            <div className="card w-[85%]">
                                <div className="card-body flex flex-col px-4">
                                    <div className="flex mb-2 items-center gap-2">
                                        <div className="rounded-full">
                                            <img alt="" className="size-9 rounded-full border-2 border-success shrink-0" src="/media/avatars/300-2.png" />
                                        </div>
                                        <span className='text-slate-900 text-sm font-semibold'>Jane Doe</span>
                                    </div>
                                    <span className='text-slate-900 text-sm mb-4'>
                                        Please take note that the owner have some requested to have partition room.
                                    </span>
                                    <div className="flex justify-end">
                                        <span className='text-slate-400 text-xs'>12:07 pm </span>
                                    </div>
                                </div>
                            </div>
                            <div className="card w-[85%] ml-auto bg-violet-100">
                                <div className="card-body flex flex-col px-4 justify-end">
                                    <div className="flex mb-2 items-center gap-2">
                                        <div className="rounded-full">
                                            <img alt="" className="size-9 rounded-full border-2 border-success shrink-0" src="/media/avatars/300-2.png" />
                                        </div>
                                        <span className='text-slate-900 text-sm font-semibold'>Jane Doe</span>
                                    </div>
                                    <span className='text-slate-900 text-sm mb-4'>
                                        Please take note that the owner have some requested to have partition room.
                                    </span>
                                    <div className="flex justify-end">
                                        <span className='text-slate-400 text-xs'>12:07 pm </span>
                                    </div>
                                </div>
                            </div>
                            <div className="card w-[85%]">
                                <div className="card-body flex flex-col px-4">
                                    <div className="flex mb-2 items-center gap-2">
                                        <div className="rounded-full">
                                            <img alt="" className="size-9 rounded-full border-2 border-success shrink-0" src="/media/avatars/300-2.png" />
                                        </div>
                                        <span className='text-slate-900 text-sm font-semibold'>Jane Doe</span>
                                    </div>
                                    <span className='text-slate-900 text-sm mb-4'>
                                        Please take note that the owner have some requested to have partition room.
                                    </span>
                                    <div className="flex justify-end">
                                        <span className='text-slate-400 text-xs'>12:07 pm </span>
                                    </div>
                                </div>
                            </div>
                            <div className="card w-[85%] ml-auto bg-violet-100">
                                <div className="card-body flex flex-col px-4 justify-end">
                                    <div className="flex mb-2 items-center gap-2">
                                        <div className="rounded-full">
                                            <img alt="" className="size-9 rounded-full border-2 border-success shrink-0" src="/media/avatars/300-2.png" />
                                        </div>
                                        <span className='text-slate-900 text-sm font-semibold'>Jane Doe</span>
                                    </div>
                                    <span className='text-slate-900 text-sm mb-4'>
                                        Please take note that the owner have some requested to have partition room.
                                    </span>
                                    <div className="flex justify-end">
                                        <span className='text-slate-400 text-xs'>12:07 pm </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <IncludeProductModal
                selectedProducts={selectedProducts}
                updateSelectedProducts={updateSelectedProducts}
                // updateTotalPrice={updateTotalPrice}
                // updateTotalPrice={updateTotalPrice}
            />
        </>
    );
}

export default CreatePackage;
