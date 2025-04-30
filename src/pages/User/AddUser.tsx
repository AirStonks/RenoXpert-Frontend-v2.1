import { useNavigate } from "react-router-dom";
import { Slide, toast } from "react-toastify";
import { useEffect, useState } from "react";
import ClipboardJS from "clipboard";
import { User } from "../../types";
import { addUser } from "../../services/api";

interface ValidationErrors {
    name_first?: string[];
    name_last?: string[];
    email?: string[];
    phone?: string[];
    salutations?: string[];
    name_preferred?: string[];
    ic?: string[];
    address_1?: string[];
    address_2?: string[];
    city?: string[];
    state?: string[];
    postcode?: string[];
    'address.city'?: string[];
    'address.state'?: string[];
    [key: string]: string[] | undefined;
}

const roles = [
    { value: 'owner', label: 'Owner', description: 'Create an owner account' },
    { value: 'vendor', label: 'Vendor', description: 'Create a vendor account' },
    { value: 'technician', label: 'Technician', description: 'Create a technician account' },
]

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

const countryOptions = [
    { code: '60', name: 'Malaysia', flag: '/public/media/flags/malaysia.svg' },
    { code: '65', name: 'Singapore', flag: '/public/media/flags/singapore.svg' },
];

function AddUser() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: '',
        type: '',
        country_code: '60',
        phone: '',
        name_first: '',
        name_last: '',
        name_preferred: '',
        salutations: 'mr',
        ic: '',
        address: {
            address_1: '',
            address_2: '',
            city: '',
            state: '',
            postcode: '',
        },
    });
    const [isLoading, setIsLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
    const [success, setSuccess] = useState(false);

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
        navigate('/users');
    }

    useEffect(() => {
        document.title = "Add User | RenoXpert";

        const clipboard = new ClipboardJS('.copy-link');

        clipboard.on('success', function (e) {
            notify('success', 'Copied to clipboard!');
            e.clearSelection();
        });

        return () => {
            clipboard.destroy();
        };

    }, []);

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name.startsWith('address.')) {
            const key = name.split('.')[1];

            setFormData((prevData) => ({
                ...prevData,
                address: {
                    ...prevData.address,
                    [key]: value,
                },
            }));
        } else if (name === 'ic') {
            const formattedIC = formatICNumber(value);
            setFormData((prevData) => ({
                ...prevData,
                ic: formattedIC,
            }));

            // Clear error for IC field
            setValidationErrors((prevErrors) => ({
                ...prevErrors,
                ic: undefined, // or ic: [] to indicate no errors
            }));

            return;
        } else {
            setFormData((prevData) => ({
                ...prevData,
                [name]: value,
            }));
        }
    };

    const handleChangeCountryCode = (countryCode: string) => {
        setFormData((prevData) => ({
            ...prevData,
            country_code: countryCode
        }))
    }

    const handleReset = () => {
        setFormData({
            email: '',
            type: '',
            country_code: '60',
            phone: '',
            name_first: '',
            name_last: '',
            name_preferred: '',
            salutations: 'mr',
            ic: '',
            address: {
                address_1: '',
                address_2: '',
                city: '',
                state: '',
                postcode: '',
            },
        });
    };

    const handleSubmit = async () => {
        if (!formData.name_first || !formData.name_last || !formData.email || !formData.phone) {
            notify('error', 'Please fill in all fields.');
            return;
        }

        setIsLoading(true);
        setValidationErrors({}); // Reset previous errors
        try {
            let userData: User;

            if (formData.type === 'owner') {
                userData = {
                    name_first: formData.name_first,
                    name_last: formData.name_last,
                    name_preferred: formData.name_preferred,
                    salutations: formData.salutations,
                    ic: formData.ic,
                    email: formData.email,
                    type: formData.type,
                    country_code: formData.country_code,
                    phone_no: formData.phone,
                    address: {
                        address_1: formData.address.address_1,
                        address_2: formData.address.address_2,
                        city: formData.address.city,
                        state: formData.address.state,
                        postcode: formData.address.postcode,
                    },
                };
            } else {
                userData = {
                    name_first: formData.name_first,
                    name_last: formData.name_last,
                    email: formData.email,
                    country_code: formData.country_code,
                    type: formData.type,
                    phone_no: formData.phone,
                };
            }

            const response = await addUser(userData);

            if (response?.success) {

                notify('success', 'User Created Successfully!');

                if (formData.type === 'owner') {
                    console.log('yes');

                    setIsLoading(false);
                    navigate('/users/' + response.data.id);
                    return
                } else {

                    setFormData({
                        ...formData,
                        email: response.data[0].email
                    });

                    setSuccess(true);
                }
            } else {
                console.log(response.data);

                setValidationErrors(response.data);
            }

        } catch (error) {
            setValidationErrors(error.response?.data?.data);
        }

        setIsLoading(false);
    }

    return (
        <>
            <div className="flex justify-between items-center flex-wrap mb-6">
                <div className="flex gap-4 items-center">
                    <button className='text-gray-800 dark:text-gray-400' onClick={handleBackClick}>
                        <i className="ki-solid ki-arrow-left"></i>
                    </button>
                    <span className="text-2xl font-bold text-gray-900">Add User</span>
                </div>
            </div>

            {success ?
                <div className="flex flex-wrap gap-8 mb-8">
                    <div className="card w-full flex justify-center items-center">
                        <div className="card-body py-6 flex flex-col items-center max-w-3xl w-full">
                            <div className="flex flex-col mb-6 w-full">
                                <span className="text-2xl font-bold">
                                    Account Created Successfully
                                </span>

                            </div>
                            <div className="flex flex-col w-full">
                                <div className="flex badge text-sm badge-success badge-outline gap-2 items-center">
                                    <i className="ki-filled ki-information-2 text-warning text-lg" />
                                    <span className="">An email has been sent to associated email, please ask the user to check their email.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                :
                <div className="flex flex-wrap gap-8 mb-8">
                    <div className="card w-full flex justify-center items-center">
                        <div className="card-body py-6 flex flex-col items-center max-w-3xl w-full">
                            <div className="flex mb-4 w-full">
                                <span className="text-xl font-bold">User Detail</span>
                            </div>
                            <div className="flex mb-4 gap-4 w-full">
                                <div className="flex flex-col w-full">
                                    <label className='mb-2 text-sm font-medium text-gray-900'>First Name</label>
                                    <input
                                        className='input mb-2 w-full'
                                        placeholder='John'
                                        type='text'
                                        name='name_first'
                                        value={formData.name_first}
                                        onChange={handleChange}
                                    />
                                    {validationErrors.name_first && (
                                        <span className="text-red-500 text-sm">{validationErrors.name_first.join(', ')}</span>
                                    )}
                                </div>
                                <div className="flex flex-col w-full">
                                    <label className='mb-2 text-sm font-medium text-gray-900'>Last Name</label>
                                    <input
                                        className='input mb-2 w-full'
                                        placeholder='Doe'
                                        type='text'
                                        name='name_last'
                                        value={formData.name_last}
                                        onChange={handleChange}
                                    />
                                    {validationErrors.name_last && (
                                        <span className="text-red-500 text-sm">{validationErrors.name_last.join(', ')}</span>
                                    )}
                                </div>
                            </div>
                            {formData.type === 'owner' && (
                                <>
                                    <div className="flex flex-col mb-4 w-full">
                                        <label className='mb-2 text-sm font-medium text-gray-900'>Salutations</label>
                                        <div className="flex items-center mb-2">
                                            <select className={`select ${validationErrors.salutations ? 'border-danger' : ''}`} name="salutations" id="salutations" onChange={handleChange} value={formData?.salutations?.toLowerCase().replace(/\s+/g, '_')}>
                                                <option value="">Please Select</option>
                                                {salutationOptions.map(option => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        {validationErrors.salutations && (
                                            <span className="text-red-500 text-sm">{validationErrors.salutations.join(', ')}</span>
                                        )}
                                    </div>
                                    <div className="flex flex-col mb-4 w-full">
                                        <label className='mb-2 text-sm font-medium text-gray-900'>Preferred Name</label>
                                        <div className="flex items-center mb-2">
                                            <input
                                                className='input mr-2'
                                                type='text'
                                                name='name_preferred'
                                                value={formData.name_preferred}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        {validationErrors.name_preferred && (
                                            <span className="text-red-500 text-sm">{validationErrors.name_preferred.join(', ')}</span>
                                        )}
                                    </div>
                                </>
                            )}
                            <div className="flex flex-col mb-4 w-full">
                                <label className='mb-2 text-sm font-medium text-gray-900'>Email</label>
                                <div className="flex items-center mb-2">
                                    <input
                                        className='input mr-2'
                                        placeholder='email'
                                        type='text'
                                        name='email'
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>
                                {validationErrors.email && (
                                    <span className="text-red-500 text-sm">{validationErrors.email.join(', ')}</span>
                                )}
                            </div>
                            <div className="flex flex-col mb-4 w-full">
                                <label className='mb-2 text-sm font-medium text-gray-900'>Phone Number</label>

                                <div className="flex items-center mb-2">
                                    <div className="dropdown" data-dropdown="true" data-dropdown-trigger="click">
                                        <button className="dropdown-toggle btn btn-light mr-1">
                                            +{formData.country_code}
                                        </button>
                                        <div className="dropdown-content w-full max-w-56 py-2" data-dropdown-dismiss="true">
                                            <div className="menu menu-default flex flex-col w-full">
                                                {countryOptions.map((country) => (
                                                    <div className="menu-item">
                                                        <button
                                                            type='button'
                                                            className="menu-link flex items-center text-center"
                                                            onClick={() => handleChangeCountryCode(country.code)}
                                                        >
                                                            <span className="menu-icon">
                                                                <img alt="" className="inline-block size-4 rounded-full" src={country.flag} />
                                                            </span>
                                                            <span className="menu-title">
                                                                {country.name} (+{country.code})
                                                            </span>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <input
                                        className='input'
                                        placeholder='123456789'
                                        type='phone'
                                        name='phone'
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                </div>
                                {validationErrors.phone && (
                                    <span className="text-red-500 text-sm">{validationErrors.phone.join(', ')}</span>
                                )}
                            </div>

                            {formData.type === 'owner' && (
                                <>
                                    <div className="flex flex-col mb-4 w-full">
                                        <label className='mb-2 text-sm font-medium text-gray-900'>IC Number</label>
                                        <div className="flex items-center mb-2">
                                            <input
                                                className='input mr-2'
                                                placeholder="xxxxxx-xx-xxxx"
                                                type='text'
                                                name='ic'
                                                value={formData.ic}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        {validationErrors.ic && (
                                            <span className="text-red-500 text-sm">{validationErrors.ic.join(', ')}</span>
                                        )}
                                    </div>
                                    <div className="flex flex-col mb-4 w-full">
                                        <label className="text-slate-900 mb-2 font-medium" htmlFor="address_1">Owner current residence address</label>

                                        <div className="flex flex-col mb-8">
                                            <input
                                                className={`input ${validationErrors.address_1 ? 'border-danger' : ''}`}
                                                type="text"
                                                name="address.address_1"
                                                id="address_1"
                                                value={formData.address.address_1}
                                                onChange={handleChange}
                                            />
                                            <span className="text-slate-500 text-xs">Address Line 1</span>
                                            {validationErrors.address_1 && <span className="text-red-500 text-xs mt-2">{validationErrors.address_1}</span>}
                                        </div>

                                        <div className="flex flex-col mb-8">
                                            <input
                                                className="input"
                                                type="text"
                                                name="address.address_2"
                                                id="address_2"
                                                value={formData.address.address_2}
                                                onChange={handleChange}
                                            />
                                            <span className="text-slate-500 text-xs">Address Line 2 (optional)</span>
                                        </div>

                                        <div className="flex flex-col mb-8">
                                            <div className="flex gap-2 ">
                                                <div className="flex flex-col w-full">
                                                    <input
                                                        className={`input ${validationErrors.city ? 'border-danger' : ''}`}
                                                        type="text"
                                                        name="address.city"
                                                        id="city"
                                                        value={formData.address.city}
                                                        onChange={handleChange}
                                                    />
                                                    <span className="text-slate-500 text-xs">City</span>
                                                </div>
                                                <div className="flex flex-col w-full">
                                                    <input
                                                        className={`input ${validationErrors.state ? 'border-danger' : ''}`}
                                                        type="text"
                                                        name="address.state"
                                                        id="state"
                                                        value={formData.address.state}
                                                        onChange={handleChange}
                                                    />
                                                    <span className="text-slate-500 text-xs">State / Province</span>
                                                </div>
                                            </div>
                                            {(validationErrors['address.city'] || validationErrors['address.state']) &&
                                                <div className="mt-2 flex flex-col">
                                                    {validationErrors['address.city'] && <span className="text-red-500 text-xs">{validationErrors['address.city']}</span>}
                                                    {validationErrors['address.state'] && <span className="text-red-500 text-xs">{validationErrors['address.state']}</span>}
                                                </div>
                                            }
                                        </div>

                                        <div className="flex flex-col">
                                            <input
                                                className={`input ${validationErrors.postcode ? 'border-danger' : ''}`}
                                                type="text"
                                                name="address.postcode"
                                                id="postcode"
                                                value={formData.address.postcode}
                                                onChange={handleChange}
                                            />
                                            <span className="text-slate-500 text-xs">Postal / Zip Code</span>
                                            {validationErrors.postcode && <span className="text-red-500 text-xs mt-2">{validationErrors.postcode}</span>}
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="flex flex-col w-full">
                                <label className='mb-2 text-sm font-medium text-gray-900'>User Type/Role</label>
                                <div className="flex flex-col items-start gap-6">
                                    {roles.map((role, index) => (
                                        <label
                                            key={index}
                                            className={`form-label flex items-center gap-3`}
                                        >
                                            <input
                                                className="radio radio-sm"
                                                name="type"
                                                type="radio"
                                                value={role.value}
                                                onChange={handleChange}
                                            // Disable based on currentUser.type and the role being rendered
                                            // disabled={
                                            //     (currentUser?.type === 'super-admin' && role === 'super-admin') ||
                                            //     (currentUser?.type === 'admin' && (role === 'super-admin' || role === 'admin')) ||
                                            //     (currentUser?.type === 'staff')
                                            // }
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-sm">{role.label}</span>
                                                <span className="text-xs text-gray-500">{role.description}</span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button className="btn btn-secondary" onClick={handleReset}>Reset</button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleSubmit}
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            }
        </>
    )
}

export default AddUser;