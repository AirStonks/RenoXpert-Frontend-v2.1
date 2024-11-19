import { useNavigate, useParams } from "react-router-dom";
import useFetchRegistrationForm from "../../hook/useFetchRegistrationForm";
import Loading from "../../components/Loading";
import { useEffect, useState } from "react";
import { OwnerRegistrationForm, Property } from "../../types";
import { fetchProperties, updateRegistrationForm } from "../../services/api";
import { Slide, toast } from "react-toastify";

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

const initialFormData: OwnerRegistrationForm = {
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
    other_property_name: '',
    block: '',
    level: '',
    unit: '',
    layout_type: '',
    sqft: '',
    questions: {
        quest_1: '',
        quest_2: '',
        quest_3: '',
        quest_4: '',
        quest_5: '',
        quest_6: '',
        quest_7: '',
        quest_8: '',
    },
    furnishing: {
        foyer_entrance: {
            grille_door: 'furnished',
            digital_lock: 'furnished',
            shoe_cabinet: 'furnished',
            lights: 'furnished',
            other: '',
        },
        kitchen: {
            kitchen_cabinet: 'furnished',
            kitchen_island: 'furnished',
            sink_tap: 'furnished',
            hood_hob: 'furnished',
            microwave: 'furnished',
            oven: 'furnished',
            water_dispenser: 'furnished',
            fridge: 'furnished',
            lights: 'furnished',
            other: '',
        },
        yard: {
            washer: 'furnished',
            dryer: 'furnished',
            lights: 'furnished',
            other: '',
        },
        dining: {
            dining_table_chairs: 'furnished',
            lights: 'furnished',
            fan: 'furnished',
            other: '',
        },
        living: {
            sofa: 'furnished',
            coffee_table: 'furnished',
            tv: 'furnished',
            tv_cabinet: 'furnished',
            fan: 'furnished',
            lights: 'furnished',
            ac: 'furnished',
            other: '',
        },
    }
};

