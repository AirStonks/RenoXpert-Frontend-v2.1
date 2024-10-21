import { useEffect, useState } from "react";
import { fetchProperties, submitRegistrationForm } from "../../services/ownerApi";
import { Property } from "../../types";
import Loading from "../../components/Loading";
import { useNavigate } from "react-router-dom";
import KTComponent from "../../metronic/core";

interface FormData {
    salutations: string;
    name_first: string;
    name_last: string;
    name_preferred: string;
    email: string;
    country_code: string;
    phone_no: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    ic: string;
    property_name: string;
    block: string;
    level: string;
    unit: string;
    layout_type: string;
    sqft: string;
    quest_1: string;
    quest_2: string;
    quest_3: string;
    quest_4: string;
    quest_5: string;
    quest_6: string;
    quest_7: string;
    quest_8: string;
}

interface FormErrors {
    [key: string]: string | undefined; // Use string or undefined for error messages
}

const salutationOptions = [
    { value: 'mr', label: 'Mr' },
    { value: 'ms', label: 'Ms' },
    { value: 'mrs', label: 'Mrs' },
    { value: 'doctor', label: 'Doctor' },
    { value: 'datuk', label: 'Datuk' },
    { value: 'dato', label: 'Dato' },
    { value: 'datin', label: 'Datin' },
    { value: 'datuk_seri', label: 'Datuk Seri' },
    { value: 'dato_seri', label: 'Dato Seri' },
    { value: 'datin_seri', label: 'Datin Seri' },
];

const q1Options = [
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
    { value: '4', label: '4' },
    { value: '5', label: '5' },
];

const q2Options = [
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
];

const q3Options = [
    { value: 'done', label: 'Done' },
    { value: 'not_yet', label: 'Not Yet' },
];

const q4Options = [
    { value: 'done', label: 'Done' },
    { value: 'not_yet', label: 'Not Yet' },
];

const q5Options = [
    { value: 'done', label: 'Done' },
    { value: 'not_yet', label: 'Not Yet' },
];

const q6Options = [
    { value: 'done', label: 'Done' },
    { value: 'not_yet', label: 'Not Yet' },
    { value: 'in_progress', label: 'In Progress' },
];

const q7Options = [
    { value: 'done', label: 'Done' },
    { value: 'not_yet', label: 'Not Yet' },
    { value: 'no_defect', label: 'No Defect' },
];

const q8Options = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
];

const initialFormData: FormData = {
    salutations: 'mr',
    name_first: '',
    name_last: '',
    name_preferred: '',
    email: '',
    country_code: '+60',
    phone_no: '',
    address_1: '',
    address_2: '',
    city: '',
    state: '',
    postcode: '',
    ic: '',
    property_name: '',
    block: '',
    level: '',
    unit: '',
    layout_type: '',
    sqft: '',
    quest_1: '',
    quest_2: '',
    quest_3: '',
    quest_4: '',
    quest_5: '',
    quest_6: '',
    quest_7: '',
    quest_8: '',
};

