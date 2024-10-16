// src\pages\Order\CreateOrder.tsx

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchContact, fetchContacts, fetchProperties, fetchProperty, fetchQuotations, updateOrder } from '../../services/api';
import { Contact, Order, Property, Quotation } from '../../types';
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

    const [searchContactTerm, setSearchContactTerm] = useState('');
    const [searchPropertyTerm, setSearchPropertyTerm] = useState('');
    const [searchQuotationTerm, setSearchQuotationTerm] = useState('');
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [quotations, setQuotations] = useState<Quotation[]>([]);

    const inputContactRef = useRef(null);
    const inputPropertyRef = useRef(null);
    const inputQuotationRef = useRef(null);


    const { orderDetail, loading, error } = useFetchOrder(orderId);

    const [formData, setFormData] = useState({
        contactId: '',
        propertyId: '',
        quotationId: '',
        block: '',
        floor: '',
        unitNo: '',
        status: '',
    });

    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
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

        if (orderDetail) {

            setFormData({
                contactId: orderDetail.contact_id || '',
                propertyId: orderDetail.property_id || '',
                quotationId: orderDetail.latest_quotation.quotation_id || '',
                block: orderDetail.block || '',
                floor: orderDetail.floor || '',
                unitNo: orderDetail.unit_no || '',
                status: orderDetail.status || '',
            });

            const tmpEditOrder = {
                contactId: orderDetail.contact_id || '',
                propertyId: orderDetail.property_id || '',
                quotationId: orderDetail.latest_quotation.quotation_id || '',
                block: orderDetail.block || '',
                floor: orderDetail.floor || '',
                unitNo: orderDetail.unit_no || '',
                status: orderDetail.status || '',
            }

            localStorage.setItem('edit_order_data', JSON.stringify(tmpEditOrder));

            if (!localStorage.getItem('include_packages')) {
                localStorage.setItem('include_packages', JSON.parse(JSON.stringify(orderDetail.latest_quotation.metadata)));
            }


            if (orderDetail.contact_id) {
                handleSelectContactById(Number(orderDetail.contact_id));
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
            inputContactRef.current.focus();
            try {
                const data = await fetchContacts('', 6);
                setContacts(data.data);

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

    const handleBackClick = () => {
        localStorage.removeItem('edit_order_data');
        localStorage.removeItem('include_packages');
        localStorage.removeItem('selected_quotation_packages');
        navigate('/orders/' + orderId);
    };

    const handleSearchContact = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const term = event.target.value;
        setSearchContactTerm(term);

        try {
            const data = await fetchContacts(term, 6);
            setContacts(data.data);
        } catch (error) {
            console.error('Error fetching contacts:', error);
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

    const handleSelectContact = async (contact: Contact) => {
        setFormData((prev) => ({
            ...prev,
            contactId: contact.id,
        }));
        setSelectedContact(contact);
        setSearchContactTerm('');
        setContacts([]);
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

    const handleSelectContactById = async (id: number) => {
        try {
            const data = await fetchContact(id); // Assuming you have a similar fetch function

            setFormData((prev) => ({
                ...prev,
                contactyId: data.data.id,
            }));

            setSelectedContact(data.data);
            setSearchContactTerm('');
            setContacts([]);

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
                contact_id: selectedContact.id,
                property_id: selectedProperty.id,
                quotation_id: selectedQuotation.id,
                block: formData.block,
                floor: formData.floor,
                unit_no: formData.unitNo,
                description: '',
                metadata: JSON.parse(localStorage.getItem('include_packages')),
            }

            const response = await updateOrder(newOrder);

            if (response?.success) {
                notify('success', "Quotation Created Successfully!");
                navigate('/orders');
                console.log(response);
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

            <div className="flex flex-col flex-wrap gap-8 mb-8">
                <div className="card">
                    <div className="card-body">
                        <h2 className='text-xl mb-4 font-semibold text-gray-900'>Order</h2>
                        <div className="flex gap-8">
                            {/* Contact */}
                            <div className="flex flex-col flex-1 gap-2">
                                <span className="text-base font-semibold text-gray-900">
                                    1. Select a Contact
                                </span>
                                <div className="dropdown" data-dropdown="true" data-dropdown-trigger="click" id="contract_dropdown">
                                    <button className="dropdown-toggle btn btn-light w-full flex justify-between items-center">
                                        <span>Contact</span>
                                        <i className="ki-filled ki-down"></i>
                                    </button>
                                    <div className="dropdown-content w-full max-w-80">
                                        <div className="px-4 pt-4 text-sm text-gray-900 font-medium">
                                            <label className="input input-sm">
                                                <i className="ki-filled ki-magnifier"></i>
                                                <input
                                                    ref={inputContactRef}
                                                    placeholder="Search contact"
                                                    type="text"
                                                    value={searchContactTerm}
                                                    onChange={handleSearchContact}
                                                />
                                            </label>
                                        </div>
                                        <div className="menu menu-default flex flex-col w-full">
                                            {contacts.map((contact, index) => (
                                                <div className="menu-item" key={index} data-id={contact.id}>
                                                    <button
                                                        className="menu-link"
                                                        onClick={() => handleSelectContact(contact)}
                                                    >
                                                        <span className="menu-title">{contact.name}</span>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                {selectedContact && (
                                    <div className="card mb-4">
                                        <div className="card-body">
                                            <div className="flex flex-col gap-1 text-gray-900">
                                                <span className='text-sm font-semibold'>{selectedContact.name}</span>
                                                <span className='text-sm font-normal text-slate-400'>{selectedContact.email}</span>
                                                <span className='text-sm font-normal'>{selectedContact.phone_no}</span>
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
                                    <div className="dropdown" data-dropdown="true" data-dropdown-placement="bottom-end" data-dropdown-trigger="click">
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
                                    </div>
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
                                        Price: RM {selectedQuotation.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                                                    <i className="ki-outline ki-plus text-gray-600 text-2sm accordion-active:hidden block">
                                                    </i>
                                                    <i className="ki-outline ki-minus text-gray-600 text-2sm accordion-active:block hidden">
                                                    </i>
                                                </button>
                                                <div className="accordion-content active  border-t" id={"package_content_" + prodPackage.id.toString()}>
                                                    <div className="product-list flex flex-col">
                                                        <table className="table align-middle text-gray-700 font-medium text-sm">
                                                            <thead>
                                                                <tr>
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
            </div >

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
        </>
    );
}

export default EditOrder;