function EditRegistrationForm() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const formId = id ? parseInt(id, 10) : null;

    const { formDetail, loading: fetchLoading, error } = useFetchRegistrationForm(formId, 'true');
    const [formData, setFormData] = useState<OwnerRegistrationForm | null>(null);
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState<boolean>(true); // Local loading state
    const [errors, setErrors] = useState<FormErrors>({});

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
        if (formDetail) {
            setFormData(formDetail);

            const updatedFormData = {
                ...formDetail,
                questions: JSON.parse(formDetail.metadata).questions,
                furnishing: JSON.parse(formDetail.metadata).furnishing,
            }

            setFormData(updatedFormData);

            getProperties();
        }
    }, [formDetail]);

    const getProperties = async () => {
        try {
            const response = await fetchProperties();

            if (response) {
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

    const formatICNumber = (value: string): string => {
        // Remove all non-digit characters
        const digits = value.replace(/\D/g, '');

        // Limit to 12 digits
        const truncated = digits.slice(0, 12);

        // Add hyphens according to format
        let formatted = '';
        if (truncated.length > 0) {
            // First 6 digits
            formatted += truncated.slice(0, 6);

            // Add first hyphen and next 2 digits
            if (truncated.length > 6) {
                formatted += '-' + truncated.slice(6, 8);

                // Add second hyphen and last 4 digits
                if (truncated.length > 8) {
                    formatted += '-' + truncated.slice(8);
                }
            }
        }

        return formatted;
    };

    const handleBackClick = () => {
        navigate('/registration-forms/' + formId);
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (name === 'ic') {
            const formattedIC = formatICNumber(value);
            setFormData((prevData) => ({
                ...prevData,
                ic: formattedIC,
            }));

            // Clear error for IC field
            setErrors((prevErrors) => ({
                ...prevErrors,
                ic: '',
            }));
            return;
        }

        // Check if the name starts with 'questions'
        if (name.startsWith('questions.')) {
            const property = name.split('.')[1]; // Get the specific question property

            // Update the questions state
            setFormData((prevData) => ({
                ...prevData,
                questions: {
                    ...prevData.questions,
                    [property]: value,
                },
            }));
        } else if (name.startsWith('furnishing.')) {
            const [furnish, category, property] = name.split('.');

            // Update the furnishing state
            setFormData((prevData) => ({
                ...prevData,
                furnishing: {
                    ...prevData.furnishing,
                    [category]: {
                        ...prevData.furnishing[category],
                        [property]: value,
                    },
                },
            }));
        } else {
            // Handle other input and select changes
            setFormData((prevData) => ({
                ...prevData,
                [name]: value,
            }));
        }

        // Clear errors for the updated field
        setErrors((prevErrors) => ({
            ...prevErrors,
            [name]: '',
        }));

        // Specific logic for 'property_name'
        if (name === 'property_name' && value !== 'other') {
            setFormData((prevData) => ({
                ...prevData,
                other_property_name: '',
            }));
            setErrors((prevErrors) => ({
                ...prevErrors,
                other_property_name: '',
            }));
        }
    };

    const handleOtherPropertyChange = (e) => {
        setFormData((prevData) => ({ ...prevData, other_property_name: e.target.value }));
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

        if (formData.property_name === 'other') {
            if (!formData.other_property_name) newErrors.other_property_name = "Please fill the the other property name";
        }

        return newErrors;
    };

    const handleSubmit = async () => {
        // console.log(formData);

        // const validationErrors = validate();

        // if (Object.keys(validationErrors).length > 0) {
        //     setErrors(validationErrors);
        //     return;
        // }

        try {
            const response = await updateRegistrationForm(formData);

            if (response?.success) {
                notify('success', 'Registration Form updated successfully');
                navigate('/registration-forms/' + formId);
            } else {
                console.log('error');
            }

        } catch (error) {
            console.log(error);
        }
    }

    const test = () => {
        console.log(formData);
    }

    if (fetchLoading || loading) return <Loading />;
    if (error) return <div>{error}</div>;
    if (!formDetail) return <div>An unexpected error occured</div>;

    return (
        <>
            <div className="flex justify-between items-center flex-wrap mb-6">
                <div className="flex gap-4 items-center">
                    <button className='text-gray-800 dark:text-gray-400' onClick={handleBackClick}>
                        <i className="ki-solid ki-arrow-left"></i>
                    </button>
                    <span className="text-2xl font-bold text-gray-900">
                        Edit Registration Form
                    </span>
                </div>
            </div>

            <div className="flex max-lg:flex-wrap gap-6 mb-6">
                <div className="card max-lg:w-full w-3/5">
                    <div className="card-body">
                        <div className="flex flex-col">
                            <div className="flex flex-col mb-8">
                                <label className="text-slate-900 mb-2 font-medium" htmlFor="salutations">Salutations</label>
                                <select className={`select ${errors.salutations ? 'border-danger' : ''}`} name="salutations" id="salutations" onChange={handleChange} value={formData?.salutations?.toLowerCase().replace(/\s+/g, '_')}>
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
                                        <input className={`input ${errors.name_first ? 'border-danger' : ''}`} type="text" name="name_first" id="name_first" value={formData?.name_first} onChange={handleChange} />
                                        <span className="text-slate-500 text-xs">First Name</span>
                                    </div>
                                    <div className="flex flex-col w-full">
                                        <input className={`input ${errors.name_last ? 'border-danger' : ''}`} type="text" name="name_last" id="name_last" value={formData?.name_last} onChange={handleChange} />
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
                                <input className={`input ${errors.name_preferred ? 'border-danger' : ''}`} type="text" name="name_preferred" id="name_preferred" value={formData?.name_preferred} onChange={handleChange} />
                                {errors.name_preferred && <span className="text-red-500 text-xs mt-2">{errors.name_preferred}</span>}
                            </div>

                            <div className="flex flex-col mb-8">
                                <div className="flex gap-2">
                                    <div className="flex flex-col w-full">
                                        <label className="text-slate-900 mb-2 font-medium" htmlFor="email">Email</label>
                                        <input className={`input ${errors.email ? 'border-danger' : ''}`} type="email" name="email" id="email" value={formData?.email} onChange={handleChange} />
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
                                            <input className={`input ${errors.phone_no ? 'border-danger' : ''}`} type="tel" name="phone_no" id="phone_no" value={formData?.phone_no} onChange={handleChange} />
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
                                    <input className={`input ${errors.address_1 ? 'border-danger' : ''}`} type="text" name="address_1" id="address_1" value={formData?.address_1} onChange={handleChange} />
                                    <span className="text-slate-500 text-xs">Address Line 1</span>
                                    {errors.address_1 && <span className="text-red-500 text-xs mt-2">{errors.address_1}</span>}
                                </div>

                                <div className="flex flex-col mb-8">
                                    <input className="input" type="text" name="address_2" id="address_2" value={formData?.address_2} onChange={handleChange} />
                                    <span className="text-slate-500 text-xs">Address Line 2 (optional)</span>
                                </div>

                                <div className="flex flex-col mb-8">
                                    <div className="flex gap-2 ">
                                        <div className="flex flex-col w-full">
                                            <input className={`input ${errors.city ? 'border-danger' : ''}`} type="text" name="city" id="city" value={formData?.city} onChange={handleChange} />
                                            <span className="text-slate-500 text-xs">City</span>
                                        </div>
                                        <div className="flex flex-col w-full">
                                            <input className={`input ${errors.state ? 'border-danger' : ''}`} type="text" name="state" id="state" value={formData?.state} onChange={handleChange} />
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
                                    <input className={`input ${errors.postcode ? 'border-danger' : ''}`} type="text" name="postcode" id="postcode" value={formData?.postcode} onChange={handleChange} />
                                    <span className="text-slate-500 text-xs">Postal / Zip Code</span>
                                    {errors.postcode && <span className="text-red-500 text-xs mt-2">{errors.postcode}</span>}
                                </div>
                            </div>

                            <div className="flex flex-col mb-8">
                                <label className="text-slate-900 mb-2 font-medium" htmlFor="ic">IC / ID number (information needed for renovation agreement purpose)</label>
                                <input className={`input ${errors.ic ? 'border-danger' : ''}`} type="text" name="ic" id="ic" value={formData?.ic} onChange={handleChange} />
                                {errors.ic && <span className="text-red-500 text-xs mt-2">{errors.ic}</span>}
                            </div>

                            <div className="flex flex-col mb-8">
                                <div className="flex gap-2 flex-wrap">
                                    <div className="flex flex-col flex-auto mb-6 md:mb-0">
                                        <label className="text-slate-900 mb-2 font-medium" htmlFor="property_name">Property to be renovated</label>
                                        <select className={`select ${errors.property_name ? 'border-danger' : ''}`} name="property_name" id="property_name" onChange={handleChange} value={formData?.property_name}>
                                            <option value="">Please Select</option>
                                            {properties.map(property => (
                                                <option key={property.id} value={property.id}>
                                                    {property.name}
                                                </option>
                                            ))}
                                            <option value="other">Other...</option>
                                        </select>
                                        {errors.property_name && <span className="text-red-500 text-xs mt-2">{errors.property_name}</span>}
                                    </div>
                                    {formData?.property_name === 'other' && (
                                        <div className="flex flex-col flex-auto">
                                            <label className="text-slate-900 mb-2 font-medium" htmlFor="other_property_name">
                                                Please specify other property
                                            </label>
                                            <input
                                                className={`input ${errors.other_property_name ? 'border-danger' : ''}`}
                                                type="text"
                                                name="other_property_name"
                                                id="other_property_name"
                                                value={formData.other_property_name}
                                                onChange={(e) => {
                                                    handleOtherPropertyChange(e);
                                                    handleChange(e);
                                                }}
                                            />
                                            {errors.other_property_name && <span className="text-red-500 text-xs mt-2">{errors.other_property_name}</span>}
                                        </div>
                                    )}
                                </div>
                                {formData.property_name === 'other' && (
                                    <div className="badge badge-dark mt-2 text-sm">Please make sure the property is available from database</div>
                                )}
                            </div>

                            <div className="flex flex-col mb-8">
                                <div className="flex gap-2 mb-2">
                                    <div className="flex flex-col w-full">
                                        <label className="text-slate-900 mb-2 font-medium" htmlFor="block">Block</label>
                                        <input className={`input ${errors.block ? 'border-danger' : ''}`} type="text" name="block" id="block" value={formData?.block} onChange={handleChange} />
                                        <span className="text-slate-500 text-xs">i.e: A</span>
                                    </div>
                                    <div className="flex flex-col w-full">
                                        <label className="text-slate-900 mb-2 font-medium" htmlFor="level">Level</label>
                                        <input className={`input ${errors.level ? 'border-danger' : ''}`} type="text" name="level" id="level" value={formData?.level} onChange={handleChange} />
                                        <span className="text-slate-500 text-xs">i.e: 12</span>
                                    </div>
                                    <div className="flex flex-col w-full">
                                        <label className="text-slate-900 mb-2 font-medium" htmlFor="unit">Unit</label>
                                        <input className={`input ${errors.unit ? 'border-danger' : ''}`} type="text" name="unit" id="unit" value={formData?.unit} onChange={handleChange} />
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
                                <input className={`input ${errors.layout_type ? 'border-danger' : ''}`} type="text" name="layout_type" id="layout_type" value={formData?.layout_type} onChange={handleChange} />
                                {errors.layout_type && <span className="text-red-500 text-xs mt-2">{errors.layout_type}</span>}
                            </div>

                            <div className="flex flex-col mb-8">
                                <label className="text-slate-900 mb-2 font-medium" htmlFor="sqft">Sqft</label>
                                <input className={`input ${errors.sqft ? 'border-danger' : ''}`} type="text" name="sqft" id="sqft" value={formData?.sqft} onChange={handleChange} />
                                {errors.sqft && <span className="text-red-500 text-xs mt-2">{errors.sqft}</span>}
                            </div>

                            <div className="flex flex-col">
                                <div className="flex flex-col mb-8">
                                    <label className="text-slate-900 mb-2 font-medium" htmlFor="quest_1">What's your original number of rooms?</label>
                                    <select className={`select ${errors.quest_1 ? 'border-danger' : ''}`} name="questions.quest_1" id="quest_1" onChange={handleChange} value={formData?.questions.quest_1}>
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
                                    <select className={`select ${errors.quest_2 ? 'border-danger' : ''}`} name="questions.quest_2" id="quest_2" onChange={handleChange} value={formData?.questions.quest_2}>
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
                                    <select className={`select ${errors.quest_3 ? 'border-danger' : ''}`} name="questions.quest_3" id="quest_3" onChange={handleChange} value={formData?.questions.quest_3}>
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
                                    <select className={`select ${errors.quest_4 ? 'border-danger' : ''}`} name="questions.quest_4" id="quest_4" onChange={handleChange} value={formData?.questions.quest_4}>
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
                                    <select className={`select ${errors.quest_5 ? 'border-danger' : ''}`} name="questions.quest_5" id="quest_5" onChange={handleChange} value={formData?.questions.quest_5}>
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
                                    <select className={`select ${errors.quest_6 ? 'border-danger' : ''}`} name="questions.quest_6" id="quest_6" onChange={handleChange} value={formData?.questions.quest_6}>
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
                                    <select className={`select ${errors.quest_7 ? 'border-danger' : ''}`} name="questions.quest_7" id="quest_7" onChange={handleChange} value={formData?.questions.quest_7}>
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
                                    <select className={`select ${errors.quest_8 ? 'border-danger' : ''}`} name="questions.quest_8" id="quest_8" onChange={handleChange} value={formData?.questions.quest_8}>
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
                    </div>
                </div>
                <div className="card max-lg:w-full w-2/5">
                    <div className="card-body">
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
                                                <input
                                                    type="radio"
                                                    name="furnishing.foyer_entrance.grille_door"
                                                    value="furnished"
                                                    checked={formData.furnishing.foyer_entrance.grille_door === 'furnished'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>
                                            <div className="flex justify-center items-center">
                                                <input
                                                    type="radio"
                                                    name="furnishing.foyer_entrance.grille_door"
                                                    value="not-furnish"
                                                    checked={formData.furnishing.foyer_entrance.grille_door === 'not-furnish'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>

                                            {/* Digital Lock */}
                                            <div className="flex items-center text-gray-900 font-semibold">Digital lock</div>
                                            <div className="flex justify-center items-center">
                                                <input
                                                    type="radio"
                                                    name="furnishing.foyer_entrance.digital_lock"
                                                    value="furnished"
                                                    checked={formData.furnishing.foyer_entrance.digital_lock === 'furnished'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>
                                            <div className="flex justify-center items-center">
                                                <input
                                                    type="radio"
                                                    name="furnishing.foyer_entrance.digital_lock"
                                                    value="not-furnish"
                                                    checked={formData.furnishing.foyer_entrance.digital_lock === 'not-furnish'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>

                                            {/* Shoe Cabinet */}
                                            <div className="flex items-center text-gray-900 font-semibold">Shoe cabinet</div>
                                            <div className="flex justify-center items-center">
                                                <input
                                                    type="radio"
                                                    name="furnishing.foyer_entrance.shoe_cabinet"
                                                    value="furnished"
                                                    checked={formData.furnishing.foyer_entrance.shoe_cabinet === 'furnished'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>
                                            <div className="flex justify-center items-center">
                                                <input
                                                    type="radio"
                                                    name="furnishing.foyer_entrance.shoe_cabinet"
                                                    value="not-furnish"
                                                    checked={formData.furnishing.foyer_entrance.shoe_cabinet === 'not-furnish'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>

                                            {/* Lights */}
                                            <div className="flex items-center text-gray-900 font-semibold">Lights</div>
                                            <div className="flex justify-center items-center">
                                                <input
                                                    type="radio"
                                                    name="furnishing.foyer_entrance.lights"
                                                    value="furnished"
                                                    checked={formData.furnishing.foyer_entrance.lights === 'furnished'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>
                                            <div className="flex justify-center items-center">
                                                <input
                                                    type="radio"
                                                    name="furnishing.foyer_entrance.lights"
                                                    value="not-furnish"
                                                    checked={formData.furnishing.foyer_entrance.lights === 'not-furnish'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col mb-8">
                                <label className="text-slate-900 mb-2 font-medium" htmlFor="furnishing.foyer_entrance.other">Please list any other items provided or include any remarks (if applicable)</label>
                                <textarea
                                    className="textarea"
                                    name="furnishing.foyer_entrance.other"
                                    id="furnishing.foyer_entrance.other"
                                    rows={5}
                                    onChange={handleChange}
                                    value={formData.furnishing.foyer_entrance.other || ''}
                                ></textarea>
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
                                                <input
                                                    type="radio"
                                                    name="furnishing.kitchen.kitchen_cabinet"
                                                    value="furnished"
                                                    checked={formData.furnishing.kitchen.kitchen_cabinet === 'furnished'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>
                                            <div className="flex justify-center items-center">
                                                <input
                                                    type="radio"
                                                    name="furnishing.kitchen.kitchen_cabinet"
                                                    value="not-furnish"
                                                    checked={formData.furnishing.kitchen.kitchen_cabinet === 'not-furnish'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>

                                            {/* Kitchen Island */}
                                            <div className="flex items-center text-gray-900 font-semibold">Kitchen island</div>
                                            <div className="flex justify-center items-center">
                                                <input
                                                    type="radio"
                                                    name="furnishing.kitchen.kitchen_island"
                                                    value="furnished"
                                                    checked={formData.furnishing.kitchen.kitchen_island === 'furnished'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>
                                            <div className="flex justify-center items-center">
                                                <input
                                                    type="radio"
                                                    name="furnishing.kitchen.kitchen_island"
                                                    value="not-furnish"
                                                    checked={formData.furnishing.kitchen.kitchen_island === 'not-furnish'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>

                                            {/* Sink & Tap */}
                                            <div className="flex items-center text-gray-900 font-semibold">Sink & tap</div>
                                            <div className="flex justify-center items-center">
                                                <input
                                                    type="radio"
                                                    name="furnishing.kitchen.sink_tap"
                                                    value="furnished"
                                                    checked={formData.furnishing.kitchen.sink_tap === 'furnished'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>
                                            <div className="flex justify-center items-center">
                                                <input
                                                    type="radio"
                                                    name="furnishing.kitchen.sink_tap"
                                                    value="not-furnish"
                                                    checked={formData.furnishing.kitchen.sink_tap === 'not-furnish'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>

                                            {/* Hood and Hob */}
                                            <div className="flex items-center text-gray-900 font-semibold">Hood and hob</div>
                                            <div className="flex justify-center items-center">
                                                <input
                                                    type="radio"
                                                    name="furnishing.kitchen.hood_hob"
                                                    value="furnished"
                                                    checked={formData.furnishing.kitchen.hood_hob === 'furnished'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>
                                            <div className="flex justify-center items-center">
                                                <input
                                                    type="radio"
                                                    name="furnishing.kitchen.hood_hob"
                                                    value="not-furnish"
                                                    checked={formData.furnishing.kitchen.hood_hob === 'not-furnish'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>

                                            {/* Microwave */}
                                            <div className="flex items-center text-gray-900 font-semibold">Microwave</div>
                                            <div className="flex justify-center items-center">
                                                <input
                                                    type="radio"
                                                    name="furnishing.kitchen.microwave"
                                                    value="furnished"
                                                    checked={formData.furnishing.kitchen.microwave === 'furnished'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>
                                            <div className="flex justify-center items-center">
                                                <input
                                                    type="radio"
                                                    name="furnishing.kitchen.microwave"
                                                    value="not-furnish"
                                                    checked={formData.furnishing.kitchen.microwave === 'not-furnish'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>

                                            {/* Oven */}
                                            <div className="flex items-center text-gray-900 font-semibold">Oven</div>
                                            <div className="flex justify-center items-center">
                                                <input
                                                    type="radio"
                                                    name="furnishing.kitchen.oven"
                                                    value="furnished"
                                                    checked={formData.furnishing.kitchen.oven === 'furnished'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>
                                            <div className="flex justify-center items-center">
                                                <input
                                                    type="radio"
                                                    name="furnishing.kitchen.oven"
                                                    value="not-furnish"
                                                    checked={formData.furnishing.kitchen.oven === 'not-furnish'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>

                                            {/* Water Dispenser / Water Purifier */}
                                            <div className="flex items-center text-gray-900 font-semibold">Water dispenser / water purifier</div>
                                            <div className="flex justify-center items-center">
                                                <input
                                                    type="radio"
                                                    name="furnishing.kitchen.water_dispenser"
                                                    value="furnished"
                                                    checked={formData.furnishing.kitchen.water_dispenser === 'furnished'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>
                                            <div className="flex justify-center items-center">
                                                <input
                                                    type="radio"
                                                    name="furnishing.kitchen.water_dispenser"
                                                    value="not-furnish"
                                                    checked={formData.furnishing.kitchen.water_dispenser === 'not-furnish'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>

                                            {/* Fridge */}
                                            <div className="flex items-center text-gray-900 font-semibold">Fridge</div>
                                            <div className="flex justify-center items-center">
                                                <input
                                                    type="radio"
                                                    name="furnishing.kitchen.fridge"
                                                    value="furnished"
                                                    checked={formData.furnishing.kitchen.fridge === 'furnished'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>
                                            <div className="flex justify-center items-center">
                                                <input
                                                    type="radio"
                                                    name="furnishing.kitchen.fridge"
                                                    value="not-furnish"
                                                    checked={formData.furnishing.kitchen.fridge === 'not-furnish'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>

                                            {/* Lights */}
                                            <div className="flex items-center text-gray-900 font-semibold">Lights</div>
                                            <div className="flex justify-center items-center">
                                                <input
                                                    type="radio"
                                                    name="furnishing.kitchen.lights"
                                                    value="furnished"
                                                    checked={formData.furnishing.kitchen.lights === 'furnished'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>
                                            <div className="flex justify-center items-center">
                                                <input
                                                    type="radio"
                                                    name="furnishing.kitchen.lights"
                                                    value="not-furnish"
                                                    checked={formData.furnishing.kitchen.lights === 'not-furnish'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col mb-8">
                                <label className="text-slate-900 mb-2 font-medium" htmlFor="kitchen.other">Please list any other items provided or include any remarks (if applicable)</label>
                                <textarea
                                    className="textarea"
                                    name="furnishing.kitchen.other"
                                    id="kitchen.other"
                                    rows={5}
                                    onChange={handleChange}
                                    value={formData.furnishing.kitchen.other || ''}
                                ></textarea>
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
                                                <input
                                                    type="radio"
                                                    name="furnishing.yard.washer"
                                                    value="furnished"
                                                    checked={formData.furnishing.yard.washer === 'furnished'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>
                                            <div className="flex justify-center items-center">
                                                <input
                                                    type="radio"
                                                    name="furnishing.yard.washer"
                                                    value="not-furnish"
                                                    checked={formData.furnishing.yard.washer === 'not-furnish'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>

                                            {/* Dryer */}
                                            <div className="flex items-center text-gray-900 font-semibold">Dryer</div>
                                            <div className="flex justify-center items-center">
                                                <input
                                                    type="radio"
                                                    name="furnishing.yard.dryer"
                                                    value="furnished"
                                                    checked={formData.furnishing.yard.dryer === 'furnished'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>
                                            <div className="flex justify-center items-center">
                                                <input
                                                    type="radio"
                                                    name="furnishing.yard.dryer"
                                                    value="not-furnish"
                                                    checked={formData.furnishing.yard.dryer === 'not-furnish'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>

                                            {/* Lights */}
                                            <div className="flex items-center text-gray-900 font-semibold">Lights</div>
                                            <div className="flex justify-center items-center">
                                                <input
                                                    type="radio"
                                                    name="furnishing.yard.lights"
                                                    value="furnished"
                                                    checked={formData.furnishing.yard.lights === 'furnished'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>
                                            <div className="flex justify-center items-center">
                                                <input
                                                    type="radio"
                                                    name="furnishing.yard.lights"
                                                    value="not-furnish"
                                                    checked={formData.furnishing.yard.lights === 'not-furnish'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col mb-8">
                                <label className="text-slate-900 mb-2 font-medium" htmlFor="yard.other">Please list any other items provided or include any remarks (if applicable)</label>
                                <textarea
                                    className="textarea"
                                    name="furnishing.yard.other"
                                    id="yard.other"
                                    rows={5}
                                    onChange={handleChange}
                                    value={formData.furnishing.yard.other || ''}
                                ></textarea>
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
                                                <input
                                                    type="radio"
                                                    name="furnishing.dining.dining_table_chairs"
                                                    value="furnished"
                                                    checked={formData.furnishing.dining.dining_table_chairs === 'furnished'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>
                                            <div className="flex justify-center items-center">
                                                <input
                                                    type="radio"
                                                    name="furnishing.dining.dining_table_chairs"
                                                    value="not-furnish"
                                                    checked={formData.furnishing.dining.dining_table_chairs === 'not-furnish'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>

                                            {/* Lights */}
                                            <div className="flex items-center text-gray-900 font-semibold">Lights</div>
                                            <div className="flex justify-center items-center">
                                                <input
                                                    type="radio"
                                                    name="furnishing.dining.lights"
                                                    value="furnished"
                                                    checked={formData.furnishing.dining.lights === 'furnished'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>
                                            <div className="flex justify-center items-center">
                                                <input
                                                    type="radio"
                                                    name="furnishing.dining.lights"
                                                    value="not-furnish"
                                                    checked={formData.furnishing.dining.lights === 'not-furnish'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>

                                            {/* Fan */}
                                            <div className="flex items-center text-gray-900 font-semibold">Fan</div>
                                            <div className="flex justify-center items-center">
                                                <input
                                                    type="radio"
                                                    name="furnishing.dining.fan"
                                                    value="furnished"
                                                    checked={formData.furnishing.dining.fan === 'furnished'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>
                                            <div className="flex justify-center items-center">
                                                <input
                                                    type="radio"
                                                    name="furnishing.dining.fan"
                                                    value="not-furnish"
                                                    checked={formData.furnishing.dining.fan === 'not-furnish'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col mb-8">
                                <label className="text-slate-900 mb-2 font-medium" htmlFor="dining.other">Please list any other items provided or include any remarks (if applicable)</label>
                                <textarea
                                    className="textarea"
                                    name="furnishing.dining.other"
                                    id="dining.other"
                                    rows={5}
                                    onChange={handleChange}
                                    value={formData.furnishing.dining.other || ''}
                                ></textarea>
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
                                                <input
                                                    type="radio"
                                                    name="furnishing.living.sofa"
                                                    value="furnished"
                                                    checked={formData.furnishing.living.sofa === 'furnished'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>
                                            <div className="flex justify-center items-center">
                                                <input
                                                    type="radio"
                                                    name="furnishing.living.sofa"
                                                    value="not-furnish"
                                                    checked={formData.furnishing.living.sofa === 'not-furnish'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>

                                            {/* Coffee Table */}
                                            <div className="flex items-center text-gray-900 font-semibold">Coffee table</div>
                                            <div className="flex justify-center items-center">
                                                <input
                                                    type="radio"
                                                    name="furnishing.living.coffee_table"
                                                    value="furnished"
                                                    checked={formData.furnishing.living.coffee_table === 'furnished'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>
                                            <div className="flex justify-center items-center">
                                                <input
                                                    type="radio"
                                                    name="furnishing.living.coffee_table"
                                                    value="not-furnish"
                                                    checked={formData.furnishing.living.coffee_table === 'not-furnish'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>

                                            {/* TV */}
                                            <div className="flex items-center text-gray-900 font-semibold">TV</div>
                                            <div className="flex justify-center items-center">
                                                <input
                                                    type="radio"
                                                    name="furnishing.living.tv"
                                                    value="furnished"
                                                    checked={formData.furnishing.living.tv === 'furnished'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>
                                            <div className="flex justify-center items-center">
                                                <input
                                                    type="radio"
                                                    name="furnishing.living.tv"
                                                    value="not-furnish"
                                                    checked={formData.furnishing.living.tv === 'not-furnish'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>

                                            {/* TV Cabinet */}
                                            <div className="flex items-center text-gray-900 font-semibold">TV cabinet</div>
                                            <div className="flex justify-center items-center">
                                                <input
                                                    type="radio"
                                                    name="furnishing.living.tv_cabinet"
                                                    value="furnished"
                                                    checked={formData.furnishing.living.tv_cabinet === 'furnished'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>
                                            <div className="flex justify-center items-center">
                                                <input
                                                    type="radio"
                                                    name="furnishing.living.tv_cabinet"
                                                    value="not-furnish"
                                                    checked={formData.furnishing.living.tv_cabinet === 'not-furnish'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>

                                            {/* Fan */}
                                            <div className="flex items-center text-gray-900 font-semibold">Fan</div>
                                            <div className="flex justify-center items-center">
                                                <input
                                                    type="radio"
                                                    name="furnishing.living.fan"
                                                    value="furnished"
                                                    checked={formData.furnishing.living.fan === 'furnished'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>
                                            <div className="flex justify-center items-center">
                                                <input
                                                    type="radio"
                                                    name="furnishing.living.fan"
                                                    value="not-furnish"
                                                    checked={formData.furnishing.living.fan === 'not-furnish'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>

                                            {/* Lights */}
                                            <div className="flex items-center text-gray-900 font-semibold">Lights</div>
                                            <div className="flex justify-center items-center">
                                                <input
                                                    type="radio"
                                                    name="furnishing.living.lights"
                                                    value="furnished"
                                                    checked={formData.furnishing.living.lights === 'furnished'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>
                                            <div className="flex justify-center items-center">
                                                <input
                                                    type="radio"
                                                    name="furnishing.living.lights"
                                                    value="not-furnish"
                                                    checked={formData.furnishing.living.lights === 'not-furnish'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>

                                            {/* AC */}
                                            <div className="flex items-center text-gray-900 font-semibold">AC</div>
                                            <div className="flex justify-center items-center">
                                                <input
                                                    type="radio"
                                                    name="furnishing.living.ac"
                                                    value="furnished"
                                                    checked={formData.furnishing.living.ac === 'furnished'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>
                                            <div className="flex justify-center items-center">
                                                <input
                                                    type="radio"
                                                    name="furnishing.living.ac"
                                                    value="not-furnish"
                                                    checked={formData.furnishing.living.ac === 'not-furnish'}
                                                    className="radio radio-lg h-4 w-4 text-blue-600"
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col mb-8">
                                <label className="text-slate-900 mb-2 font-medium" htmlFor="living.other">Please list any other items provided or include any remarks (if applicable)</label>
                                <textarea
                                    className="textarea"
                                    name="furnishing.living.other"
                                    id="living.other"
                                    rows={5}
                                    onChange={handleChange}
                                    value={formData.furnishing.living.other || ''}
                                >
                                </textarea>
                            </div>

                            <hr />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-2">
                <button className="btn btn-secondary">
                    Cancel
                </button>
                <button
                    className="btn btn-primary"
                    onClick={handleSubmit}
                >
                    Update
                </button>
            </div>
        </>
    );
}

export default EditRegistrationForm