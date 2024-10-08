// src\pages\Product\ProductEdit.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useFetchProduct from '../../hook/useFetchProduct';
import Loading from '../../components/Loading';
import InputFieldGroup from '../../components/Forms/TextFields/InputFieldGroup';
import Dropdown from '../../components/Forms/Dropdown/Dropdown';
import { Product, ProductCategory } from '../../types';
import { removeProduct, updateProduct } from '../../services/api';
import { Slide, toast } from 'react-toastify';
import DeleteModal from '../../components/Modals/DeleteModal';
import useFetchProductCategory from '../../hook/useFetchProductCategory';

const EditProduct: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const productId = id ? parseInt(id, 10) : null;

    const { product, loading: productLoading, error: productError } = useFetchProduct(productId);
    const { productCategory, loading: categoryLoading, error: categoryError } = useFetchProductCategory();

    const [formData, setFormData] = useState({
        id: 0,
        productName: '',
        SKU: '',
        type: 'service',
        description: '',
        category: 0,
        product_retail_price: '',
        product_cost_of_good_sold: '',
        product_excluded_price: '',
        status: ''
    });

    const [selectedProduct, setSelectedProduct] = useState<{ id: number, name: string } | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    const handleBackClick = () => {
        navigate('/products'); // Go back to the previous route
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

    useEffect(() => {
        if (product) {
            setFormData({
                id: product.id,
                productName: product.name || '',
                SKU: product.SKU || '',
                type: product.type || '',
                category: product.category_id || 0,
                description: product.description || '',
                product_retail_price: product.product_retail_price.toString() || '',
                product_cost_of_good_sold: product.product_cost_of_good_sold.toString() || '',
                product_excluded_price: product.product_excluded_price.toString() || '',
                status: product.status || ''
            });
        }
    }, [product]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        setFormData((prevData) => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleSubmit = async () => {
        try {
            const productData: Product = {
                id: formData.id,
                name: formData.productName,
                SKU: formData.SKU,
                category: formData.category, // Example category, you can modify this
                type: formData.type,
                description: formData.description,
                product_retail_price: parseFloat(formData.product_retail_price),
                product_cost_of_good_sold: parseFloat(formData.product_cost_of_good_sold),
                product_excluded_price: parseFloat(formData.product_excluded_price),
                status: formData.status,
            };

            const response = await updateProduct(productData);

            if (response?.success) {
                notify('success', "Product Edited Successfully!");
                window.scrollTo({ top: 0, behavior: 'smooth' });
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
                notify('error', "Product edit unsuccessful. Check the errors below.");
            } else {
                console.error('Product creation failed:', error);
            }
        }
    };

    const handleRemoveProduct = () => {
        setSelectedProduct({ id: productId, name: formData.productName });

        const modal = document.querySelector('#delete_product_modal') as HTMLElement;
        if (modal) {
            modal.classList.add('open'); // Assuming you have some CSS to show the modal
        }
    };

    if (productLoading) return <Loading />;
    if (productError) return <div>{productError}</div>;

    if (categoryLoading) return <Loading />;
    if (categoryError) return <div>{categoryError}</div>;
    if (!product) return <div>Product not found</div>;

    // Convert productCategory to the format needed for Dropdown options
    const dropdownOptions = productCategory.map((cat: ProductCategory) => ({
        value: cat.id.toString(), // Ensure value is a string
        label: cat.name // Assuming productCategory has a 'name' property
    }));

    return (
        <>
            <div className="flex justify-between items-center flex-wrap mb-6">
                <div className="flex gap-4 items-center">
                    <button className='text-gray-800 dark:text-gray-400' onClick={handleBackClick}>
                        <i className="ki-solid ki-arrow-left"></i>
                    </button>
                    <span className="text-2xl font-bold text-gray-900">
                        Edit Product
                    </span>
                </div>
                <div className="flex gap-3 flex-wrap">
                    <button className="btn btn-sm btn-danger" data-action="delete" data-id={productId} data-name={formData.productName} data-modal-toggle="#delete_product_modal" onClick={handleRemoveProduct}>
                        <i className="ki-outline ki-trash"></i>
                        Remove Product
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap gap-8 mb-8">
                <div className="left-column flex flex-col flex-auto gap-8">
                    {/* Image */}
                    {/* <div className="card relative">
                        <div className="comming-soon-overlay rounded-xl absolute flex items-center justify-center inset-0 bg-black bg-opacity-60 pointer-events-none">
                            <span className='text-3xl text-white font-bold -rotate-6'>Comming Soon</span>
                        </div>
                        <div className="card-body">
                            <div className="flex flex-col">
                                <h1 className='text-2xl mb-4 font-semibold text-gray-900'>Image</h1>

                                <div className="flex flex-col justify-center items-center text-center">
                                    <span className="flex text-xs text-gray-600 tracking-wide mb-2">
                                        A product name is required and recommended to be unique. A product name is required and recommended to be unique.
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div> */}

                    {/* Product ID */}
                    <div className="card">
                        <div className="card-body">
                            <div className="flex flex-col">
                                {/* Image Placeholder */}
                                <div className="flex gap-4">
                                    <span className="flex text-md font-semibold text-gray-800 tracking-wide">
                                        Product ID:
                                    </span>

                                    <span className="flex text-md font-semibold text-gray-950 tracking-wide">
                                        {formData.id}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="card">
                        <div className="card-body">
                            <div className="flex flex-col">
                                {/* Header */}
                                <h1 className='text-2xl mb-4 font-semibold text-gray-900'>Status</h1>

                                {/* Status Dropdown */}
                                <div className="flex flex-col mb-8">
                                    <Dropdown
                                        options={[
                                            { value: "available", label: "Available" },
                                            { value: "unreleased", label: "Unreleased" }
                                        ]}
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                    />
                                    <span className="text-xs text-gray-600 tracking-wide">
                                        Set the product status.
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='flex flex-col right-column flex-[5] gap-8'>
                    {/* General */}
                    <div className="card">
                        <div className="card-body">
                            <div className="flex flex-col">
                                {/* Header */}
                                <h1 className='text-2xl mb-4 font-semibold text-gray-900'>General</h1>

                                {/* Product Name */}
                                <InputFieldGroup
                                    fieldTitle="Product Name"
                                    description="A product name is required and recommended to be unique."
                                    placeholder="Product name"
                                    name="name"
                                    value={formData.productName}
                                    onChange={handleChange}
                                    error={validationErrors.name}
                                />

                                {/* SKU */}
                                <InputFieldGroup
                                    fieldTitle="SKU"
                                    description="Unique code for tracking this product in inventory"
                                    placeholder="SKU"
                                    name="SKU"
                                    value={formData.SKU}
                                    onChange={handleChange}
                                    error={validationErrors.SKU}
                                />

                                {/* Type */}
                                <div className="flex flex-col mb-8">
                                    <label className='mb-2 text-sm font-medium text-gray-900'>
                                        Product Type
                                    </label>

                                    <Dropdown
                                        options={[
                                            { value: "service", label: "Service" },
                                            { value: "component", label: "Component" }
                                        ]}
                                        name="type"
                                        value={formData.type}
                                        onChange={handleChange}
                                    />

                                    <span className="text-xs text-gray-600 tracking-wide">
                                        Select the type of product: <strong>Service</strong> for tasks or benefits, and <strong>Component</strong> for physical parts.
                                    </span>
                                </div>

                                {/* Category */}
                                <div className="flex flex-col mb-8">
                                    <label className='mb-2 text-sm font-medium text-gray-900'>
                                        Category
                                    </label>

                                    <span className="text-xs text-gray-600 tracking-wide mb-2">
                                        Define which category of the product.
                                    </span>

                                    <Dropdown
                                        options={dropdownOptions}
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                    />
                                </div>

                                {/* Remark */}
                                <InputFieldGroup
                                    fieldTitle="Description"
                                    description="Add any additional comments or notes about the product here"
                                    placeholder="Text..."
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    error={validationErrors.description}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className="card">
                        <div className="card-body">
                            <div className="flex flex-col">
                                {/* Header */}
                                <h1 className='text-2xl mb-4 font-semibold text-gray-900'>Pricing</h1>

                                {/* Retail Price */}
                                <InputFieldGroup
                                    fieldTitle="Retail Price"
                                    description="This is the price at which the product will be sold to customers"
                                    placeholder="Retail Price"
                                    type="number"
                                    name="product_retail_price"
                                    value={formData.product_retail_price}
                                    onChange={handleChange}
                                    error={validationErrors.product_retail_price}
                                />

                                {/* Cost of Good */}
                                <InputFieldGroup
                                    fieldTitle="Cost of Good Sold"
                                    description="This includes all costs directly tied to the production of the product"
                                    placeholder="Cost of Good Sold"
                                    type="number"
                                    name="product_cost_of_good_sold"
                                    value={formData.product_cost_of_good_sold}
                                    onChange={handleChange}
                                    error={validationErrors.product_cost_of_good_sold}
                                />

                                {/* Excluded Price */}
                                <InputFieldGroup
                                    fieldTitle="Excluded Price"
                                    description="Enter the price that will be deducted when the selected product is excluded from a package in quotation"
                                    placeholder="Excluded Price"
                                    type="number"
                                    name="product_excluded_price"
                                    value={formData.product_excluded_price}
                                    onChange={handleChange}
                                    error={validationErrors.product_excluded_price}
                                />
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
                    Edit
                </button>
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
};

export default EditProduct;
