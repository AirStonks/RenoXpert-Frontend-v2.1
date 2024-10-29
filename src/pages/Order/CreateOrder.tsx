// src\pages\Order\CreateOrder.tsx

import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createOrder, fetchProperties, fetchProperty, fetchQuotation, fetchQuotations, fetchRegistrationForm, fetchUser, fetchUsers } from '../../services/api';
import { Order, OwnerRegistrationForm, Property, Quotation, User } from '../../types';
import { KTDropdown } from '../../metronic/core';
import { Package } from '../../types/index';
import { Link } from 'react-router-dom';
import { Slide, toast } from 'react-toastify';
import Loading from '../../components/Loading';

function CreateOrder() {
    const navigate = useNavigate();
    const location = useLocation();

    const queryParams = new URLSearchParams(location.search);
    const formId = queryParams.get('formId');

    const [searchUserTerm, setSearchUserTerm] = useState('');
    const [searchPropertyTerm, setSearchPropertyTerm] = useState('');
    const [searchQuotationTerm, setSearchQuotationTerm] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [formDetail, setFormDetail] = useState<OwnerRegistrationForm | null>(null);


    const [loading, setLoading] = useState(false);

    const inputUserRef = useRef(null);
    const inputPropertyRef = useRef(null);
    const inputQuotationRef = useRef(null);

    const [formData, setFormData] = useState({
        userId: '',
        propertyId: '',
        quotationId: '',
        totalAmount: 0,
        block: '',
        floor: '',
        unitNo: '',
        status: '',
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
        const sessionData = localStorage.getItem('create_order_data');

        if (formId) {
            handleSearchForm(formId);
        }

        if (sessionData) {

            const parsedSessionData = JSON.parse(sessionData);

            setFormData(parsedSessionData);

            if (parsedSessionData.userId) {
                handleSelectUserById(parsedSessionData.userId);
            }

            if (parsedSessionData.propertyId) {
                handleSelectPropertytById(parsedSessionData.propertyId);
            }

            if (parsedSessionData.quotationId) {
                handleSelectQuotationtById(parsedSessionData.quotationId);
            }

            if (parsedSessionData.totalAmount) {
                setFormData((prev) => ({
                    ...prev,
                    totalAmount: parsedSessionData.totalAmount,
                }));
            }

        }

        initDropdown();

    }, []);

    const initDropdown = async () => {
        const ownerEl = document.querySelector('#owner_dropdown') as HTMLElement;
        const ownerDropdown = KTDropdown.getInstance(ownerEl);

        const propertyEl = document.querySelector('#property_dropdown') as HTMLElement;
        const propertyDropdown = KTDropdown.getInstance(propertyEl);

        const quotationEl = document.querySelector('#quotation_dropdown') as HTMLElement;
        const quotationDropdown = KTDropdown.getInstance(quotationEl);

        ownerDropdown.on('shown', async () => {
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
            console.log('ysaydysd');

            inputQuotationRef.current.focus();
            try {
                const data = await fetchQuotations('', 6);
                setQuotations(data.data);

            } catch (error) {
                console.error('Failed to fetch quotations:', error);
            }
        });
    }

    const handleBackClick = () => {
        localStorage.removeItem('create_order_data');
        localStorage.removeItem('include_packages');
        localStorage.removeItem('selected_quotation_packages');
        navigate('/orders');
    };

    const handleSearchForm = async (formId: string) => {

        setLoading(true);

        try {
            const response = await fetchRegistrationForm(Number(formId)); // This returns AxiosResponse
            const registrationForm: OwnerRegistrationForm = response.data.data; // Extract the data

            if (registrationForm) {
                setFormDetail(registrationForm);

                // Fetch the associated user and property
                const userResponse = await fetchUser(Number(registrationForm.user.id));
                const user: User = userResponse.data;

                const propertyResponse = await fetchProperty(Number(registrationForm.property.id));
                const property: Property = propertyResponse.data;

                if (user) handleSelectUserById(Number(user.id));
                if (property) handleSelectPropertytById(Number(property.id));

                // // Update formData with the relevant fields
                setFormData((prevData) => ({
                    ...prevData,
                    block: registrationForm.property.block,
                    floor: registrationForm.property.level,
                    unitNo: registrationForm.property.unit,
                }));

                setLoading(false);

            } else {
                toast.error("Registration form not found");
            }

        } catch (error) {
            console.error("Error fetching registration form:", error);
            toast.error("Failed to fetch registration form");
        }
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
        localStorage.setItem('create_order_data', JSON.stringify(formData));
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
        localStorage.setItem('create_order_data', JSON.stringify(formData));
    };

    const handleSelectQuotation = async (quotation: Quotation) => {
        setFormData((prev) => ({
            ...prev,
            quotationId: quotation.id,
            totalAmount: quotation.total_amount,
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
            localStorage.setItem('create_order_data', JSON.stringify(formData));

        } catch (error) {
            console.error('Error fetching properties:', error);
        }
    };

    const handleSelectPropertytById = async (id: number) => {
        try {
            const data = await fetchProperty(id); // Assuming you have a similar fetch function

            if (data) {
                setFormData((prev) => ({
                    ...prev,
                    propertyId: data.data.id,
                }));
                setSelectedProperty(data.data);
                setSearchPropertyTerm('');
                setProperties([]);
                localStorage.setItem('create_order_data', JSON.stringify(formData));
            }

        } catch (error) {
            console.error('Error fetching properties:', error);
        }
    };

    const handleSelectQuotationtById = async (id: number) => {

        try {
            const data = await fetchQuotation(id); // Assuming you have a similar fetch function

            setFormData((prev) => ({
                ...prev,
                quotationId: data.data.id,
            }));
            setSelectedQuotation(data.data);
            setSearchQuotationTerm('');
            setQuotations([]);

            let storedPackages = localStorage.getItem('include_packages');

            if (!storedPackages) {
                localStorage.setItem('include_packages', JSON.stringify(data.data.metadata));

                storedPackages = JSON.stringify(data.data.metadata);
            }

            setSelectedPackages(JSON.parse(storedPackages));

        } catch (error) {
            console.error('Error fetching properties:', error);
        }

        // setFormData((prev) => ({
        //     ...prev,
        //     quotationId: quotation.id,
        // }));
        // setSelectedQuotation(quotation);
        // setSearchQuotationTerm('');
        // setQuotations([]);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = async () => {
        const newOrder: Order = {
            user_id: selectedUser.id,
            property_id: selectedProperty.id,
            quotation_id: selectedQuotation.id,
            total_amount: formData.totalAmount,
            block: formData.block,
            floor: formData.floor,
            unit_no: formData.unitNo,
            description: '',
            metadata: JSON.parse(localStorage.getItem('include_packages')),
        }

        console.log(newOrder);


        const response = await createOrder(newOrder);

        if (response?.success) {
            notify('success', "Order Created Successfully!");
            localStorage.removeItem('create_order_data');
            localStorage.removeItem('include_packages');
            localStorage.removeItem('selected_quotation_packages');
            navigate('/orders');
        } else {
            console.log(response);

        }
    }

    if (loading) return <Loading />

    return (
        <>
            <div className="flex justify-between items-center flex-wrap mb-6">
                <div className="flex gap-4 items-center">
                    <button className='text-gray-800 dark:text-gray-400' onClick={handleBackClick}>
                        <i className="ki-solid ki-arrow-left"></i>
                    </button>
                    <span className="text-2xl font-bold text-gray-900">
                        New Order
                    </span>
                </div>
            </div>

            <div className="flex grow flex-col gap-3 lg:gap-6 lg:mr-[360px] lg:px-6">
                <div className="div1 flex flex-col gap-8 mb-8">
                    <div className="card ">
                        <div className="card-body">
                            <h2 className='text-xl mb-4 font-semibold text-gray-900'>Order</h2>
                            <div className="flex gap-8">
                                {/* Owner */}
                                <div className="flex flex-col flex-1 gap-2">
                                    <span className="text-base font-semibold text-gray-900">
                                        1. Select an Owner
                                    </span>
                                    <div className="dropdown" data-dropdown="true" data-dropdown-trigger="click" id="owner_dropdown">
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
                                                        placeholder="Search Owner"
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
                                                    <span className='text-sm font-normal'>+60 {selectedUser.phone_no}</span>
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
                                    <span className="text-base font-semibold text-gray-900">
                                        3. Select a Quotation
                                    </span>
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
                                            to={'/orders/quotation/edit/' + selectedQuotation.id}
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
                                                                        <th className='w-[100px] text-center'>Include Product</th>
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
                                                                                RM {product.product_retail_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                            </td>
                                                                            <td className='text-center'>
                                                                                {!product.pivot.included
                                                                                    ? `- RM ${product.product_excluded_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                                                    : null}
                                                                            </td>
                                                                            <td className="text-center">
                                                                                {!product.pivot.included
                                                                                    ? null
                                                                                    : `RM ${(product.product_retail_price * product.pivot.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                                            </td>
                                                                            <td className='text-center'>
                                                                                <label className="switch flex justify-center">
                                                                                    <input
                                                                                        name="included"
                                                                                        type="checkbox"
                                                                                        checked={product.pivot.included}
                                                                                        readOnly
                                                                                    />
                                                                                </label>
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

                    <div className="flex justify-end gap-4">
                        <button className="btn btn-lg btn-light">
                            Cancel
                        </button>
                        <button
                            className="btn btn-lg btn-primary"
                            onClick={handleSubmit}
                        >
                            Create
                        </button>
                    </div>
                </div>
            </div>

            <div
                className="w-[340px] drawer drawer-start grow fixed z-1 top-20 lg:top-20 bottom-12 lg:bottom-12 lg:right-8 lg:left-auto lg:translate-x-0 lg:flex flex-col items-stretch shrink-0 bg-[#fefefe] dark:bg-coal-500"
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
                            <div className="card-body flex flex-col gap-6 text-gray-900 px-2 py-4">
                                <div className="flex flex-col">
                                    <span className="font-normal">What's your original number of rooms?</span>
                                    <span className="font-semibold">{formDetail.questions.quest_1}</span>
                                </div>

                                <div className="flex flex-col">
                                    <span className="font-normal">What's the number of bathroom?</span>
                                    <span className="font-semibold">{formDetail.questions.quest_2}</span>
                                </div>

                                <div className="flex flex-col">
                                    <span className="font-normal">Already Vacant Possessions (VP)?</span>
                                    <span className="font-semibold">{formDetail.questions.quest_3}</span>
                                </div>

                                <div className="flex flex-col">
                                    <span className="font-normal">Already collect key?</span>
                                    <span className="font-semibold">{formDetail.questions.quest_4}</span>
                                </div>

                                <div className="flex flex-col">
                                    <span className="font-normal">Already done defect inspection?</span>
                                    <span className="font-semibold">{formDetail.questions.quest_5}</span>
                                </div>

                                <div className="flex flex-col">
                                    <span className="font-normal">Already submit defect submission to MO?</span>
                                    <span className="font-semibold">{formDetail.questions.quest_6}</span>
                                </div>

                                <div className="flex flex-col">
                                    <span className="font-normal">MO has completed that defect rectification?</span>
                                    <span className="font-semibold">{formDetail.questions.quest_7}</span>
                                </div>

                                <div className="flex flex-col">
                                    <span className="font-normal">Do you want to add partition room to your unit?</span>
                                    <span className="font-semibold">{formDetail.questions.quest_8}</span>
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

export default CreateOrder;