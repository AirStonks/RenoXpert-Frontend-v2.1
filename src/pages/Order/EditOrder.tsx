// src\pages\Order\CreateOrder.tsx

import { useEffect, useRef, useState } from 'react';
import { json, useNavigate, useParams } from 'react-router-dom';
import { fetchUser, fetchUsers, fetchProperties, fetchProperty, fetchQuotations, updateOrder, fetchRegistrationForm } from '../../services/api';
import { User, Order, Property, Quotation, OwnerRegistrationForm } from '../../types';
import { KTDropdown } from '../../metronic/core';
import { Package } from '../../types/index';
import { Link } from 'react-router-dom';
import { Slide, toast } from 'react-toastify';
import useFetchOrder from '../../hook/useFetchOrder';
import Loading from '../../components/Loading';

function EditOrder() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const orderId = id ? parseInt(id, 10) : null;

    const [searchUserTerm, setSearchUserTerm] = useState('');
    const [searchPropertyTerm, setSearchPropertyTerm] = useState('');
    const [searchQuotationTerm, setSearchQuotationTerm] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [formDetail, setFormDetail] = useState<OwnerRegistrationForm | null>(null);

    const inputUserRef = useRef(null);
    const inputPropertyRef = useRef(null);
    const inputQuotationRef = useRef(null);


    const { orderDetail, loading, error } = useFetchOrder(orderId);

    const [formData, setFormData] = useState({
        userId: '',
        propertyId: '',
        quotationId: '',
        totalAmount: 0,
        block: '',
        floor: '',
        unitNo: '',
        status: '',
        bedroom_count: 1,
        bathroom_count: 1,
    });

    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
    const [selectedPackages, setSelectedPackages] = useState([]);

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
        document.title = "Revise Order | RenoXpert";

        if (orderDetail) {

            if (orderDetail.form_id) {
                handleSearchForm(orderDetail.form_id);
            }

            setFormData({
                userId: orderDetail.user_id || '',
                propertyId: orderDetail.property_id || '',
                quotationId: orderDetail.latest_quotation.quotation_id || '',
                totalAmount: orderDetail.total_amount || 0,
                block: orderDetail.block || '',
                floor: orderDetail.floor || '',
                unitNo: orderDetail.unit_no || '',
                status: orderDetail.status || '',
                bedroom_count: orderDetail.bedroom_count || 1,
                bathroom_count: orderDetail.bathroom_count || 1,
            });

            const tmpEditOrder = {
                userId: orderDetail.user_id || '',
                propertyId: orderDetail.property_id || '',
                quotationId: orderDetail.latest_quotation.quotation_id || '',
                totalAmount: orderDetail.total_amount || 0,
                block: orderDetail.block || '',
                floor: orderDetail.floor || '',
                unitNo: orderDetail.unit_no || '',
                status: orderDetail.status || '',
                bedroom_count: orderDetail.bedroom_count || 1,
                bathroom_count: orderDetail.bathroom_count || 1,
            }

            if (localStorage.getItem('e:edit_order_data')) {
                
                console.log('yes');

                setFormData((prevData) => ({
                    ...prevData,
                    totalAmount: JSON.parse(localStorage.getItem('e:edit_order_data')).totalAmount,
                }));

                localStorage.setItem('edit_order_data', localStorage.getItem('e:edit_order_data'));
            } else {
                localStorage.setItem('edit_order_data', JSON.stringify(tmpEditOrder));
            }


            if (!localStorage.getItem('include_packages')) {
                localStorage.setItem('include_packages', JSON.parse(JSON.stringify(orderDetail.latest_quotation.metadata)));
            }


            if (orderDetail.user_id) {
                handleSelectUserById(Number(orderDetail.user_id));
            }

            if (orderDetail.property_id) {
                handleSelectPropertytById(Number(orderDetail.property_id));
            }

            if (orderDetail.latest_quotation.id) {
                handleSelectQuotationtById();
            }
        }

        initDropdown();
    }, [orderDetail]);

    const initDropdown = async () => {
        const contractEl = document.querySelector('#contract_dropdown') as HTMLElement;
        const contractDropdown = KTDropdown.getInstance(contractEl);

        const propertyEl = document.querySelector('#property_dropdown') as HTMLElement;
        const propertyDropdown = KTDropdown.getInstance(propertyEl);

        const quotationEl = document.querySelector('#quotation_dropdown') as HTMLElement;
        const quotationDropdown = KTDropdown.getInstance(quotationEl);

        contractDropdown.on('shown', async () => {
            inputUserRef.current.focus();
            try {
                const data = await fetchUsers('', 'owner');
                setUsers(data.data);

            } catch (error) {
                console.error('Failed to fetch quotations:', error);
            }
        });

        propertyDropdown.on('shown', async () => {
            inputPropertyRef.current.focus();
            try {
                const data = await fetchProperties('', 6);
                setProperties(data.data);

            } catch (error) {
                console.error('Failed to fetch quotations:', error);
            }
        });

        quotationDropdown.on('shown', async () => {
            inputQuotationRef.current.focus();
            try {
                const data = await fetchQuotations('', 6);
                setQuotations(data.data);

            } catch (error) {
                console.error('Failed to fetch quotations:', error);
            }
        });


    }

    const handleSearchForm = async (formId: string) => {

        try {
            const response = await fetchRegistrationForm(Number(formId)); // This returns AxiosResponse
            const registrationForm: OwnerRegistrationForm = response.data.data; // Extract the data

            if (registrationForm) {
                setFormDetail(registrationForm);
            } else {
                toast.error("Registration form not found");
            }

        } catch (error) {
            console.error("Error fetching registration form:", error);
            toast.error("Failed to fetch registration form");
        }
    };

    const handleBackClick = () => {
        localStorage.removeItem('edit_order_data');
        localStorage.removeItem('include_packages');
        localStorage.removeItem('selected_quotation_packages');
        localStorage.removeItem('e:edit_order_data');
        navigate('/orders/' + orderId);
    };

    const handleSearchUser = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const term = event.target.value;
        setSearchUserTerm(term);

        try {
            const data = await fetchUsers(term, 'owner');
            setUsers(data.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const handleSearchProperty = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const term = event.target.value;
        setSearchPropertyTerm(term);

        try {
            const data = await fetchProperties(term, 6); // Assuming you have a similar fetch function
            setProperties(data.data);
        } catch (error) {
            console.error('Error fetching properties:', error);
        }
    };

    const handleSearchQuotation = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const term = event.target.value;
        setSearchQuotationTerm(term);

        try {
            const data = await fetchQuotations(term, 6); // Assuming you have a similar fetch function
            setQuotations(data.data);
        } catch (error) {
            console.error('Error fetching properties:', error);
        }
    };

    const handleEditQuotation = () => {
        console.log(formData);
        localStorage.setItem('edit_order_data', JSON.stringify(formData));
    };

    const handleSelectUser = async (user: User) => {
        setFormData((prev) => ({
            ...prev,
            userId: user.id,
        }));
        setSelectedUser(user);
        setSearchUserTerm('');
        setUsers([]);
    };

    const handleSelectProperty = async (property: Property) => {
        setFormData((prev) => ({
            ...prev,
            propertyId: property.id,
        }));
        setSelectedProperty(property);
        setSearchPropertyTerm('');
        setProperties([]);
        localStorage.setItem('edit_order_data', JSON.stringify(formData));
    };

    const handleSelectQuotation = async (quotation: Quotation) => {
        setFormData((prev) => ({
            ...prev,
            quotationId: quotation.id,
        }));
        setSelectedQuotation(quotation);
        setSearchQuotationTerm('');
        setQuotations([]);

        // Store selected quotation package
        localStorage.setItem('include_packages', JSON.stringify(quotation.metadata));
        const storedPackages = localStorage.getItem('include_packages');

        if (storedPackages) {
            setSelectedPackages(JSON.parse(storedPackages));
        }
    };

    const handleSelectUserById = async (id: number) => {
        try {
            const data = await fetchUser(id); // Assuming you have a similar fetch function

            setFormData((prev) => ({
                ...prev,
                userId: data.data.id,
            }));

            setSelectedUser(data.data);
            setSearchUserTerm('');
            setUsers([]);

        } catch (error) {
            console.error('Error fetching properties:', error);
        }
    };

    const handleSelectPropertytById = async (id: number) => {
        try {
            const data = await fetchProperty(id); // Assuming you have a similar fetch function

            setFormData((prev) => ({
                ...prev,
                propertyId: data.data.id,
            }));
            setSelectedProperty(data.data);
            setSearchPropertyTerm('');
            setProperties([]);

        } catch (error) {
            console.error('Error fetching properties:', error);
        }
    };

    const handleSelectQuotationtById = async () => {
        try {
            const latestQuotation = orderDetail.latest_quotation.quotation;
            latestQuotation.metadata = orderDetail.latest_quotation.metadata;

            console.log('OrderDetail: ', orderDetail);

            let storedPackages = localStorage.getItem('include_packages');

            if (!storedPackages) {
                localStorage.setItem('include_packages', JSON.stringify(orderDetail.latest_quotation.metadata));

                storedPackages = JSON.stringify(orderDetail.latest_quotation.metadata);
            }

            setSelectedQuotation(latestQuotation);
            setSelectedPackages(JSON.parse(storedPackages));

        } catch (error) {
            console.error('Error fetching latest quotation:', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = async () => {
        try {
            const newOrder: Order = {
                id: orderDetail.id,
                user_id: selectedUser.id,
                property_id: selectedProperty.id,
                quotation_id: selectedQuotation.id,
                total_amount: formData.totalAmount,
                block: formData.block,
                floor: formData.floor,
                unit_no: formData.unitNo,
                bedroom_count: formData.bedroom_count,
                bathroom_count: formData.bathroom_count,
                description: '',
                metadata: JSON.parse(localStorage.getItem('include_packages')),
            }

            const response = await updateOrder(newOrder);

            if (response?.success) {
                notify('success', "Quotation Created Successfully!");
                localStorage.removeItem('edit_order_data');
                localStorage.removeItem('include_packages');
                localStorage.removeItem('selected_quotation_packages');
                localStorage.removeItem('e:edit_order_data');
                navigate('/orders');
            } else {
                console.log(response);
            }

        } catch (error) {
            console.log(error);
        }
    }

    if (loading) return <Loading />;
    if (error) return <div>{error}</div>;
    if (!orderDetail) return <div>Order not found</div>;

    return (
        <>
            <div className="flex justify-between items-center flex-wrap mb-6">
                <div className="flex gap-4 items-center">
                    <button className='text-gray-800 dark:text-gray-400' onClick={handleBackClick}>
                        <i className="ki-solid ki-arrow-left"></i>
                    </button>
                    <span className="text-2xl font-bold text-gray-900">
                        Revise Order
                    </span>
                </div>
            </div>

            <div className="flex grow flex-col gap-3 lg:gap-6 lg:mr-[400px] lg:px-6">
                <div className="flex flex-col gap-8 mb-8">
                    <div className="card">
                        <div className="card-body">
                            <h2 className='text-xl mb-4 font-semibold text-gray-900'>Order</h2>
                            <div className="flex gap-8">
                                {/* User */}
                                <div className="flex flex-col flex-1 gap-2">
                                    <span className="text-base font-semibold text-gray-900">
                                        1. Select an Owner
                                    </span>
                                    <div className="dropdown" data-dropdown="true" data-dropdown-trigger="click" id="contract_dropdown">
                                        <button className="dropdown-toggle btn btn-light w-full flex justify-between items-center">
                                            <span>Owner</span>
                                            <i className="ki-filled ki-down"></i>
                                        </button>
                                        <div className="dropdown-content w-full max-w-80">
                                            <div className="px-4 pt-4 text-sm text-gray-900 font-medium">
                                                <label className="input input-sm">
                                                    <i className="ki-filled ki-magnifier"></i>
                                                    <input
                                                        ref={inputUserRef}
                                                        placeholder="Search user"
                                                        type="text"
                                                        value={searchUserTerm}
                                                        onChange={handleSearchUser}
                                                    />
                                                </label>
                                            </div>
                                            <div className="menu menu-default flex flex-col w-full">
                                                {users.map((user, index) => (
                                                    <div className="menu-item" key={index} data-id={user.id}>
                                                        <button
                                                            className="menu-link"
                                                            onClick={() => handleSelectUser(user)}
                                                        >
                                                            <span className="menu-title">{user.name}</span>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    {selectedUser && (
                                        <div className="card mb-4">
                                            <div className="card-body">
                                                <div className="flex flex-col gap-1 text-gray-900">
                                                    <span className='text-sm font-semibold'>{selectedUser.name}</span>
                                                    <span className='text-sm font-normal text-slate-400'>{selectedUser.email}</span>
                                                    <span className='text-sm font-normal'>{selectedUser.phone_no}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col flex-1 gap-2">
                                    <span className="text-base font-semibold text-gray-900">
                                        2. Select a Property
                                    </span>
                                    <div className="dropdow" data-dropdown="true" data-dropdown-trigger="click" id='property_dropdown'>
                                        <button className="dropdown-toggle btn btn-light w-full flex justify-between items-center">
                                            <span>Property</span>
                                            <i className="ki-filled ki-down"></i>
                                        </button>
                                        <div className="dropdown-content w-full max-w-80">
                                            <div className="px-4 pt-4 text-sm text-gray-900 font-medium">
                                                <label className="input input-sm">
                                                    <i className="ki-filled ki-magnifier"></i>
                                                    <input
                                                        ref={inputPropertyRef}
                                                        placeholder="Search property"
                                                        type="text"
                                                        value={searchPropertyTerm}
                                                        onChange={handleSearchProperty}
                                                    />
                                                </label>
                                            </div>
                                            <div className="menu menu-default flex flex-col w-full">
                                                {properties.map((property, index) => (
                                                    <div className="menu-item" key={index} data-id={property.id}>
                                                        <button
                                                            className="menu-link"
                                                            onClick={() => handleSelectProperty(property)}
                                                        >
                                                            <span className="menu-title">{property.name}</span>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    {selectedProperty && (
                                        <>
                                            <div className="card mb-4">
                                                <div className="card-body">
                                                    <div className="flex flex-col gap-1 text-gray-900">
                                                        <span className='text-sm font-semibold text-gray-900'>{selectedProperty.name}</span>
                                                        <span className='text-sm font-normal text-slate-400'>
                                                            {[
                                                                selectedProperty.address,
                                                                selectedProperty.street,
                                                                selectedProperty.postcode,
                                                                selectedProperty.city,
                                                                selectedProperty.state
                                                            ].filter(Boolean).join(', ')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-4">
                                                <div className="flex flex-col">
                                                    <span className='text-sm font-semibold text-gray-900'>
                                                        Block
                                                    </span>

                                                    <input
                                                        className='input mb-2'
                                                        type='text'
                                                        name='block'
                                                        value={formData.block}
                                                        onChange={handleChange}
                                                    />
                                                </div>

                                                <div className="flex flex-col">
                                                    <span className='text-sm font-semibold text-gray-900'>
                                                        Floor
                                                    </span>

                                                    <input
                                                        className='input mb-2'
                                                        type='text'
                                                        name='floor'
                                                        value={formData.floor || ''}
                                                        onChange={handleChange}
                                                    />
                                                </div>

                                                <div className="flex flex-col">
                                                    <span className='text-sm font-semibold text-gray-900'>
                                                        Unit No
                                                    </span>

                                                    <input
                                                        className='input mb-2'
                                                        type='text'
                                                        name='unitNo'
                                                        value={formData.unitNo}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-body">
                            <h2 className='text-xl mb-4 font-semibold text-gray-900'>Quotation</h2>

                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-base font-semibold text-gray-900">
                                            3. Select a Quotation
                                        </span>
                                        {/* <div className="dropdown" data-dropdown="true" data-dropdown-placement="bottom-end" data-dropdown-trigger="click">
                                            <button
                                                className="dropdown-toggle btn btn-sm btn-outline btn-info btn-icon-xs">
                                                Previous Version
                                                <i className="ki-outline ki-down dropdown-open:hidden">
                                                </i>
                                                <i className="ki-outline ki-up hidden dropdown-open:block">
                                                </i>
                                            </button>
                                            <div className="dropdown-content w-full max-w-48">
                                                <div className="menu menu-default flex flex-col">
                                                    {orderDetail.order_quotations.slice(1).map((orderQuotation, index) => (
                                                        <div className="menu-item" key={index} data-id={orderQuotation.id}>
                                                            <button className="menu-link">
                                                                <span className="menu-title">Version {orderQuotation.version}</span>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div> */}
                                    </div>
                                    <div className="dropdown" data-dropdown="true" data-dropdown-trigger="click" id='quotation_dropdown'>
                                        <button className="dropdown-toggle btn btn-light w-full flex justify-between items-center">
                                            <span>Quotation</span>
                                            <i className="ki-filled ki-down"></i>
                                        </button>
                                        <div className="dropdown-content w-full max-w-2xl">
                                            <div className="px-4 pt-4 text-sm text-gray-900 font-medium">
                                                <label className="input input-sm">
                                                    <i className="ki-filled ki-magnifier"></i>
                                                    <input
                                                        ref={inputQuotationRef}
                                                        placeholder="Search quotation"
                                                        type="text"
                                                        value={searchQuotationTerm}
                                                        onChange={handleSearchQuotation}
                                                    />
                                                </label>
                                            </div>
                                            <div className="menu menu-default flex flex-col">
                                                {quotations.map((quotation, index) => (
                                                    <div className="menu-item" key={index} data-id={quotation.id}>
                                                        <button
                                                            className="menu-link"
                                                            onClick={() => handleSelectQuotation(quotation)}
                                                        >
                                                            <span className="menu-title">{quotation.name}</span>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {selectedQuotation && (
                        <div className="flex flex-col gap-4">
                            <div className="card">
                                <div className="card-body quotation-info flex justify-between items-center gap-4">
                                    <div className="flex flex-col">
                                        <span className='text-lg font-semibold text-gray-900'>
                                            {selectedQuotation.name}
                                        </span>
                                        <span className="text-base font-normal text-gray-800">
                                            Price: RM {formData.totalAmount ? formData.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : selectedQuotation.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                        <span className="text-base font-normal text-slate-400">
                                            {selectedQuotation.description}
                                        </span>
                                    </div>
                                    <div className="flex actions">
                                        <Link
                                            to={'/orders/edit/' + orderId + '/quotation/edit/' + selectedQuotation.id}
                                            className="btn btn-primary btn-lg"
                                            data-id={selectedQuotation.id}
                                            onClick={handleEditQuotation}
                                        >
                                            Edit Quotation
                                        </Link>
                                    </div>
                                </div>
                            </div>
                            <div className="card">
                                <div className="card-body">
                                    <div className="text-base font-semibold text-gray-900 mb-2">
                                        Packages:
                                    </div>
                                    <div className="flex flex-col gap-5" data-accordion="true" data-accordion-expand-all="true">
                                        {selectedPackages.map((prodPackage: Package) => (
                                            <div className="package flex items-center" key={prodPackage.id} data-id={prodPackage.id}>
                                                <div className="accordion-item border rounded-xl w-full" data-accordion-item="true" id={"package_item_" + prodPackage.id.toString()}>
                                                    <button className="accordion-toggle p-4" data-accordion-toggle={"#package_content_" + prodPackage.id.toString()}>
                                                        <div className="flex flex-col items-start">
                                                            <span className="text-base text-gray-900 font-medium">
                                                                {prodPackage.name}
                                                            </span>
                                                            <span className='text-base text-slate-700'>
                                                                RM {prodPackage.total_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </span>
                                                            <span className='text-sm text-slate-400'>
                                                                {prodPackage.description}
                                                            </span>
                                                        </div>
                                                    </button>
                                                    <div className="accordion-content active border-t" id={"package_content_" + prodPackage.id.toString()}>
                                                        <div className="product-list flex flex-col">
                                                            <table className="table align-middle text-gray-700 font-medium text-sm">
                                                                <thead>
                                                                    <tr>
                                                                        <th className='w-[10px] text-center'>Supply</th>
                                                                        <th className='w-[10px] text-center'>Install</th>
                                                                        <th className='w-[250px]'>Product</th>
                                                                        <th className='w-[100px] text-center'>Quantity</th>
                                                                        <th className='w-[100px] text-center'>Unit Price</th>
                                                                        <th className='w-[100px] text-center'>Discount</th>
                                                                        <th className='w-[100px] text-center'>Total Price</th>
                                                                        <th className='w-[10px] text-center'></th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {prodPackage.products.map((product) => (
                                                                        <tr
                                                                            key={product.id}
                                                                        >
                                                                            <td>
                                                                                <span></span>
                                                                                <div className="flex flex-col items-center">
                                                                                    <input
                                                                                        className="checkbox"
                                                                                        name="supply"
                                                                                        type="checkbox"
                                                                                        checked={!!product.pivot.includeSupply}
                                                                                        readOnly
                                                                                    />
                                                                                </div>
                                                                            </td>
                                                                            <td>
                                                                                <div className="flex flex-col items-center">
                                                                                    <input
                                                                                        className="checkbox"
                                                                                        name="install"
                                                                                        type="checkbox"
                                                                                        checked={!!product.pivot.includeInstall}
                                                                                        readOnly
                                                                                    />
                                                                                </div>
                                                                            </td>
                                                                            <td>
                                                                                <div className="flex flex-col">
                                                                                    <span>{product.name}</span>
                                                                                    <span className="text-xs text-slate-400">{product.description}</span>
                                                                                </div>
                                                                            </td>
                                                                            <td className='text-center text-lg'>
                                                                                <span className="mx-2 text-base">
                                                                                    {product.pivot.included ? product.pivot.quantity : '0'}
                                                                                </span>
                                                                            </td>
                                                                            <td className="text-center">
                                                                                RM {(product.provisioning.supply.retail_price + product.provisioning.install.retail_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                            </td>
                                                                            <td className='text-center'>
                                                                                {!product.pivot.includeSupply || !product.pivot.includeInstall
                                                                                    ? `- RM ${(
                                                                                        (!product.pivot.includeSupply ? product.provisioning.supply.excluded_price * product.pivot.quantity : 0) +
                                                                                        (!product.pivot.includeInstall ? product.provisioning.install.excluded_price * product.pivot.quantity : 0)
                                                                                    )
                                                                                        .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                                                    : null}
                                                                            </td>
                                                                            <td className="text-center">
                                                                                {!product.pivot.included
                                                                                    ? null
                                                                                    : `RM ${(
                                                                                        (product.provisioning.supply.retail_price * product.pivot.quantity -
                                                                                            (!product.pivot.includeSupply ? product.provisioning.supply.excluded_price * product.pivot.quantity : 0)
                                                                                        ) +
                                                                                        (product.provisioning.install.retail_price * product.pivot.quantity -
                                                                                            (!product.pivot.includeInstall ? product.provisioning.install.excluded_price * product.pivot.quantity : 0)
                                                                                        )
                                                                                    )
                                                                                        .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                                            </td>
                                                                            <td className="text-center">
                                                                                {!product.pivot.visibility && <i className="ki-solid ki-eye-slash text-2xl"></i>}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-6">
                        <button className="btn btn-lg btn-light">
                            Cancel
                        </button>
                        <button
                            className="btn btn-lg btn-primary"
                            onClick={handleSubmit}
                        >
                            Update
                        </button>
                    </div>
                </div>
            </div >

            <div
                className="w-[400px] drawer drawer-start grow fixed z-1 top-20 lg:top-20 bottom-12 lg:bottom-12 lg:right-8 lg:left-auto lg:translate-x-0 lg:flex flex-col items-stretch shrink-0 bg-[#fefefe] dark:bg-coal-500"
                data-overlay="true"
                data-overlay-enable="true|lg:false"
                id="aside"
            >
                <div
                    className="card flex flex-col shrink-0 px-3 scrollable-y-hover max-h-dvh"
                    data-scrollable="true"
                    data-scrollable-dependencies="#header"
                    data-scrollable-height="auto"
                    data-scrollable-offset="15px"
                    data-scrollable-wrappers="#page"
                    id="aside_content"
                    style={{ height: 'calc(100vh - 11em)', maxHeight: 'calc(100vh - 11em)' }}
                >
                    {formDetail ?
                        <>
                            <div className="card-header px-2">
                                <h2 className='text-base font-semibold'>Form Detail</h2>
                            </div>
                            <div className="card-body flex flex-col text-gray-900 px-2 py-4">
                                <div className="flex flex-col mb-8">
                                    <span className="font-medium">Status</span>
                                    <span className={`badge badge-outline gap-1 items-center ${formDetail.status ===
                                        'approved' ? 'badge-success' : ''}`}>
                                        {formDetail.status.charAt(0).toUpperCase() + formDetail.status.slice(1)}
                                    </span>
                                </div>

                                <div className="flex flex-col mb-8">
                                    <span className="text-slate-400 font-medium">Salutations</span>
                                    <span className="font-semibold">{formDetail.user.salutations}</span>
                                </div>

                                <div className="flex flex-col mb-8">
                                    <label className="text-slate-900 mb-2 font-medium" htmlFor="name_f">Name</label>
                                    <div className="flex gap-2">
                                        <div className="flex flex-col w-full">
                                            <span className="text-slate-400 font-medium">First Name</span>
                                            <span className="font-semibold">{formDetail.user.name_first}</span>
                                        </div>
                                        <div className="flex flex-col w-full">
                                            <span className="text-slate-400 font-medium">Last Name</span>
                                            <span className="font-semibold">{formDetail.user.name_last}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col mb-8">
                                    <span className="text-slate-400 font-medium">Preferred Name</span>
                                    <span className="font-semibold">{formDetail.user.name_preferred}</span>
                                </div>

                                <div className="flex flex-col mb-8">
                                    <div className="flex gap-2 flex-wrap">
                                        <div className="flex flex-col flex-auto mb-6 md:mb-0">
                                            <span className="text-slate-400 font-medium">Email</span>
                                            <span className="font-semibold">{formDetail.user.email}</span>
                                        </div>
                                        <div className="flex flex-col flex-auto">
                                            <span className="text-slate-400 font-medium">Phone Number</span>
                                            <span className="font-semibold">+60 {formDetail.user.phone_no}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col mb-8">
                                    <label className="text-slate-900 mb-2 font-medium" htmlFor="address_1">Current residence address (information needed for renovation agreement purpose)</label>

                                    <div className="flex flex-col mb-8">
                                        <span className="text-slate-400 font-medium">Address Line 1</span>
                                        <span className="font-semibold">{formDetail.address.address_1}</span>
                                    </div>

                                    <div className="flex flex-col mb-8">
                                        <span className="text-slate-400 font-medium">Address Line 2</span>
                                        <span className="font-semibold">{formDetail.address.address_2}</span>
                                    </div>

                                    <div className="flex flex-col mb-8">
                                        <div className="flex gap-2 ">
                                            <div className="flex flex-col w-full">
                                                <span className="text-slate-400 font-medium">City</span>
                                                <span className="font-semibold">{formDetail.address.city}</span>
                                            </div>
                                            <div className="flex flex-col w-full">
                                                <span className="text-slate-400 font-medium">State</span>
                                                <span className="font-semibold">{formDetail.address.state}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col">
                                        <span className="text-slate-400 font-medium">Postal / Zip Code</span>
                                        <span className="font-semibold">{formDetail.address.postcode}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col mb-8">
                                    <span className="text-slate-400 font-medium">IC / ID number</span>
                                    <span className="font-semibold">{formDetail.user.ic}</span>
                                </div>

                                <div className="flex flex-col mb-8">
                                    <span className="text-slate-400 font-medium">Property to be renovated</span>
                                    <span className="font-semibold">
                                        {formDetail.property ? formDetail.property.property_name : "(Other) " + formDetail.other_property.property_name}
                                    </span>
                                </div>

                                <div className="flex flex-col mb-8">
                                    <div className="flex flex-col w-full">
                                        <span className="text-slate-400 font-medium">Unit</span>
                                        <span className="font-semibold">{formDetail.property ?
                                            `${formDetail.property.block}-${formDetail.property.level}-${formDetail.property.unit}` :
                                            `${formDetail.other_property.block}-${formDetail.other_property.level}-${formDetail.other_property.unit}`
                                        }</span>
                                    </div>
                                </div>

                                <div className="flex flex-col mb-8">
                                    <span className="text-slate-400 font-medium">Layout Type</span>
                                    <span className="font-semibold">
                                        {formDetail.property ?
                                            `${formDetail.property.layout_type}` :
                                            `${formDetail.other_property.layout_type}`
                                        }
                                    </span>
                                </div>

                                <div className="flex flex-col mb-8">
                                    <span className="text-slate-400 font-medium">Sqft</span>
                                    <span className="font-semibold">
                                        {formDetail.property ?
                                            `${formDetail.property.sqft}` :
                                            `${formDetail.other_property.sqft}`
                                        }
                                    </span>
                                </div>

                                <div className="flex flex-col mb-8">
                                    <span className="text-slate-400 font-medium">What's your original number of rooms?</span>
                                    <span className="font-semibold">{formDetail.questions.quest_1}</span>
                                </div>

                                <div className="flex flex-col mb-8">
                                    <span className="text-slate-400 font-medium">What's the number of bathroom?</span>
                                    <span className="font-semibold">{formDetail.questions.quest_2}</span>
                                </div>

                                <div className="flex flex-col mb-8">
                                    <span className="text-slate-400 font-medium">Already Vacant Possessions (VP)?</span>
                                    <span className="font-semibold">{formDetail.questions.quest_3}</span>
                                </div>

                                <div className="flex flex-col mb-8">
                                    <span className="text-slate-400 font-medium">Already collect key?</span>
                                    <span className="font-semibold">{formDetail.questions.quest_4}</span>
                                </div>

                                <div className="flex flex-col mb-8">
                                    <span className="text-slate-400 font-medium">Already done defect inspection?</span>
                                    <span className="font-semibold">{formDetail.questions.quest_5}</span>
                                </div>

                                <div className="flex flex-col mb-8">
                                    <span className="text-slate-400 font-medium">Already submit defect submission to MO?</span>
                                    <span className="font-semibold">{formDetail.questions.quest_6}</span>
                                </div>

                                <div className="flex flex-col mb-8">
                                    <span className="text-slate-400 font-medium">MO has completed that defect rectification?</span>
                                    <span className="font-semibold">{formDetail.questions.quest_7}</span>
                                </div>

                                <div className="flex flex-col mb-8">
                                    <span className="text-slate-400 font-medium">Do you want to add partition room to your unit?</span>
                                    <span className="font-semibold">{formDetail.questions.quest_8}</span>
                                </div>

                                <div className="flex flex-col mb-8">
                                    <span className="text-sm text-gray-900 font-bold text-justify">
                                        Please help us understand the furnishing condition of your unit for the following areas:
                                    </span>
                                </div>

                                <div className="flex flex-col flex-wrap mb-8">
                                    <div className="card rounded-md mb-8">
                                        <div className="card-header px-4 rounded-t-md bg-gray-300 text-gray-900 font-bold">
                                            <h2 className="">Foyer & entrance</h2>
                                        </div>
                                        <div className="card-body text-sm px-4">
                                            <div className="w-full">
                                                <div className="grid grid-cols-3 gap-4">
                                                    {/* Header Row */}
                                                    <div className="col-start-2 text-xs text-center text-gray-900 font-semibold">Furnished</div>
                                                    <div className="col-start-3 text-xs text-center text-gray-900 font-semibold">Not Furnished</div>

                                                    {/* Grille Door */}
                                                    <div className="flex items-center text-gray-900 font-semibold">Grille door</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.foyer_entrance.grille_door === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.foyer_entrance.grille_door === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>

                                                    {/* Digital Lock */}
                                                    <div className="flex items-center text-gray-900 font-semibold">Digital lock</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.foyer_entrance.digital_lock === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.foyer_entrance.digital_lock === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>

                                                    {/* Shoe Cabinet */}
                                                    <div className="flex items-center text-gray-900 font-semibold">Shoe cabinet</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.foyer_entrance.shoe_cabinet === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.foyer_entrance.shoe_cabinet === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>

                                                    {/* Lights */}
                                                    <div className="flex items-center text-gray-900 font-semibold">Lights</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.foyer_entrance.lights === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.foyer_entrance.lights === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col mb-8">
                                        <label className="text-slate-900 mb-2 font-medium" htmlFor="furnishing.foyer_entrance.other">Remarks</label>
                                        <span className="textarea">
                                            {formDetail.furnishing.foyer_entrance.other ? formDetail.furnishing.foyer_entrance.other : '-'}
                                        </span>
                                    </div>

                                    <hr className="mb-8" />

                                    <div className="card rounded-md mb-8">
                                        <div className="card-header px-4 rounded-t-md bg-gray-300 text-gray-900 font-bold">
                                            <h2 className="">Kitchen</h2>
                                        </div>
                                        <div className="card-body text-sm px-4">
                                            <div className="w-full">
                                                <div className="grid grid-cols-3 gap-4">
                                                    {/* Header Row */}
                                                    <div className="col-start-2 text-xs text-center text-gray-900 font-semibold">Furnished</div>
                                                    <div className="col-start-3 text-xs text-center text-gray-900 font-semibold">Not Furnished</div>

                                                    {/* Kitchen Cabinet */}
                                                    <div className="flex items-center text-gray-900 font-semibold">Kitchen cabinet</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.kitchen_cabinet === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.kitchen_cabinet === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>

                                                    {/* Kitchen Island */}
                                                    <div className="flex items-center text-gray-900 font-semibold">Kitchen island</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.kitchen_island === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.kitchen_island === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>

                                                    {/* Sink & Tap */}
                                                    <div className="flex items-center text-gray-900 font-semibold">Sink & tap</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.sink_tap === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.sink_tap === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>

                                                    {/* Hood and Hob */}
                                                    <div className="flex items-center text-gray-900 font-semibold">Hood and hob</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.hood_hob === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.hood_hob === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>

                                                    {/* Microwave */}
                                                    <div className="flex items-center text-gray-900 font-semibold">Microwave</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.microwave === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.microwave === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>

                                                    {/* Oven */}
                                                    <div className="flex items-center text-gray-900 font-semibold">Oven</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.oven === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.oven === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>

                                                    {/* Water Dispenser / Water Purifier */}
                                                    <div className="flex items-center text-gray-900 font-semibold">Water dispenser / water purifier</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.water_dispenser === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.water_dispenser === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>

                                                    {/* Fridge */}
                                                    <div className="flex items-center text-gray-900 font-semibold">Fridge</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.fridge === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.fridge === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>

                                                    {/* Lights */}
                                                    <div className="flex items-center text-gray-900 font-semibold">Lights</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.lights === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.lights === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col mb-8">
                                        <label className="text-slate-900 mb-2 font-medium" htmlFor="kitchen.other">Remarks</label>
                                        <span className="textarea">
                                            {formDetail.furnishing.kitchen.other ? formDetail.furnishing.kitchen.other : '-'}
                                        </span>
                                    </div>

                                    <hr className="mb-8" />

                                    <div className="card rounded-md mb-8">
                                        <div className="card-header px-4 rounded-t-md bg-gray-300 text-gray-900 font-bold">
                                            <h2 className="">Yard</h2>
                                        </div>
                                        <div className="card-body text-sm px-4">
                                            <div className="w-full">
                                                <div className="grid grid-cols-3 gap-4">
                                                    {/* Header Row */}
                                                    <div className="col-start-2 text-xs text-center text-gray-900 font-semibold">Furnished</div>
                                                    <div className="col-start-3 text-xs text-center text-gray-900 font-semibold">Not Furnished</div>

                                                    {/* Washer */}
                                                    <div className="flex items-center text-gray-900 font-semibold">Washer</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.yard.washer === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.yard.washer === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>

                                                    {/* Dryer */}
                                                    <div className="flex items-center text-gray-900 font-semibold">Dryer</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.yard.dryer === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.yard.dryer === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>

                                                    {/* Lights */}
                                                    <div className="flex items-center text-gray-900 font-semibold">Lights</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.yard.lights === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.yard.lights === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col mb-8">
                                        <label className="text-slate-900 mb-2 font-medium" htmlFor="yard.other">Remarks</label>
                                        <span className="textarea">
                                            {formDetail.furnishing.yard.other ? formDetail.furnishing.yard.other : '-'}
                                        </span>
                                    </div>

                                    <hr className="mb-8" />

                                    <div className="card rounded-md mb-8">
                                        <div className="card-header px-4 rounded-t-md bg-gray-300 text-gray-900 font-bold">
                                            <h2 className="">Dining</h2>
                                        </div>
                                        <div className="card-body text-sm px-4">
                                            <div className="w-full">
                                                <div className="grid grid-cols-3 gap-4">
                                                    {/* Header Row */}
                                                    <div className="col-start-2 text-xs text-center text-gray-900 font-semibold">Furnished</div>
                                                    <div className="col-start-3 text-xs text-center text-gray-900 font-semibold">Not Furnished</div>

                                                    {/* Dining Table & Chairs */}
                                                    <div className="flex items-center text-gray-900 font-semibold">Dining table & chairs</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.dining.dining_table_chairs === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.dining.dining_table_chairs === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>

                                                    {/* Lights */}
                                                    <div className="flex items-center text-gray-900 font-semibold">Lights</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.dining.lights === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.dining.lights === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>

                                                    {/* Fan */}
                                                    <div className="flex items-center text-gray-900 font-semibold">Fan</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.dining.fan === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.dining.fan === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col mb-8">
                                        <label className="text-slate-900 mb-2 font-medium" htmlFor="dining.other">Remarks</label>
                                        <span className="textarea">
                                            {formDetail.furnishing.dining.other ? formDetail.furnishing.dining.other : '-'}
                                        </span>
                                    </div>

                                    <hr className="mb-8" />

                                    <div className="card rounded-md mb-8">
                                        <div className="card-header px-4 rounded-t-md bg-gray-300 text-gray-900 font-bold">
                                            <h2 className="">Living</h2>
                                        </div>
                                        <div className="card-body text-sm px-4">
                                            <div className="w-full">
                                                <div className="grid grid-cols-3 gap-4">
                                                    {/* Header Row */}
                                                    <div className="col-start-2 text-xs text-center text-gray-900 font-semibold">Furnished</div>
                                                    <div className="col-start-3 text-xs text-center text-gray-900 font-semibold">Not Furnished</div>

                                                    {/* Sofa */}
                                                    <div className="flex items-center text-gray-900 font-semibold">Sofa</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.living.sofa === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.living.sofa === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>

                                                    {/* Coffee Table */}
                                                    <div className="flex items-center text-gray-900 font-semibold">Coffee table</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.living.coffee_table === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.living.coffee_table === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>

                                                    {/* TV */}
                                                    <div className="flex items-center text-gray-900 font-semibold">TV</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.living.tv === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.living.tv === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>

                                                    {/* TV Cabinet */}
                                                    <div className="flex items-center text-gray-900 font-semibold">TV cabinet</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.living.tv_cabinet === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.living.tv_cabinet === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>

                                                    {/* Fan */}
                                                    <div className="flex items-center text-gray-900 font-semibold">Fan</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.living.fan === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.living.fan === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>

                                                    {/* Lights */}
                                                    <div className="flex items-center text-gray-900 font-semibold">Lights</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.living.lights === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.living.lights === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>

                                                    {/* AC */}
                                                    <div className="flex items-center text-gray-900 font-semibold">AC</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.living.ac === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.living.ac === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col mb-8">
                                        <label className="text-slate-900 mb-2 font-medium" htmlFor="living.other">Remarks</label>
                                        <span className="textarea">
                                            {formDetail.furnishing.living.other ? formDetail.furnishing.living.other : '-'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col mb-8">
                                    <span className="text-slate-400 font-medium">Attachments</span>

                                    {formDetail.attachments && Object.keys(formDetail.attachments).length > 0 ? (
                                        <ul>
                                            {Object.keys(formDetail.attachments).map((key) => {
                                                const attachment = formDetail.attachments[key];
                                                return (
                                                    <li key={key}>
                                                        {attachment.file_url ? (
                                                            <a href={(window.location.hostname === 'localhost' ? import.meta.env.VITE_BACKEND_URL_LOCAL : import.meta.env.VITE_BACKEND_URL_LN) + (attachment.file_url)} target="_blank" rel="noopener noreferrer" className="badge badge-lg mb-2">
                                                                {attachment.original_name}
                                                            </a>
                                                        ) : (
                                                            'No file available'
                                                        )}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    ) : (
                                        <p>No attachments found.</p>
                                    )}
                                </div>
                            </div>
                        </>
                        :
                        <div className="card-body flex flex-col items-center justify-center">
                            <img alt="image" className="dark:hidden max-h-[160px] mb-12" src="/public/media/illustrations/3.svg" />
                            <img alt="image" className="light:hidden max-h-[160px] mb-12" src="/public/media/illustrations/3-dark.svg" />
                            <span className="text-gray-800 text-lg font-semibold text-center">No Registration Form selected</span>
                        </div>
                    }
                </div>
            </div>
        </>
    );
}

export default EditOrder;