function OwnerRegistrationForm() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [properties, setProperties] = useState<Property[] | null>(null);
    const [loading, setLoading] = useState<boolean>(true); // Loading state
    const [errors, setErrors] = useState<FormErrors>({});
    const [readyToSubmit, setReadyToSubmit] = useState<boolean>(false);

    useEffect(() => {
        KTComponent.init();
        getProperties();
    }, []);

    const getProperties = async () => {
        try {
            const response = await fetchProperties();

            if (response?.success) {
                setProperties(response.data);
            } else {
                console.log(response?.message);
            }

        } catch (error) {
            console.log(error);

        } finally {
            setLoading(false); // Set loading to false after fetching
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value
        }));
        setErrors((prevErrors) => ({
            ...prevErrors,
            [name]: ''
        }));
    };

    const validate = (): FormErrors => {
        const newErrors: FormErrors = {};
        if (!formData.salutations) newErrors.salutations = "Please select an option";
        if (!formData.name_first) newErrors.name_first = "First Name is required";
        if (!formData.name_last) newErrors.name_last = "Last Name is required";
        if (!formData.name_preferred) newErrors.name_preferred = "Preferred Name is required";
        if (!formData.email) newErrors.email = "Email is required";
        if (!formData.phone_no) newErrors.phone_no = "Phone Number is required";
        if (!formData.address_1) newErrors.address_1 = "Address Line 1 is required";
        if (!formData.city) newErrors.city = "City is required";
        if (!formData.state) newErrors.state = "State is required";
        if (!formData.postcode) newErrors.postcode = "Postal / Zip Code is required";
        if (!formData.ic) newErrors.ic = "IC/ID number is required";
        if (!formData.property_name) newErrors.property_name = "Please select an option";
        if (!formData.block) newErrors.block = "Block is required";
        if (!formData.level) newErrors.level = "Level is required";
        if (!formData.unit) newErrors.unit = "Unit is required";
        if (!formData.layout_type) newErrors.layout_type = "Layout Type is required";
        if (!formData.sqft) newErrors.sqft = "Sqft is required";
        if (!formData.quest_1) newErrors.quest_1 = "Please select an option";
        if (!formData.quest_2) newErrors.quest_2 = "Please select an option";
        if (!formData.quest_3) newErrors.quest_3 = "Please select an option";
        if (!formData.quest_4) newErrors.quest_4 = "Please select an option";
        if (!formData.quest_5) newErrors.quest_5 = "Please select an option";
        if (!formData.quest_6) newErrors.quest_6 = "Please select an option";
        if (!formData.quest_7) newErrors.quest_7 = "Please select an option";
        if (!formData.quest_8) newErrors.quest_8 = "Please select an option";

        return newErrors;
    };

    const handleResetForm = () => {
        setFormData(initialFormData);
        setErrors({});

        // Reset all select elements to their initial values
        const selectElements = document.querySelectorAll('select');
        selectElements.forEach((select: HTMLSelectElement) => {
            select.value = initialFormData[select.name as keyof FormData] || '';
        });
    };

    const handleReadyToSubmit = () => {
        const validationErrors = validate();

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' })
            setReadyToSubmit(true);
        }
    }

    const handleSubmit = async () => {
        const validationErrors = validate();

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        try {
            const response = await submitRegistrationForm(formData);

            if (response?.success) {
                console.log(response);
                navigate('/owner/reno-registration-form/success');
            } else {
                console.log('error');
            }

        } catch (error) {
            console.log(error);
        }
    };

    const getLabel = (value, options) => {
        return options.find(option => option.value === value)?.label || 'Unknown';
    };

    const getPropertyLabel = (id) => {
        return properties.find(property => Number(property.id) === Number(id))?.name || 'Unknown';
    }

    if (loading) return <Loading />;


    return (
        <main className="grow pt-5 items-center" id="content" role="content">
            <div className="flex flex-col items-center">
                <div className="container relative flex flex-col items-center justify-center" id="content_container">
                    <div className="flex flex-col flex-wrap gap-6 pb-28 justify-center items-center w-full max-w-4xl px-2">
                        <img className="default-logo min-h-[22px] h-[48px] max-w-none" src="/app/RenoExpert_logo-01.svg"></img>


                        {readyToSubmit ?
                            <div className="card w-full">
                                <div className="card-header py-2">
                                    <h2 className="text-slate-900 text-lg font-semibold">[Reno] Registration Form</h2>
                                </div>
                                <div className="card-body flex flex-col gap-6">
                                    <div className="flex badge badge-dark badge-lg font-bold py-4">
                                        <i className="ki-solid ki-information-3 pr-2 text-lg text-warning"></i>
                                        <span className="">Please check the information is key in correctly</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-normal">Salutations:</span>
                                        <span className="font-bold">{getLabel(formData.salutations, salutationOptions)}</span>
                                    </div>

                                    <div className="flex flex-col">
                                        <span className="font-normal">Name:</span>
                                        <span className="font-bold">{formData.name_first} {formData.name_last}</span>
                                    </div>

                                    <div className="flex flex-col">
                                        <span className="font-normal">Preferred Name:</span>
                                        <span className="font-bold">{formData.name_preferred}</span>
                                    </div>

                                    <div className="flex flex-col">
                                        <span className="font-normal">Email:</span>
                                        <span className="font-bold">{formData.email}</span>
                                    </div>

                                    <div className="flex flex-col">
                                        <span className="font-normal">Phone Number:</span>
                                        <span className="font-bold">{formData.country_code} {formData.phone_no}</span>
                                    </div>

                                    <div className="flex flex-col">
                                        <span className="font-normal">Current residence address:</span>
                                        <span className="font-bold">{formData.address_1}, {formData.address_2}, {formData.postcode}, {formData.city}, {formData.state}</span>
                                    </div>

                                    <div className="flex flex-col">
                                        <span className="font-normal">IC / ID number:</span>
                                        <span className="font-bold">{formData.ic}</span>
                                    </div>

                                    <div className="flex flex-col">
                                        <span className="font-normal">Property to be renovated:</span>
                                        <span className="font-bold">{getPropertyLabel(formData.property_name)}</span>
                                    </div>

                                    <div className="flex flex-col">
                                        <span className="font-normal">Unit:</span>
                                        <span className="font-bold">{formData.block}-{formData.level}-{formData.unit}</span>
                                    </div>

                                    <div className="flex flex-col">
                                        <span className="font-normal">Layout Type:</span>
                                        <span className="font-bold">{formData.layout_type}</span>
                                    </div>

                                    <div className="flex flex-col">
                                        <span className="font-normal">Sqft:</span>
                                        <span className="font-bold">{formData.sqft}</span>
                                    </div>

                                    <div className="flex flex-col">
                                        <span className="font-normal">What's your original number of rooms?</span>
                                        <span className="font-bold">{getLabel(formData.quest_1, q1Options)}</span>
                                    </div>

                                    <div className="flex flex-col">
                                        <span className="font-normal">What's the number of bathroom?</span>
                                        <span className="font-bold">{getLabel(formData.quest_2, q2Options)}</span>
                                    </div>

                                    <div className="flex flex-col">
                                        <span className="font-normal">Already Vacant Possessions (VP)?</span>
                                        <span className="font-bold">{getLabel(formData.quest_3, q3Options)}</span>
                                    </div>

                                    <div className="flex flex-col">
                                        <span className="font-normal">Already collect key?</span>
                                        <span className="font-bold">{getLabel(formData.quest_4, q4Options)}</span>
                                    </div>

                                    <div className="flex flex-col">
                                        <span className="font-normal">Already done defect inspection?</span>
                                        <span className="font-bold">{getLabel(formData.quest_5, q5Options)}</span>
                                    </div>

                                    <div className="flex flex-col">
                                        <span className="font-normal">Already submit defect submission to MO?</span>
                                        <span className="font-bold">{getLabel(formData.quest_6, q6Options)}</span>
                                    </div>

                                    <div className="flex flex-col">
                                        <span className="font-normal">MO has completed that defect rectification?</span>
                                        <span className="font-bold">{getLabel(formData.quest_7, q7Options)}</span>
                                    </div>

                                    <div className="flex flex-col">
                                        <span className="font-normal">Do you want to add partition room to your unit?</span>
                                        <span className="font-bold">{getLabel(formData.quest_8, q8Options)}</span>
                                    </div>
                                </div>
                            </div>
                            :
                            <div className="card w-full">
                                <div className="card-header py-2">
                                    <h2 className="text-slate-900 text-lg font-semibold">[Reno] Registration Form</h2>
                                </div>
                                <div className="card-body">
                                    <div className="flex flex-col mb-8">
                                        <label className="text-slate-900 mb-2 font-medium" htmlFor="salutations">Salutations</label>
                                        <select className={`select ${errors.salutations ? 'border-danger' : ''}`} name="salutations" id="salutations" onChange={handleChange} value={formData.salutations}>
                                            <option value="">Please Select</option>
                                            {salutationOptions.map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.salutations && <span className="text-red-500 text-xs mt-2">{errors.salutations}</span>}
                                    </div>

                                    <div className="flex flex-col mb-8">
                                        <label className="text-slate-900 mb-2 font-medium" htmlFor="name_f">Name</label>
                                        <div className="flex gap-2">
                                            <div className="flex flex-col w-full">
                                                <input className={`input ${errors.name_first ? 'border-danger' : ''}`} type="text" name="name_first" id="name_first" value={formData.name_first} onChange={handleChange} />
                                                <span className="text-slate-500 text-xs">First Name</span>
                                            </div>
                                            <div className="flex flex-col w-full">
                                                <input className={`input ${errors.name_last ? 'border-danger' : ''}`} type="text" name="name_last" id="name_last" value={formData.name_last} onChange={handleChange} />
                                                <span className="text-slate-500 text-xs">Last Name</span>
                                            </div>
                                        </div>
                                        {(errors.name_first || errors.name_last) &&
                                            <div className="mt-2 flex flex-col">
                                                {errors.name_first && <span className="text-red-500 text-xs">{errors.name_first}</span>}
                                                {errors.name_last && <span className="text-red-500 text-xs">{errors.name_last}</span>}
                                            </div>
                                        }
                                    </div>

                                    <div className="flex flex-col mb-8">
                                        <label className="text-slate-900 mb-2 font-medium" htmlFor="name_preferred">Preferred Name</label>
                                        <input className={`input ${errors.name_preferred ? 'border-danger' : ''}`} type="text" name="name_preferred" id="name_preferred" value={formData.name_preferred} onChange={handleChange} />
                                        {errors.name_preferred && <span className="text-red-500 text-xs mt-2">{errors.name_preferred}</span>}
                                    </div>

                                    <div className="flex flex-col mb-8">
                                        <div className="flex gap-2">
                                            <div className="flex flex-col w-full">
                                                <label className="text-slate-900 mb-2 font-medium" htmlFor="email">Email</label>
                                                <input className={`input ${errors.email ? 'border-danger' : ''}`} type="email" name="email" id="email" value={formData.email} onChange={handleChange} />
                                                <span className="text-slate-500 text-xs">example@example.com</span>
                                            </div>
                                            <div className="flex flex-col w-full">
                                                <label className="text-slate-900 mb-2 font-medium" htmlFor="phone_no">Phone Number</label>
                                                <div className="flex">
                                                    <div className="dropdown" data-dropdown="true" data-dropdown-trigger="click">
                                                        <button className="dropdown-toggle btn btn-light mr-1">
                                                            +60
                                                        </button>
                                                        <div className="dropdown-content w-full max-w-56 py-2">
                                                            <div className="menu menu-default flex flex-col w-full">
                                                                <div className="menu-item">
                                                                    <button type='button' className="menu-link flex items-center text-center">
                                                                        <span className="menu-icon">
                                                                            <img alt="" className="inline-block size-4 rounded-full" src="/public/media/flags/malaysia.svg" />
                                                                        </span>
                                                                        <span className="menu-title">
                                                                            Malaysia +(60)
                                                                        </span>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <input className={`input ${errors.phone_no ? 'border-danger' : ''}`} type="tel" name="phone_no" id="phone_no" value={formData.phone_no} onChange={handleChange} />
                                                </div>
                                                <span className="text-slate-500 text-xs">i.e: +(60) 123456789</span>
                                            </div>
                                        </div>

                                        {(errors.email || errors.phone_no) &&
                                            <div className="mt-2 flex flex-col">
                                                {errors.email && <span className="text-red-500 text-xs">{errors.email}</span>}
                                                {errors.phone_no && <span className="text-red-500 text-xs">{errors.phone_no}</span>}
                                            </div>
                                        }
                                    </div>

                                    <div className="flex flex-col mb-8">
                                        <label className="text-slate-900 mb-2 font-medium" htmlFor="address_1">Current residence address (information needed for renovation agreement purpose)</label>

                                        <div className="flex flex-col mb-8">
                                            <input className={`input ${errors.address_1 ? 'border-danger' : ''}`} type="text" name="address_1" id="address_1" value={formData.address_1} onChange={handleChange} />
                                            <span className="text-slate-500 text-xs">Address Line 1</span>
                                            {errors.address_1 && <span className="text-red-500 text-xs mt-2">{errors.address_1}</span>}
                                        </div>

                                        <div className="flex flex-col mb-8">
                                            <input className="input" type="text" name="address_2" id="address_2" value={formData.address_2} onChange={handleChange} />
                                            <span className="text-slate-500 text-xs">Address Line 2 (optional)</span>
                                        </div>

                                        <div className="flex flex-col mb-8">
                                            <div className="flex gap-2 ">
                                                <div className="flex flex-col w-full">
                                                    <input className={`input ${errors.city ? 'border-danger' : ''}`} type="text" name="city" id="city" value={formData.city} onChange={handleChange} />
                                                    <span className="text-slate-500 text-xs">City</span>
                                                </div>
                                                <div className="flex flex-col w-full">
                                                    <input className={`input ${errors.state ? 'border-danger' : ''}`} type="text" name="state" id="state" value={formData.state} onChange={handleChange} />
                                                    <span className="text-slate-500 text-xs">State / Province</span>
                                                </div>
                                            </div>
                                            {(errors.city || errors.state) &&
                                                <div className="mt-2 flex flex-col">
                                                    {errors.city && <span className="text-red-500 text-xs">{errors.city}</span>}
                                                    {errors.state && <span className="text-red-500 text-xs">{errors.state}</span>}
                                                </div>
                                            }
                                        </div>

                                        <div className="flex flex-col">
                                            <input className={`input ${errors.postcode ? 'border-danger' : ''}`} type="text" name="postcode" id="postcode" value={formData.postcode} onChange={handleChange} />
                                            <span className="text-slate-500 text-xs">Postal / Zip Code</span>
                                            {errors.postcode && <span className="text-red-500 text-xs mt-2">{errors.postcode}</span>}
                                        </div>
                                    </div>

                                    <div className="flex flex-col mb-8">
                                        <label className="text-slate-900 mb-2 font-medium" htmlFor="ic">IC / ID number (information needed for renovation agreement purpose)</label>
                                        <input className={`input ${errors.ic ? 'border-danger' : ''}`} type="text" name="ic" id="ic" value={formData.ic} onChange={handleChange} />
                                        {errors.ic && <span className="text-red-500 text-xs mt-2">{errors.ic}</span>}
                                    </div>

                                    <div className="flex flex-col mb-8">
                                        <label className="text-slate-900 mb-2 font-medium" htmlFor="property_name">Property to be renovated</label>
                                        <select className={`select ${errors.property_name ? 'border-danger' : ''}`} name="property_name" id="property_name" onChange={handleChange} value={formData.property_name}>
                                            <option value="">Please Select</option>
                                            {properties.map(property => (
                                                <option key={property.id} value={property.id}>
                                                    {property.name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.property_name && <span className="text-red-500 text-xs mt-2">{errors.property_name}</span>}
                                    </div>

                                    <div className="flex flex-col mb-8">
                                        <div className="flex gap-2 mb-2">
                                            <div className="flex flex-col w-full">
                                                <label className="text-slate-900 mb-2 font-medium" htmlFor="block">Block</label>
                                                <input className={`input ${errors.block ? 'border-danger' : ''}`} type="text" name="block" id="block" value={formData.block} onChange={handleChange} />
                                                <span className="text-slate-500 text-xs">i.e: A</span>
                                            </div>
                                            <div className="flex flex-col w-full">
                                                <label className="text-slate-900 mb-2 font-medium" htmlFor="level">Level</label>
                                                <input className={`input ${errors.level ? 'border-danger' : ''}`} type="text" name="level" id="level" value={formData.level} onChange={handleChange} />
                                                <span className="text-slate-500 text-xs">i.e: 12</span>
                                            </div>
                                            <div className="flex flex-col w-full">
                                                <label className="text-slate-900 mb-2 font-medium" htmlFor="unit">Unit</label>
                                                <input className={`input ${errors.unit ? 'border-danger' : ''}`} type="text" name="unit" id="unit" value={formData.unit} onChange={handleChange} />
                                                <span className="text-slate-500 text-xs">i.e: 01</span>
                                            </div>
                                        </div>
                                        <div className="flex">
                                            <span className="text-slate-500 text-xs">Full Unit i.e: A-12-01</span>
                                        </div>
                                        {(errors.block || errors.level || errors.unit) &&
                                            <div className="mt-2 flex flex-col">
                                                {errors.block && <span className="text-red-500 text-xs">{errors.block}</span>}
                                                {errors.level && <span className="text-red-500 text-xs">{errors.level}</span>}
                                                {errors.unit && <span className="text-red-500 text-xs">{errors.unit}</span>}
                                            </div>
                                        }
                                    </div>

                                    <div className="flex flex-col mb-8">
                                        <label className="text-slate-900 mb-2 font-medium" htmlFor="layout_type">Layout Type</label>
                                        <input className={`input ${errors.layout_type ? 'border-danger' : ''}`} type="text" name="layout_type" id="layout_type" value={formData.layout_type} onChange={handleChange} />
                                        {errors.layout_type && <span className="text-red-500 text-xs mt-2">{errors.layout_type}</span>}
                                    </div>

                                    <div className="flex flex-col mb-8">
                                        <label className="text-slate-900 mb-2 font-medium" htmlFor="sqft">Sqft</label>
                                        <input className={`input ${errors.sqft ? 'border-danger' : ''}`} type="text" name="sqft" id="sqft" value={formData.sqft} onChange={handleChange} />
                                        {errors.sqft && <span className="text-red-500 text-xs mt-2">{errors.sqft}</span>}
                                    </div>

                                    <div className="flex flex-col mb-8">
                                        <label className="text-slate-900 mb-2 font-medium" htmlFor="quest_1">What's your original number of rooms?</label>
                                        <select className={`select ${errors.quest_1 ? 'border-danger' : ''}`} name="quest_1" id="quest_1" onChange={handleChange} value={formData.quest_1}>
                                            <option value="">Please Select</option>
                                            {q1Options.map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.quest_1 && <span className="text-red-500 text-xs mt-2">{errors.quest_1}</span>}
                                    </div>

                                    <div className="flex flex-col mb-8">
                                        <label className="text-slate-900 mb-2 font-medium" htmlFor="quest_2">What's the number of bathroom?</label>
                                        <select className={`select ${errors.quest_2 ? 'border-danger' : ''}`} name="quest_2" id="quest_2" onChange={handleChange} value={formData.quest_2}>
                                            <option value="">Please Select</option>
                                            {q2Options.map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.quest_2 && <span className="text-red-500 text-xs mt-2">{errors.quest_2}</span>}
                                    </div>

                                    <div className="flex flex-col mb-8">
                                        <label className="text-slate-900 mb-2 font-medium" htmlFor="quest_3">Already Vacant Possessions (VP)?</label>
                                        <select className={`select ${errors.quest_3 ? 'border-danger' : ''}`} name="quest_3" id="quest_3" onChange={handleChange} value={formData.quest_3}>
                                            <option value="">Please Select</option>
                                            {q3Options.map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.quest_3 && <span className="text-red-500 text-xs mt-2">{errors.quest_3}</span>}
                                    </div>

                                    <div className="flex flex-col mb-8">
                                        <label className="text-slate-900 mb-2 font-medium" htmlFor="quest_4">Already collect key?</label>
                                        <select className={`select ${errors.quest_4 ? 'border-danger' : ''}`} name="quest_4" id="quest_4" onChange={handleChange} value={formData.quest_4}>
                                            <option value="">Please Select</option>
                                            {q4Options.map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.quest_4 && <span className="text-red-500 text-xs mt-2">{errors.quest_4}</span>}
                                    </div>

                                    <div className="flex flex-col mb-8">
                                        <label className="text-slate-900 mb-2 font-medium" htmlFor="quest_5">Already done defect inspection?</label>
                                        <select className={`select ${errors.quest_5 ? 'border-danger' : ''}`} name="quest_5" id="quest_5" onChange={handleChange} value={formData.quest_5}>
                                            <option value="">Please Select</option>
                                            {q5Options.map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.quest_5 && <span className="text-red-500 text-xs mt-2">{errors.quest_5}</span>}
                                    </div>

                                    <div className="flex flex-col mb-8">
                                        <label className="text-slate-900 mb-2 font-medium" htmlFor="quest_6">Already submit defect submission to MO?</label>
                                        <select className={`select ${errors.quest_6 ? 'border-danger' : ''}`} name="quest_6" id="quest_6" onChange={handleChange} value={formData.quest_6}>
                                            <option value="">Please Select</option>
                                            {q6Options.map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.quest_6 && <span className="text-red-500 text-xs mt-2">{errors.quest_6}</span>}
                                    </div>

                                    <div className="flex flex-col mb-8">
                                        <label className="text-slate-900 mb-2 font-medium" htmlFor="quest_7">MO has completed that defect rectification?</label>
                                        <select className={`select ${errors.quest_7 ? 'border-danger' : ''}`} name="quest_7" id="quest_7" onChange={handleChange} value={formData.quest_7}>
                                            <option value="">Please Select</option>
                                            {q7Options.map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.quest_7 && <span className="text-red-500 text-xs mt-2">{errors.quest_7}</span>}
                                    </div>

                                    <div className="flex flex-col mb-8">
                                        <label className="text-slate-900 mb-2 font-medium" htmlFor="quest_8">Do you want to add partition room to your unit?</label>
                                        <select className={`select ${errors.quest_8 ? 'border-danger' : ''}`} name="quest_8" id="quest_8" onChange={handleChange} value={formData.quest_8}>
                                            <option value="">Please Select</option>
                                            {q8Options.map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.quest_8 && <span className="text-red-500 text-xs mt-2">{errors.quest_8}</span>}
                                    </div>
                                </div>
                            </div>
                        }

                    </div>

                    <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2">
                        {readyToSubmit ?
                            <>
                                <button
                                    className="btn btn-lg btn-secondary rounded-3xl shadow-lg mr-4"
                                    onClick={() => {
                                        setReadyToSubmit(false);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                >
                                    Back
                                </button>

                                <button
                                    className="btn btn-lg btn-primary rounded-3xl shadow-lg"
                                    onClick={handleSubmit}
                                >
                                    Confirm
                                </button>
                            </>
                            :
                            <>
                                <button
                                    className="btn btn-lg btn-secondary rounded-3xl shadow-lg mr-4"
                                    onClick={handleResetForm}
                                >
                                    Reset
                                </button>

                                <button
                                    className="btn btn-lg btn-primary rounded-3xl shadow-lg"
                                    onClick={handleReadyToSubmit}
                                >
                                    Next
                                </button>
                            </>
                        }
                    </div>
                </div>
            </div>
        </main>
    )
}

export default OwnerRegistrationForm;