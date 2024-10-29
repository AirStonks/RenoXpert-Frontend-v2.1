// src\pages\Product\CreateProduct.tsx

import { useState, useEffect } from 'react';
import Dropdown from '../../components/Forms/Dropdown/Dropdown';
import InputFieldGroup from '../../components/Forms/TextFields/InputFieldGroup';
import KTLayout from '../../metronic/app/layouts/demo1';
import KTComponent from '../../metronic/core';
import { createProduct } from '../../services/api';
import { toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import { Product, ProductCategory } from '../../types';
import useFetchProductCategory from '../../hook/useFetchProductCategory';
import Loading from '../../components/Loading';

function CreateProduct() {
    const navigate = useNavigate();
    const { productCategory, loading, error } = useFetchProductCategory();

    const [formData, setFormData] = useState({
        productName: '',
        SKU: '',
        type: 'service',
        description: '',
        category: '1',
        uom: '',
        product_retail_price: '',
        product_cost_of_good_sold: '',
        product_excluded_price: '',
        supply_cost: '',
        install_cost: '',
        status: 'available'
    });

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
        KTComponent.init();
        KTLayout.init();
    }, []);

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
                name: formData.productName,
                SKU: formData.SKU,
                category: formData.category,
                type: formData.type,
                description: formData.description,
                uom: formData.uom,
                product_retail_price: parseFloat(formData.product_retail_price),
                product_cost_of_good_sold: parseFloat(formData.product_cost_of_good_sold),
                product_excluded_price: parseFloat(formData.product_excluded_price),
                supply_cost: parseFloat(formData.supply_cost),
                install_cost: parseFloat(formData.install_cost),
                status: formData.status,
            };

            const response = await createProduct(productData);

            if (response?.success) {
                notify('success', "Product Created Successfully!");
                navigate('/products'); // Navigate to /products on success
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

    if (loading) return <Loading />;
    if (error) return <div>{error}</div>;
    if (!productCategory) return <div>Product Category not found</div>;

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
                        Create Product
                    </span>
                </div>
            </div>

            <div className="flex flex-wrap gap-8 mb-8">
                <div className="flex flex-col flex-[2] gap-8">

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

                    {/* Status */}
                    <div className="card">
                        <div className="card-body">
                            <div className="flex flex-col">
                                {/* Header */}
                                <h1 className='text-xl mb-4 font-semibold text-gray-900'>Status</h1>

                                {/* Status Dropdown */}
                                <div className="flex flex-col">
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
                                <h1 className='text-xl mb-4 font-semibold text-gray-900'>General</h1>

                                {/* Product Name */}
                                <InputFieldGroup
                                    fieldTitle="Product Name"
                                    description="A product name is required and recommended to be unique."
                                    placeholder="Product name"
                                    name="productName"
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

                                    <span className="text-xs text-gray-600 tracking-wide mb-2">
                                        Select the type of product: <strong>Service</strong> for tasks or benefits, and <strong>Component</strong> for physical parts.
                                    </span>

                                    <Dropdown
                                        options={[
                                            { value: "service", label: "Service" },
                                            { value: "component", label: "Component" }
                                        ]}
                                        name="type"
                                        value={formData.type}
                                        onChange={handleChange}
                                    />
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
                            {/* Header */}
                            <h1 className='text-2xl mb-4 font-semibold text-gray-900'>Pricing</h1>
                            <div className="flex gap-12">
                                <div className="flex flex-col flex-1">
                                    {/* Retail Price */}
                                    <InputFieldGroup
                                        fieldTitle="UOM"
                                        description="Unit of Measurement of the product"
                                        placeholder="measurement"
                                        type="text"
                                        name="uom"
                                        value={formData.uom}
                                        onChange={handleChange}
                                        error={validationErrors.uom}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <div className="card flex lg:flex-1 md:flex-auto">
                            <div className="card-body">
                                <div className="flex flex-col mb-4">
                                    <h1 className='text-2xl font-semibold text-gray-900 mb-2'>Supply</h1>
                                    <span className='text-xs text-gray-600 tracking-wide'>The costs for the product supply</span>
                                </div>

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
                        <div className="card flex lg:flex-1 md:flex-auto">
                            <div className="card-body">
                                <div className="flex flex-col mb-4">
                                    <h1 className='text-2xl font-semibold text-gray-900 mb-2'>Install</h1>
                                    <span className='text-xs text-gray-600 tracking-wide'>The installation cost for the product</span>
                                </div>

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
                    Create
                </button>
            </div>
        </>
    );
}

export default CreateProduct;
