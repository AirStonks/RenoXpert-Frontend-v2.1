import React, { useEffect, useState } from 'react';
import { toast, Slide } from 'react-toastify';
import { useLocation, useNavigate } from 'react-router-dom';
import InputFieldGroup from '../../components/Forms/TextFields/InputFieldGroup';
import IncludeProductModal from '../../components/Modals/IncludeProductModal';
import { Package, Product } from '../../types';
import { createPackage, fetchPackage } from '../../services/api';
import Loading from '../../components/Loading';
import Dropdown from '../../components/Forms/Dropdown/Dropdown';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableProductRow } from './components/SortableProductRow';

function CreatePackage() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const [formData, setFormData] = useState({
        packageName: '',
        packagePrice: 0,
        description: '',
        description_internal: '',
        category: '',
        products: [],
    });

    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
    const [totalPrice, setTotalPrice] = useState<number>(0);
    const [loading, setLoading] = useState(false);

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

    const handleBackClick = () => {
        if (state) {
            navigate(state.fromUrl);
        } else {
            navigate('/packages');
        }
    };

    useEffect(() => {
        document.title = "Create Package | RenoXpert";

        const handleDuplicateProducts = async (packageId: number) => {
            setLoading(true);
            try {
                const response = await fetchPackage(packageId);
                if (response?.success) {
                    const data: Package = response.data;
                    const transformedProducts = data.products.map((product: any) => ({
                        SKU: product.SKU,
                        description: product.description,
                        id: product.id,
                        install: product.pivot.includeInstall,
                        name: product.name,
                        price: product.provisioning.supply.retail_price + product.provisioning.install.retail_price,
                        quantity: product.pivot.quantity,
                        supply: product.pivot.includeSupply,
                        visibility: product.pivot.visibility,
                    }));

                    setSelectedProducts(transformedProducts);
                    const calculatedTotalPrice = transformedProducts.reduce(
                        (total, product) => total + (product.price * product.quantity),
                        0
                    );
                    setTotalPrice(calculatedTotalPrice);
                    setFormData({
                        ...formData,
                        packageName: data.name,
                        description: data.description,
                        description_internal: data.description_internal,
                    });
                }
            } catch (error) {
                console.error('Error fetching duplicate products:', error);
            }
            setLoading(false);
        };

        if (state?.dupPackId) {
            console.log('Duplicate Package ID: ', state.dupPackId);
            handleDuplicateProducts(state.dupPackId);
        }
    }, [state]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleVisibilityToggle = (id: number) => {
        setSelectedProducts((prevProducts) =>
            prevProducts.map((product) =>
                product.id === id ? { ...product, visibility: !product.visibility } : product
            )
        );
    };

    const handleNoteChange = (id: string | number, value: string) => {
        setSelectedProducts((prevProducts) =>
            prevProducts.map((product) =>
                product.id === id ? { ...product, note: value } : product
            )
        );
    };

    const handleSubmit = async () => {
        if (selectedProducts.length === 0) {
            notify('error', "Please select at least one product.");
            return;
        }
        if (!formData.packageName) {
            notify('error', "Please enter a package name.");
            return;
        }
        if (!formData.category) {
            notify('error', "Please select a category.");
            return;
        }

        try {
            const newProducts = selectedProducts.map((item) => ({
                id: item.id,
                name: item.name,
                SKU: item.SKU,
                quantity: item.quantity,
                visibility: item.visibility,
                internal_note: item.note,
                supply: item.supply,
                install: item.install,
            }));

            const packageData: Package = {
                name: formData.packageName,
                total_price: formData.packagePrice,
                description: formData.description,
                products: newProducts,
                description_internal: formData.description_internal,
                category: formData.category,
            };

            const response = await createPackage(packageData);
            if (response?.success) {
                notify('success', "Package Created Successfully!");
                navigate('/packages');
            }
        } catch (error) {
            if (error.response?.status === 422) {
                const errors = error.response.data.data || {};
                const formattedErrors = Object.keys(errors).reduce((acc, key) => {
                    acc[key] = errors[key].join(' ');
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

    const updateSelectedProducts = (products: Product[]) => {
        setSelectedProducts(products);
    };

    const updateTotalPrice = (price: number, operator: string) => {
        setTotalPrice((prevTotal) =>
            operator === '+' ? prevTotal + price : operator === '-' ? prevTotal - price : prevTotal
        );
    };

    const adjustQuantity = (id: number, action: 'increase' | 'decrease') => {
        setSelectedProducts((prevProducts) => {
            return prevProducts.map((product) => {
                if (product.id === id) {
                    const newQty = action === 'increase' ? product.quantity + 1 : Math.max(1, product.quantity - 1);
                    const operator = action === 'increase' ? '+' : '-';
                    if (product.quantity > 1 || action === 'increase') {
                        updateTotalPrice(product.price, operator);
                    }
                    return { ...product, quantity: newQty };
                }
                return product;
            });
        });
    };

    const handleRemoveProduct = (id: number) => {
        setSelectedProducts((prevProducts) => {
            const removedProduct = prevProducts.find((product) => product.id === id);
            if (removedProduct) {
                updateTotalPrice(removedProduct.price * removedProduct.quantity, '-');
            }
            return prevProducts.filter((product) => product.id !== id);
        });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setSelectedProducts((prev) => {
                const oldIndex = prev.findIndex((p) => `product-${p.id}` === active.id);
                const newIndex = prev.findIndex((p) => `product-${p.id}` === over.id);
                return arrayMove(prev, oldIndex, newIndex);
            });
        }
    };

    return (
        <>
            {loading && <Loading />}
            <div className="flex justify-between items-center flex-wrap mb-6">
                <div className="flex gap-4 items-center">
                    <button className="text-gray-800 dark:text-gray-400" onClick={handleBackClick}>
                        <i className="ki-solid ki-arrow-left"></i>
                    </button>
                    <span className="text-2xl font-bold text-gray-900">Create New Package</span>
                </div>
            </div>

            <div className="flex flex-wrap gap-8 mb-8">
                <div className="left-column flex flex-col flex-[3] gap-4">
                    <div className="card">
                        <div className="card-body">
                            <div className="flex flex-col">
                                <label className="mb-2 text-sm font-medium text-gray-900">Package Total Price</label>
                                <span className="text-xs text-gray-600 tracking-wide mb-2">
                                    The total price will be reflected based on selected products and quantity.
                                </span>
                                <span className="text-lg font-medium text-gray-900">RM {totalPrice}</span>
                            </div>
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-body">
                            <h2 className="text-xl mb-4 font-semibold text-gray-900">Package Detail</h2>
                            <InputFieldGroup
                                fieldTitle="Package Name"
                                description="A package name is required and recommended to be unique."
                                placeholder="Package name"
                                name="packageName"
                                value={formData.packageName}
                                onChange={handleChange}
                                error={validationErrors.name}
                            />
                            <InputFieldGroup
                                fieldTitle="Description"
                                description="The information of the package related to the package"
                                placeholder="Description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                error={validationErrors.description}
                            />
                            <div className="flex flex-col mb-8">
                                <label className="mb-2 text-sm font-medium text-gray-900">Internal Description</label>
                                <span className="text-xs text-gray-600 tracking-wide mb-2">
                                    Add description for internal reference. (Not visible to public)
                                </span>
                                <textarea
                                    className="textarea"
                                    placeholder="This description will not visible on owner view"
                                    name="description_internal"
                                    rows={6}
                                    value={formData.description_internal || ''}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="flex flex-col mb-8">
                                <label className="mb-2 text-sm font-medium text-gray-900">Category</label>
                                <span className="text-xs text-gray-600 tracking-wide mb-2">
                                    Define a category for the package. (Category will affect the category pricing in Quotation Order)
                                </span>
                                <Dropdown
                                    options={[
                                        { value: "", label: "-- Select Category --" },
                                        { value: "renovation", label: "Renovation" },
                                        { value: "partition", label: "Partition" },
                                        { value: "smart_iot", label: "Smart IoT" },
                                        { value: "project_management", label: "Project Management" },
                                        { value: "electrical_appliances", label: "Electrical Appliances" },
                                        { value: "air_conditioning", label: "Air Conditioning" },
                                        { value: "others", label: "Others" },
                                    ]}
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    error={validationErrors.category}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col right-column flex-[7] gap-8">
                    <div className="card">
                        <div className="card-body">
                            <h2 className="text-xl mb-4 font-semibold text-gray-900">Products</h2>
                            <button
                                className="btn btn-outline btn-primary w-full flex justify-center items-center mb-4"
                                data-modal-toggle="#include_product_modal"
                                onClick={openAddProductModal}
                            >
                                <i className="ki-outline ki-plus-squared"></i>
                                Add Products
                            </button>
                            <div className="product-list flex flex-col">
                                <div className="card min-w-full">
                                    <div className="card-table">
                                        <DndContext onDragEnd={handleDragEnd}>
                                            <table className="table align-middle text-gray-700 font-medium text-sm">
                                                <thead>
                                                    <tr>
                                                        <th className="w-[50px]"></th> {/* Drag handle column */}
                                                        <th className="w-[250px]">Product</th>
                                                        <th className="w-[100px] text-center">Quantity</th>
                                                        <th className="w-[120px] text-center">Retail Price</th>
                                                        <th className="w-[120px] text-center">Total Price</th>
                                                        <th className="w-[60px] text-center">Visibility</th>
                                                        <th className="w-[60px] text-center">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <SortableContext
                                                        items={selectedProducts.map((p) => `product-${p.id}`)}
                                                        strategy={verticalListSortingStrategy}
                                                    >
                                                        {selectedProducts.map((product) => (
                                                            <SortableProductRow
                                                                key={product.id}
                                                                product={product}
                                                                adjustQuantity={adjustQuantity}
                                                                handleVisibilityToggle={handleVisibilityToggle}
                                                                handleRemoveProduct={handleRemoveProduct}
                                                            />
                                                        ))}
                                                    </SortableContext>
                                                </tbody>
                                            </table>
                                        </DndContext>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-6">
                <button className="btn btn-lg btn-light" onClick={handleBackClick}>
                    Cancel
                </button>
                <button className="btn btn-lg btn-primary" onClick={handleSubmit}>
                    Create
                </button>
            </div>

            <IncludeProductModal
                selectedProducts={selectedProducts}
                updateSelectedProducts={updateSelectedProducts}
                updateTotalPrice={updateTotalPrice}
            />
        </>
    );
}

export default CreatePackage;