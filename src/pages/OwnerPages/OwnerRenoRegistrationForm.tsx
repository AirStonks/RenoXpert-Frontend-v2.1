import React, { useEffect, useState } from "react";
import { submitRegistrationForm, userDetail } from "../../services/ownerApi";
import { OwnerRegistrationForm, Property, User } from "../../types";
import Loading from "../../components/Loading";
import { useNavigate } from "react-router-dom";
import KTComponent from "../../metronic/core";
import OTPVerifyPage from "../OTPVerifyPage";
import Resizer from 'react-image-file-resizer';
import { Slide, toast } from "react-toastify";
import { Link } from "react-router-dom";
import { getOwnerUser, getProperties } from "../../services/publicApi";
import axios from "axios";

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/owner/' : '/';

const MEDIA_URL =
    import.meta.env.VITE_APP_ENV === "local"
        ? '/public/media/'
        : '/media/';

const API_URL =
    import.meta.env.VITE_APP_ENV === "production"
        ? import.meta.env.VITE_API_URL
        : import.meta.env.VITE_APP_ENV === "staging"
            ? import.meta.env.VITE_STAGING_API_URL
            : import.meta.env.VITE_APP_ENV === "local"
                ? import.meta.env.VITE_LOCAL_API_URL
                : null;

type FurnishingCategory = 'foyer_entrance' | 'kitchen' | 'yard' | 'dining' | 'living' | 'bedrooms' | 'bathrooms';

interface FormErrors {
    [key: string]: string | undefined;
}

interface Option {
    value: string;
    label: string;
}

interface UploadedFile {
    id: number;
    file: File;
    previewUrl: string;
}

const countryOptions = [
    { code: '60', name: 'Malaysia', flag: MEDIA_URL + 'flags/malaysia.svg' },
    { code: '65', name: 'Singapore', flag: MEDIA_URL + 'flags/singapore.svg' },
];

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

const acceptedFileTypes = [
    'application/pdf', // pdf
    'application/msword', // doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
    'application/vnd.ms-excel', // xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
    'text/csv', // csv
    'text/plain', // txt
    'application/rtf', // rtf
    'text/html', // html
    'application/zip', // zip
    'audio/mpeg', // mp3
    'audio/x-ms-wma', // wma
    'video/mpeg', // mpg
    'video/x-flv', // flv
    'video/x-msvideo', // avi
    'image/jpeg', // jpg
    'image/jpeg', // jpeg
    'image/png', // png
    'image/gif' // gif
];

// Max file size in bytes (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 10;

const initialFormData: OwnerRegistrationForm = {
    salutations: 'mr',
    name_first: '',
    name_last: '',
    name_preferred: '',
    email: '',
    country_code: '60',
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
        quest_1: '1',
        quest_2: '1',
        quest_3: '',
        quest_4: '',
        quest_5: '',
        quest_6: '',
        quest_7: '',
        quest_8: '',
    },
    furnishing: {
        foyer_entrance: {
            grille_door: '',
            digital_lock: '',
            shoe_cabinet: '',
            lights: '',
            other: '',
        },
        kitchen: {
            kitchen_cabinet: '',
            kitchen_island: '',
            sink_tap: '',
            hood_hob: '',
            microwave: '',
            oven: '',
            water_dispenser: '',
            fridge: '',
            lights: '',
            other: '',
        },
        yard: {
            washer: '',
            dryer: '',
            lights: '',
            other: '',
        },
        dining: {
            dining_table_chairs: '',
            lights: '',
            fan: '',
            other: '',
        },
        living: {
            sofa: '',
            coffee_table: '',
            tv: '',
            tv_cabinet: '',
            fan: '',
            lights: '',
            ac: '',
            other: '',
        },
        bedrooms: {
            bedroom1: {
                bedframe: '',
                wardrobe: '',
                study_table: '',
                writing_chair: '',
                curtain: '',
                lights: '',
                fan: '',
                ac: '',
                other: '',
                remark: '',
            },
        },
        bathrooms: {
            bathroom1: {
                water_heater: '',
                bidet: '',
                mirror: '',
                shower_screen: '',
                lights: '',
                other: '',
                remark: '',
            },
        },
    }
};

function OwnerRenoRegistrationForm() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<OwnerRegistrationForm>(initialFormData);
    const [properties, setProperties] = useState<Property[] | null>(null);
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [owner, setOwner] = useState<User | null>(null);

    const [attachmentErr, setAttanhmentErr] = useState(null);

    const token = localStorage.getItem('o_token');

    const [loading, setLoading] = useState<boolean>(true); // Loading state
    const [errors, setErrors] = useState<FormErrors>({});
    const [readyToSubmit, setReadyToSubmit] = useState<boolean>(false);
    const [validateOtp, setValidateOtp] = useState<boolean>(false);

    const [otp, setOtp] = useState(['', '', '', '', '', '']);

    useEffect(() => {
        document.title = "Reno Registration Form | RenoXpert";
        KTComponent.init();
        getPropertiesSelection();
        checkOwnerExists();
    }, []);

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

    const checkOwnerExists = async () => {
        try {
            const response = await getOwnerUser();

            if (response.status === 401) {
                //
            } else {
                try {
                    const response: User = await userDetail();
                    setOwner(response);

                    setFormData((prevData) => ({
                        ...prevData,
                        name_first: response.name_first,
                        name_last: response.name_last,
                        name_preferred: response.name_preferred,
                        salutations: response.salutations,
                        email: response.email,
                        phone_no: response.phone_no,
                        ic: response.ic,

                        address_1: response.address.address_1,
                        address_2: response.address.address_2,
                        city: response.address.city,
                        state: response.address.state,
                        postcode: response.address.postcode,
                    }));

                } catch (error) {
                    console.error(error);
                } finally {
                    setLoading(false);
                }
            }
        } catch (error) {
            console.error(error);
        }

    };

    const getPropertiesSelection = async () => {
        try {
            const response = await getProperties();

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

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;

        // Special handling for IC input
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

        // Handle questions
        if (name.startsWith('questions.')) {
            const property = name.split('.')[1];
            setFormData((prevData) => ({
                ...prevData,
                questions: {
                    ...prevData.questions,
                    [property]: value,
                },
            }));
        } else if (name.startsWith('furnishing.')) {
            const parts = name.split('.');
            if (parts.length === 4) {
                const [, cat, room, q] = parts as [string, FurnishingCategory, string, string];
                if (cat === 'bedrooms' || cat === 'bathrooms') {
                    setFormData((prevData) => {
                        // Define specific types for bedrooms and bathrooms
                        type Bedroom = {
                            bedframe?: string;
                            wardrobe?: string;
                            study_table?: string;
                            writing_chair?: string;
                            curtain?: string;
                            lights?: string;
                            fan?: string;
                            ac?: string;
                            other?: string;
                            remark?: string;
                        };

                        type Bathroom = {
                            water_heater?: string;
                            bidet?: string;
                            mirror?: string;
                            shower_screen?: string;
                            lights?: string;
                            other?: string;
                            remark?: string;
                        };

                        // Use the appropriate type for the category
                        const currentCategory =
                            cat === 'bedrooms'
                                ? ((prevData.furnishing?.[cat] || {}) as Record<string, Bedroom>)
                                : ((prevData.furnishing?.[cat] || {}) as Record<string, Bathroom>);

                        return {
                            ...prevData,
                            furnishing: {
                                ...prevData.furnishing,
                                [cat]: {
                                    ...currentCategory,
                                    [room]: {
                                        ...(currentCategory[room] || {}),
                                        [q]: value,
                                    },
                                },
                            } as OwnerRegistrationForm['furnishing'],
                        };
                    });
                }
            } else if (parts.length === 3) {
                const [, category, property] = parts as [string, FurnishingCategory, string];
                setFormData((prevData) => ({
                    ...prevData,
                    furnishing: {
                        ...prevData.furnishing,
                        [category]: {
                            ...(prevData.furnishing?.[category] || {}),
                            [property]: value,
                        },
                    } as OwnerRegistrationForm['furnishing'],
                }));
            }
        } else {
            setFormData((prevData) => ({
                ...prevData,
                [name]: value,
            }));
        }

        // Clear errors for the field
        setErrors((prevErrors) => ({
            ...prevErrors,
            [name]: '',
        }));

        // Handle property_name logic
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

    const handleChangeCountryCode = (countryCode: string) => {
        setFormData((prevData) => ({
            ...prevData,
            country_code: countryCode
        }))
    }

    // Check if the file type is accepted
    const isAcceptedFileType = (type: string) => acceptedFileTypes.includes(type);

    // Handle file uploads
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {

        setAttanhmentErr(null);

        if (event.target.files) {
            // Check if the total number of files exceeds MAX_FILES
            if (files.length + event.target.files.length > MAX_FILES) {
                setAttanhmentErr(`You can upload a maximum of ${MAX_FILES} files.`);
                notify('error', `You can upload a maximum of ${MAX_FILES} files.`);
                return;
            }

            const newFiles: UploadedFile[] = [];

            for (let i = 0; i < event.target.files.length; i++) {
                const file = event.target.files[i];

                // Validate file type
                if (!isAcceptedFileType(file.type)) {
                    setAttanhmentErr(`File type not accepted: ${file.name}`);
                    notify('error', `File type not accepted: ${file.name}`);
                    continue; // Skip this file
                }

                // Validate file size
                if (file.size > MAX_FILE_SIZE) {
                    setAttanhmentErr(`File size exceeds 5MB: ${file.name}`);
                    notify('error', `File size exceeds 5MB: ${file.name}`);
                    continue; // Skip this file
                }

                let finalFile = file; // Default to the original file

                // Compress the file if it is an image
                if (isImage(file.type)) {
                    finalFile = await resizeFile(file);
                }

                newFiles.push({
                    id: Date.now() + i,
                    file: finalFile,
                    previewUrl: URL.createObjectURL(finalFile),
                });
            }

            setFiles((prevFiles) => [...prevFiles, ...newFiles]);
        }

        const fileInput = document.querySelector('input[name="attachments"]') as HTMLInputElement;

        if (fileInput) {
            fileInput.value = ''; // Clear the file input
        }
    };

    // Compress and resize image
    const resizeFile = (file: File) => new Promise<File>((resolve) => {
        Resizer.imageFileResizer(
            file,
            800, // Max width
            800, // Max height
            'JPEG', // Format
            70, // Quality
            0, // Rotation
            (uri: string) => {
                // Convert data URL to Blob and resolve
                fetch(uri)
                    .then((res) => res.blob())
                    .then((blob) => {
                        const newFile = new File([blob], file.name, { type: blob.type });
                        resolve(newFile);
                    });
            },
            'base64'
        );
    });

    // Format file size into KB or MB
    const formatFileSize = (size: number) => {
        const KB = 1024;
        const MB = KB * 1024;
        if (size >= MB) {
            return `${(size / MB).toFixed(2)} MB`;
        }
        return `${(size / KB).toFixed(2)} KB`;
    };

    // Handle file deletion
    const handleDelete = (id: number) => {
        setFiles((prevFiles) => prevFiles.filter((file) => file.id !== id));
        setAttanhmentErr(null);
    };

    const handleDeleteAll = () => {
        setFiles([]); // Clear the files array
        setAttanhmentErr(null); // Reset any attachment error
    };

    // Check if the file is an image
    const isImage = (fileType: string) => fileType.startsWith('image/');

    const validate = (): FormErrors => {
        const newErrors: FormErrors = {};
        if (!formData.salutations) newErrors.salutations = "Please select an option";
        if (!formData.name_first) newErrors.name_first = "First Name is required";
        if (!formData.name_last) newErrors.name_last = "Last Name is required";
        if (!formData.email) newErrors.email = "Email is required";
        if (!formData.phone_no) newErrors.phone_no = "Phone Number is required";
        if (!formData.address_1) newErrors.address_1 = "Address Line 1 is required";
        if (!formData.city) newErrors.city = "City is required";
        if (!formData.state) newErrors.state = "State is required";
        if (!formData.postcode) newErrors.postcode = "Postal / Zip Code is required";
        if (!formData.property_name) newErrors.property_name = "Please select an option";
        if (!formData.block) newErrors.block = "Block is required";
        if (!formData.level) newErrors.level = "Level is required";
        if (!formData.unit) newErrors.unit = "Unit is required";
        if (!formData.layout_type) newErrors.layout_type = "Layout Type is required";
        if (!formData.sqft) newErrors.sqft = "Sqft is required";
        if (!formData.questions.quest_3) newErrors.quest_3 = "Please select an option";
        if (!formData.questions.quest_4) newErrors.quest_4 = "Please select an option";
        if (!formData.questions.quest_5) newErrors.quest_5 = "Please select an option";
        if (!formData.questions.quest_6) newErrors.quest_6 = "Please select an option";
        if (!formData.questions.quest_7) newErrors.quest_7 = "Please select an option";
        if (!formData.questions.quest_8) newErrors.quest_8 = "Please select an option";
        if (!formData.furnishing.foyer_entrance.grille_door) newErrors.foyer_entrance = "Please fill in all";
        if (!formData.furnishing.foyer_entrance.digital_lock) newErrors.foyer_entrance = "Please fill in all";
        if (!formData.furnishing.foyer_entrance.lights) newErrors.foyer_entrance = "Please fill in all";
        if (!formData.furnishing.foyer_entrance.shoe_cabinet) newErrors.foyer_entrance = "Please fill in all";
        if (!formData.furnishing.kitchen.fridge) newErrors.kitchen = "Please fill in all";
        if (!formData.furnishing.kitchen.hood_hob) newErrors.kitchen = "Please fill in all";
        if (!formData.furnishing.kitchen.kitchen_cabinet) newErrors.kitchen = "Please fill in all";
        if (!formData.furnishing.kitchen.kitchen_island) newErrors.kitchen = "Please fill in all";
        if (!formData.furnishing.kitchen.lights) newErrors.kitchen = "Please fill in all";
        if (!formData.furnishing.kitchen.microwave) newErrors.kitchen = "Please fill in all";
        if (!formData.furnishing.kitchen.oven) newErrors.kitchen = "Please fill in all";
        if (!formData.furnishing.kitchen.sink_tap) newErrors.kitchen = "Please fill in all";
        if (!formData.furnishing.kitchen.water_dispenser) newErrors.kitchen = "Please fill in all";
        if (!formData.furnishing.yard.dryer) newErrors.yard = "Please fill in all";
        if (!formData.furnishing.yard.lights) newErrors.yard = "Please fill in all";
        if (!formData.furnishing.yard.washer) newErrors.yard = "Please fill in all";
        if (!formData.furnishing.dining.dining_table_chairs) newErrors.dining = "Please fill in all";
        if (!formData.furnishing.dining.fan) newErrors.dining = "Please fill in all";
        if (!formData.furnishing.dining.lights) newErrors.dining = "Please fill in all";
        if (!formData.furnishing.living.ac) newErrors.living = "Please fill in all";
        if (!formData.furnishing.living.coffee_table) newErrors.living = "Please fill in all";
        if (!formData.furnishing.living.fan) newErrors.living = "Please fill in all";
        if (!formData.furnishing.living.lights) newErrors.living = "Please fill in all";
        if (!formData.furnishing.living.sofa) newErrors.living = "Please fill in all";
        if (!formData.furnishing.living.tv) newErrors.living = "Please fill in all";
        if (!formData.furnishing.living.tv_cabinet) newErrors.living = "Please fill in all";

        if (formData.property_name === 'other') {
            if (!formData.other_property_name) newErrors.other_property_name = "Please fill the the other property name";
        }

        if (!formData.ic) {
            newErrors.ic = "IC number is required";
        } else {
            // Remove hyphens for validation
            const cleanIC = formData.ic.replace(/-/g, '');

            if (cleanIC.length !== 12) {
                newErrors.ic = "IC number must be 12 digits";
            } else {
                // Check the format using regex
                const icRegex = /^(\d{2})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])-(\d{2})-(\d{4})$/;

                if (!icRegex.test(formData.ic)) {
                    newErrors.ic = "Invalid IC Number format.";
                } else {
                    // Extract the date part
                    const [datePart] = formData.ic.split('-');
                    const year = parseInt(datePart.substring(0, 2));
                    const month = parseInt(datePart.substring(2, 4));
                    const day = parseInt(datePart.substring(4, 6));

                    // Validate days in month
                    const daysInMonth = new Date(2000, month, 0).getDate();
                    if (day > daysInMonth) {
                        newErrors.ic = "Invalid date in IC number";
                    }
                }
            }
        }

        // Dynamic bedroom validations
        // Dynamic bedroom validations
        if (formData.questions.quest_1) {
            const bedroomCount = Number(formData.questions.quest_1);

            for (let i = 1; i <= bedroomCount; i++) {
                const bedroomKey = `bedroom${i}`;
                const currentBedroom = formData.furnishing?.bedrooms?.[bedroomKey];

                if (currentBedroom) {
                    const bedroomErrors: { [key: string]: string } = {};

                    if (!currentBedroom.bedframe) bedroomErrors[bedroomKey] = 'Please fill in all';
                    if (!currentBedroom.wardrobe) bedroomErrors[bedroomKey] = 'Please fill in all';
                    if (!currentBedroom.study_table) bedroomErrors[bedroomKey] = 'Please fill in all';
                    if (!currentBedroom.writing_chair) bedroomErrors[bedroomKey] = 'Please fill in all';
                    if (!currentBedroom.curtain) bedroomErrors[bedroomKey] = 'Please fill in all';
                    if (!currentBedroom.lights) bedroomErrors[bedroomKey] = 'Please fill in all';
                    if (!currentBedroom.fan) bedroomErrors[bedroomKey] = 'Please fill in all';
                    if (!currentBedroom.ac) bedroomErrors[bedroomKey] = 'Please fill in all';
                    if (!currentBedroom.other) bedroomErrors[bedroomKey] = 'Please fill in all';

                    if (Object.keys(bedroomErrors).length > 0) {
                        newErrors[bedroomKey] = bedroomErrors[bedroomKey]; // string
                    }
                }
            }
        }

        // Dynamic bathroom validations
        if (formData.questions.quest_2) {
            const bathroomCount = Number(formData.questions.quest_2);

            for (let i = 1; i <= bathroomCount; i++) {
                const bathroomKey = `bathroom${i}`;
                const currentBathroom = formData.furnishing?.bathrooms?.[bathroomKey];

                if (currentBathroom) {
                    const bathroomErrors: { [key: string]: string } = {};

                    if (!currentBathroom.water_heater) bathroomErrors[bathroomKey] = 'Please fill in all';
                    if (!currentBathroom.bidet) bathroomErrors[bathroomKey] = 'Please fill in all';
                    if (!currentBathroom.mirror) bathroomErrors[bathroomKey] = 'Please fill in all';
                    if (!currentBathroom.shower_screen) bathroomErrors[bathroomKey] = 'Please fill in all';
                    if (!currentBathroom.lights) bathroomErrors[bathroomKey] = 'Please fill in all';
                    if (!currentBathroom.other) bathroomErrors[bathroomKey] = 'Please fill in all';

                    if (Object.keys(bathroomErrors).length > 0) {
                        newErrors[bathroomKey] = bathroomErrors[bathroomKey]; // string
                    }
                }
            }
        }

        if (Object.keys(newErrors).length > 0) {
            notify('error', 'Please check your form error.');
        }

        return newErrors;
    };

    const handleOtherPropertyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prevData) => ({ ...prevData, other_property_name: e.target.value }));
    };

    const handleDynamicBedroom = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { value } = e.target;
        const bedroomCount = parseInt(value);

        setErrors({});

        // Update the bathroom count and dynamically add/remove bedrooms in the form data
        setFormData((prevFormData) => {
            const updatedBedrooms = { ...prevFormData.furnishing?.bedrooms };

            // Add or remove bathroom fields based on the new count
            for (let i = 1; i <= bedroomCount; i++) {
                if (!updatedBedrooms[`bedroom${i}`]) {
                    // Add a new bathroom with empty questions (q1, q2, ..., q8)
                    updatedBedrooms[`bedroom${i}`] = {
                        bedframe: '',
                        wardrobe: '',
                        study_table: '',
                        writing_chair: '',
                        curtain: '',
                        lights: '',
                        fan: '',
                        ac: '',
                        other: '',
                        remark: '',
                    };
                }
            }

            // Remove bedrooms if the number is decreased
            Object.keys(updatedBedrooms).forEach((key) => {
                const bedroomNumber = parseInt(key.replace('bedroom', ''));
                if (bedroomNumber > bedroomCount) {
                    delete updatedBedrooms[key];
                }
            });

            // Return the updated formData
            return {
                ...prevFormData,
                furnishing: {
                    ...prevFormData.furnishing,
                    bedrooms: updatedBedrooms
                }
            };
        });
    }

    const handleDynamicBathroom = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { value } = e.target;
        const bathroomCount = parseInt(value);

        setErrors({});

        // Update the bathroom count and dynamically add/remove bathrooms in the form data
        setFormData((prevFormData) => {
            const updatedbathrooms = { ...prevFormData.furnishing?.bathrooms };

            // Add or remove bathroom fields based on the new count
            for (let i = 1; i <= bathroomCount; i++) {
                if (!updatedbathrooms[`bathroom${i}`]) {
                    // Add a new bathroom with empty questions (q1, q2, ..., q8)
                    updatedbathrooms[`bathroom${i}`] = {
                        water_heater: '',
                        bidet: '',
                        mirror: '',
                        shower_screen: '',
                        lights: '',
                        other: '',
                        remark: '',
                    };
                }
            }

            // Remove bathrooms if the number is decreased
            Object.keys(updatedbathrooms).forEach((key) => {
                const bathroomNumber = parseInt(key.replace('bathroom', ''));
                if (bathroomNumber > bathroomCount) {
                    delete updatedbathrooms[key];
                }
            });

            // Return the updated formData
            return {
                ...prevFormData,
                furnishing: {
                    ...prevFormData.furnishing,
                    bathrooms: updatedbathrooms
                }
            };
        });
    };

    const handleResetForm = () => {
        setFormData(initialFormData);
        setErrors({});
        handleDeleteAll();

        const selectElements = document.querySelectorAll('select');
        selectElements.forEach((select: HTMLSelectElement) => {
            const name = select.name as keyof OwnerRegistrationForm;
            const value = initialFormData[name];
            if (typeof value === 'string') {
                select.value = value || '';
            }
        });

        const fileInput = document.querySelector('input[name="attachments"]') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }

        if (owner) {
            setFormData((prevData) => ({
                ...prevData,
                name_first: owner.name_first,
                name_last: owner.name_last,
                name_preferred: owner.name_preferred,
                salutations: owner.salutations,
                email: owner.email,
                phone_no: owner.phone_no,
            }));
        }
    };

    const handleReadyToSubmit = () => {
        const validationErrors = validate();

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            notify('error', 'Please check your form error.');
            return;
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' })
            setReadyToSubmit(true);
        }
    }

    const handleConfirmForm = async () => {
        setValidateOtp(true);
    }

    const handleSubmit = async (mobile: string, otp: string[]) => {
        const validationErrors = validate();
        const formDataToSend = new FormData();
        const code = otp.join('');

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            notify('error', 'Please check your form error.');
            return;
        }

        // Check for missing inputs
        if (!owner) {
            if (otp.some(digit => digit === '')) {
                return; // Stop submission if there are missing inputs
            }
        }

        try {
            const requestBody = {
                mobile: mobile,
                otp_code: code
            };

            const res = await axios.post(`${API_URL}sms-otp/verify`, requestBody);

            if (res.data.status === 'verified') {
                notify('success', 'OTP has been verified successfully.');

                // Iterate over formData keys with proper typing
                (Object.keys(formData) as Array<keyof OwnerRegistrationForm>).forEach((key) => {
                    const value = formData[key];
                    if (value !== undefined && value !== null) {
                        formDataToSend.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
                    }
                });

                // Append files to the FormData
                files.forEach((file) => {
                    formDataToSend.append('attachments[]', file.file);
                });

                try {
                    const response = await submitRegistrationForm(formDataToSend);

                    if (response?.success) {
                        navigate(LOCAL_PATH_PREFIX + 'reno-registration-form/success');
                    } else {
                        console.log('error');
                    }
                } catch (error) {
                    console.log(error);
                }
            } else {
                notify('error', 'Invalid OTP');
            }
        } catch (error) {
            notify('error', 'Invalid OTP');
        }
    };

    const getLabel = (value: string | number, options: Option[]) => {
        return options.find(option => option.value === String(value))?.label || 'Unknown';
    };

    const getPropertyLabel = (propertyName: string) => {
        if (propertyName === 'other') {
            return "(Other) " + formData.other_property_name;
        }

        return properties?.find(property => property.id === propertyName)?.name || 'Unknown';
    };

    if (loading) return <Loading />;

    return (
        <main className="grow pt-5 items-center" id="content" role="content">
            <div className="flex flex-col items-center">
                <div className="container relative flex flex-col items-center justify-center" id="content_container">
                    <div className="flex flex-col flex-wrap gap-6 pb-40 justify-center items-center w-full max-w-4xl px-2">
                        <img className="default-logo min-h-[22px] h-[48px] max-w-none" src="/app/RenoExpert_logo-01.svg"></img>

                        {readyToSubmit ?
                            validateOtp ?
                                <OTPVerifyPage
                                    mobile={formData.phone_no}
                                    countryCode={formData.country_code}
                                    handleSubmit={handleSubmit}
                                    otp={otp}
                                    setOtp={setOtp} // Pass down the setter function
                                />
                                :
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
                                            <span className="font-bold">+{formData.country_code} {formData.phone_no}</span>
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
                                            <span className="font-bold">{getLabel(formData.questions.quest_1, q1Options)}</span>
                                        </div>

                                        <div className="flex flex-col">
                                            <span className="font-normal">What's the number of bathroom?</span>
                                            <span className="font-bold">{getLabel(formData.questions.quest_2, q2Options)}</span>
                                        </div>

                                        <div className="flex flex-col">
                                            <span className="font-normal">Already Vacant Possessions (VP)?</span>
                                            <span className="font-bold">{getLabel(formData.questions.quest_3, q3Options)}</span>
                                        </div>

                                        <div className="flex flex-col">
                                            <span className="font-normal">Already collect key?</span>
                                            <span className="font-bold">{getLabel(formData.questions.quest_4, q4Options)}</span>
                                        </div>

                                        <div className="flex flex-col">
                                            <span className="font-normal">Already done defect inspection?</span>
                                            <span className="font-bold">{getLabel(formData.questions.quest_5, q5Options)}</span>
                                        </div>

                                        <div className="flex flex-col">
                                            <span className="font-normal">Already submit defect submission to MO?</span>
                                            <span className="font-bold">{getLabel(formData.questions.quest_6, q6Options)}</span>
                                        </div>

                                        <div className="flex flex-col">
                                            <span className="font-normal">MO has completed that defect rectification?</span>
                                            <span className="font-bold">{getLabel(formData.questions.quest_7, q7Options)}</span>
                                        </div>

                                        <div className="flex flex-col">
                                            <span className="font-normal">Do you want to add partition room to your unit?</span>
                                            <span className="font-bold">{getLabel(formData.questions.quest_8, q8Options)}</span>
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
                                                                {formData.furnishing.foyer_entrance.grille_door === 'furnished' &&
                                                                    <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                }
                                                            </div>
                                                            <div className="flex justify-center items-center">
                                                                {formData.furnishing.foyer_entrance.grille_door === 'not-furnish' &&
                                                                    <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                                }
                                                            </div>

                                                            {/* Digital Lock */}
                                                            <div className="flex items-center text-gray-900 font-semibold">Digital lock</div>
                                                            <div className="flex justify-center items-center">
                                                                {formData.furnishing.foyer_entrance.digital_lock === 'furnished' &&
                                                                    <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                }
                                                            </div>
                                                            <div className="flex justify-center items-center">
                                                                {formData.furnishing.foyer_entrance.digital_lock === 'not-furnish' &&
                                                                    <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                                }
                                                            </div>

                                                            {/* Shoe Cabinet */}
                                                            <div className="flex items-center text-gray-900 font-semibold">Shoe cabinet</div>
                                                            <div className="flex justify-center items-center">
                                                                {formData.furnishing.foyer_entrance.shoe_cabinet === 'furnished' &&
                                                                    <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                }
                                                            </div>
                                                            <div className="flex justify-center items-center">
                                                                {formData.furnishing.foyer_entrance.shoe_cabinet === 'not-furnish' &&
                                                                    <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                                }
                                                            </div>

                                                            {/* Lights */}
                                                            <div className="flex items-center text-gray-900 font-semibold">Lights</div>
                                                            <div className="flex justify-center items-center">
                                                                {formData.furnishing.foyer_entrance.lights === 'furnished' &&
                                                                    <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                }
                                                            </div>
                                                            <div className="flex justify-center items-center">
                                                                {formData.furnishing.foyer_entrance.lights === 'not-furnish' &&
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
                                                    {formData.furnishing.foyer_entrance.other ? formData.furnishing.foyer_entrance.other : '-'}
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
                                                                {formData.furnishing.kitchen.kitchen_cabinet === 'furnished' &&
                                                                    <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                }
                                                            </div>
                                                            <div className="flex justify-center items-center">
                                                                {formData.furnishing.kitchen.kitchen_cabinet === 'not-furnish' &&
                                                                    <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                                }
                                                            </div>

                                                            {/* Kitchen Island */}
                                                            <div className="flex items-center text-gray-900 font-semibold">Kitchen island</div>
                                                            <div className="flex justify-center items-center">
                                                                {formData.furnishing.kitchen.kitchen_island === 'furnished' &&
                                                                    <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                }
                                                            </div>
                                                            <div className="flex justify-center items-center">
                                                                {formData.furnishing.kitchen.kitchen_island === 'not-furnish' &&
                                                                    <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                                }
                                                            </div>

                                                            {/* Sink & Tap */}
                                                            <div className="flex items-center text-gray-900 font-semibold">Sink & tap</div>
                                                            <div className="flex justify-center items-center">
                                                                {formData.furnishing.kitchen.sink_tap === 'furnished' &&
                                                                    <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                }
                                                            </div>
                                                            <div className="flex justify-center items-center">
                                                                {formData.furnishing.kitchen.sink_tap === 'not-furnish' &&
                                                                    <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                                }
                                                            </div>

                                                            {/* Hood and Hob */}
                                                            <div className="flex items-center text-gray-900 font-semibold">Hood and hob</div>
                                                            <div className="flex justify-center items-center">
                                                                {formData.furnishing.kitchen.hood_hob === 'furnished' &&
                                                                    <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                }
                                                            </div>
                                                            <div className="flex justify-center items-center">
                                                                {formData.furnishing.kitchen.hood_hob === 'not-furnish' &&
                                                                    <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                                }
                                                            </div>

                                                            {/* Microwave */}
                                                            <div className="flex items-center text-gray-900 font-semibold">Microwave</div>
                                                            <div className="flex justify-center items-center">
                                                                {formData.furnishing.kitchen.microwave === 'furnished' &&
                                                                    <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                }
                                                            </div>
                                                            <div className="flex justify-center items-center">
                                                                {formData.furnishing.kitchen.microwave === 'not-furnish' &&
                                                                    <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                                }
                                                            </div>

                                                            {/* Oven */}
                                                            <div className="flex items-center text-gray-900 font-semibold">Oven</div>
                                                            <div className="flex justify-center items-center">
                                                                {formData.furnishing.kitchen.oven === 'furnished' &&
                                                                    <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                }
                                                            </div>
                                                            <div className="flex justify-center items-center">
                                                                {formData.furnishing.kitchen.oven === 'not-furnish' &&
                                                                    <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                                }
                                                            </div>

                                                            {/* Water Dispenser / Water Purifier */}
                                                            <div className="flex items-center text-gray-900 font-semibold">Water dispenser / water purifier</div>
                                                            <div className="flex justify-center items-center">
                                                                {formData.furnishing.kitchen.water_dispenser === 'furnished' &&
                                                                    <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                }
                                                            </div>
                                                            <div className="flex justify-center items-center">
                                                                {formData.furnishing.kitchen.water_dispenser === 'not-furnish' &&
                                                                    <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                                }
                                                            </div>

                                                            {/* Fridge */}
                                                            <div className="flex items-center text-gray-900 font-semibold">Fridge</div>
                                                            <div className="flex justify-center items-center">
                                                                {formData.furnishing.kitchen.fridge === 'furnished' &&
                                                                    <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                }
                                                            </div>
                                                            <div className="flex justify-center items-center">
                                                                {formData.furnishing.kitchen.fridge === 'not-furnish' &&
                                                                    <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                                }
                                                            </div>

                                                            {/* Lights */}
                                                            <div className="flex items-center text-gray-900 font-semibold">Lights</div>
                                                            <div className="flex justify-center items-center">
                                                                {formData.furnishing.kitchen.lights === 'furnished' &&
                                                                    <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                }
                                                            </div>
                                                            <div className="flex justify-center items-center">
                                                                {formData.furnishing.kitchen.lights === 'not-furnish' &&
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
                                                    {formData.furnishing.kitchen.other ? formData.furnishing.kitchen.other : '-'}
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
                                                                {formData.furnishing.yard.washer === 'furnished' &&
                                                                    <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                }
                                                            </div>
                                                            <div className="flex justify-center items-center">
                                                                {formData.furnishing.yard.washer === 'not-furnish' &&
                                                                    <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                                }
                                                            </div>

                                                            {/* Dryer */}
                                                            <div className="flex items-center text-gray-900 font-semibold">Dryer</div>
                                                            <div className="flex justify-center items-center">
                                                                {formData.furnishing.yard.dryer === 'furnished' &&
                                                                    <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                }
                                                            </div>
                                                            <div className="flex justify-center items-center">
                                                                {formData.furnishing.yard.dryer === 'not-furnish' &&
                                                                    <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                                }
                                                            </div>

                                                            {/* Lights */}
                                                            <div className="flex items-center text-gray-900 font-semibold">Lights</div>
                                                            <div className="flex justify-center items-center">
                                                                {formData.furnishing.yard.lights === 'furnished' &&
                                                                    <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                }
                                                            </div>
                                                            <div className="flex justify-center items-center">
                                                                {formData.furnishing.yard.lights === 'not-furnish' &&
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
                                                    {formData.furnishing.yard.other ? formData.furnishing.yard.other : '-'}
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
                                                                {formData.furnishing.dining.dining_table_chairs === 'furnished' &&
                                                                    <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                }
                                                            </div>
                                                            <div className="flex justify-center items-center">
                                                                {formData.furnishing.dining.dining_table_chairs === 'not-furnish' &&
                                                                    <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                                }
                                                            </div>

                                                            {/* Lights */}
                                                            <div className="flex items-center text-gray-900 font-semibold">Lights</div>
                                                            <div className="flex justify-center items-center">
                                                                {formData.furnishing.dining.lights === 'furnished' &&
                                                                    <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                }
                                                            </div>
                                                            <div className="flex justify-center items-center">
                                                                {formData.furnishing.dining.lights === 'not-furnish' &&
                                                                    <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                                }
                                                            </div>

                                                            {/* Fan */}
                                                            <div className="flex items-center text-gray-900 font-semibold">Fan</div>
                                                            <div className="flex justify-center items-center">
                                                                {formData.furnishing.dining.fan === 'furnished' &&
                                                                    <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                }
                                                            </div>
                                                            <div className="flex justify-center items-center">
                                                                {formData.furnishing.dining.fan === 'not-furnish' &&
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
                                                    {formData.furnishing.dining.other ? formData.furnishing.dining.other : '-'}
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
                                                                {formData.furnishing.living.sofa === 'furnished' &&
                                                                    <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                }
                                                            </div>
                                                            <div className="flex justify-center items-center">
                                                                {formData.furnishing.living.sofa === 'not-furnish' &&
                                                                    <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                                }
                                                            </div>

                                                            {/* Coffee Table */}
                                                            <div className="flex items-center text-gray-900 font-semibold">Coffee table</div>
                                                            <div className="flex justify-center items-center">
                                                                {formData.furnishing.living.coffee_table === 'furnished' &&
                                                                    <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                }
                                                            </div>
                                                            <div className="flex justify-center items-center">
                                                                {formData.furnishing.living.coffee_table === 'not-furnish' &&
                                                                    <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                                }
                                                            </div>

                                                            {/* TV */}
                                                            <div className="flex items-center text-gray-900 font-semibold">TV</div>
                                                            <div className="flex justify-center items-center">
                                                                {formData.furnishing.living.tv === 'furnished' &&
                                                                    <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                }
                                                            </div>
                                                            <div className="flex justify-center items-center">
                                                                {formData.furnishing.living.tv === 'not-furnish' &&
                                                                    <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                                }
                                                            </div>

                                                            {/* TV Cabinet */}
                                                            <div className="flex items-center text-gray-900 font-semibold">TV cabinet</div>
                                                            <div className="flex justify-center items-center">
                                                                {formData.furnishing.living.tv_cabinet === 'furnished' &&
                                                                    <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                }
                                                            </div>
                                                            <div className="flex justify-center items-center">
                                                                {formData.furnishing.living.tv_cabinet === 'not-furnish' &&
                                                                    <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                                }
                                                            </div>

                                                            {/* Fan */}
                                                            <div className="flex items-center text-gray-900 font-semibold">Fan</div>
                                                            <div className="flex justify-center items-center">
                                                                {formData.furnishing.living.fan === 'furnished' &&
                                                                    <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                }
                                                            </div>
                                                            <div className="flex justify-center items-center">
                                                                {formData.furnishing.living.fan === 'not-furnish' &&
                                                                    <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                                }
                                                            </div>

                                                            {/* Lights */}
                                                            <div className="flex items-center text-gray-900 font-semibold">Lights</div>
                                                            <div className="flex justify-center items-center">
                                                                {formData.furnishing.living.lights === 'furnished' &&
                                                                    <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                }
                                                            </div>
                                                            <div className="flex justify-center items-center">
                                                                {formData.furnishing.living.lights === 'not-furnish' &&
                                                                    <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                                }
                                                            </div>

                                                            {/* AC */}
                                                            <div className="flex items-center text-gray-900 font-semibold">AC</div>
                                                            <div className="flex justify-center items-center">
                                                                {formData.furnishing.living.ac === 'furnished' &&
                                                                    <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                }
                                                            </div>
                                                            <div className="flex justify-center items-center">
                                                                {formData.furnishing.living.ac === 'not-furnish' &&
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
                                                    {formData.furnishing.living.other ? formData.furnishing.living.other : '-'}
                                                </span>
                                            </div>

                                            <hr />

                                            <div className="flex flex-col mb-8">
                                                {files.length > 0 && (
                                                    <div className="mt-4">
                                                        <h4 className="text-lg font-medium">Uploaded Files</h4>
                                                        <ul className="mt-2 space-y-2">
                                                            {files.map((uploadedFile) => (
                                                                <div className="flex flex-col" key={uploadedFile.id}>
                                                                    <div className="flex items-center space-x-4 mb-4">
                                                                        <div className="flex justify-center items-center w-16 h-16 bg-gray-100 rounded">
                                                                            {/* Check if file is an image, otherwise show an icon */}
                                                                            {isImage(uploadedFile.file.type) ? (
                                                                                <a
                                                                                    href={uploadedFile.previewUrl}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                >
                                                                                    <img
                                                                                        src={uploadedFile.previewUrl}
                                                                                        alt={uploadedFile.file.name} // Use file name as alt text
                                                                                        className="h-16 w-16 object-cover"
                                                                                    />
                                                                                </a>
                                                                            ) : (
                                                                                <i className="ki-filled ki-files text-4xl"></i> // Icon for non-image files
                                                                            )}
                                                                        </div>
                                                                        <div className="flex-1 flex flex-col">
                                                                            {/* Display file name and size */}
                                                                            <span className="text-slate-700">{uploadedFile.file.name}</span>
                                                                            <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                                                <span>{formatFileSize(uploadedFile.file.size)}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <hr />
                                                                </div>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>

                                            {Object.keys(formData.furnishing.bedrooms || {}).map((bedroomKey) => {

                                                const bedroom = formData.furnishing.bedrooms[bedroomKey];

                                                return (
                                                    <React.Fragment key={bedroomKey}>
                                                        <hr className="mb-8" />

                                                        <div className="card rounded-md mb-8">
                                                            <div className="card-header px-4 rounded-t-md bg-gray-300 text-gray-900 font-bold">
                                                                <h2 className="">{bedroomKey.charAt(0).toUpperCase() + bedroomKey.slice(1)}</h2>
                                                            </div>
                                                            <div className="card-body text-sm px-4">
                                                                <div className="w-full">
                                                                    <div className="grid grid-cols-3 gap-4">
                                                                        {/* Header Row */}
                                                                        <div className="col-start-2 text-xs text-center text-gray-900 font-semibold">Furnished</div>
                                                                        <div className="col-start-3 text-xs text-center text-gray-900 font-semibold">Not Furnished</div>

                                                                        {/* Bedframe */}
                                                                        <div className="flex items-center text-gray-900 font-semibold">Bedframe</div>
                                                                        <div className="flex justify-center items-center">
                                                                            {bedroom.bedframe === 'furnished' &&
                                                                                <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                            }
                                                                        </div>
                                                                        <div className="flex justify-center items-center">
                                                                            {bedroom.bedframe === 'not-furnish' &&
                                                                                <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                                            }
                                                                        </div>

                                                                        {/* Wardrobe */}
                                                                        <div className="flex items-center text-gray-900 font-semibold">Wardrobe</div>
                                                                        <div className="flex justify-center items-center">
                                                                            {bedroom.wardrobe === 'furnished' &&
                                                                                <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                            }
                                                                        </div>
                                                                        <div className="flex justify-center items-center">
                                                                            {bedroom.wardrobe === 'not-furnish' &&
                                                                                <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                                            }
                                                                        </div>

                                                                        {/* Study Table */}
                                                                        <div className="flex items-center text-gray-900 font-semibold">Study Table</div>
                                                                        <div className="flex justify-center items-center">
                                                                            {bedroom.study_table === 'furnished' &&
                                                                                <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                            }
                                                                        </div>
                                                                        <div className="flex justify-center items-center">
                                                                            {bedroom.study_table === 'not-furnish' &&
                                                                                <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                                            }
                                                                        </div>

                                                                        {/* Writing Chair */}
                                                                        <div className="flex items-center text-gray-900 font-semibold">Writing Chair</div>
                                                                        <div className="flex justify-center items-center">
                                                                            {bedroom.writing_chair === 'furnished' &&
                                                                                <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                            }
                                                                        </div>
                                                                        <div className="flex justify-center items-center">
                                                                            {bedroom.writing_chair === 'not-furnish' &&
                                                                                <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                                            }
                                                                        </div>

                                                                        {/* Curtain */}
                                                                        <div className="flex items-center text-gray-900 font-semibold">Curtain</div>
                                                                        <div className="flex justify-center items-center">
                                                                            {bedroom.curtain === 'furnished' &&
                                                                                <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                            }
                                                                        </div>
                                                                        <div className="flex justify-center items-center">
                                                                            {bedroom.curtain === 'not-furnish' &&
                                                                                <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                                            }
                                                                        </div>

                                                                        {/* Lights */}
                                                                        <div className="flex items-center text-gray-900 font-semibold">Lights</div>
                                                                        <div className="flex justify-center items-center">
                                                                            {bedroom.lights === 'furnished' &&
                                                                                <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                            }
                                                                        </div>
                                                                        <div className="flex justify-center items-center">
                                                                            {bedroom.lights === 'not-furnish' &&
                                                                                <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                                            }
                                                                        </div>

                                                                        {/* Fan */}
                                                                        <div className="flex items-center text-gray-900 font-semibold">Fan</div>
                                                                        <div className="flex justify-center items-center">
                                                                            {bedroom.fan === 'furnished' &&
                                                                                <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                            }
                                                                        </div>
                                                                        <div className="flex justify-center items-center">
                                                                            {bedroom.fan === 'not-furnish' &&
                                                                                <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                                            }
                                                                        </div>

                                                                        {/* AC */}
                                                                        <div className="flex items-center text-gray-900 font-semibold">AC</div>
                                                                        <div className="flex justify-center items-center">
                                                                            {bedroom.ac === 'furnished' &&
                                                                                <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                            }
                                                                        </div>
                                                                        <div className="flex justify-center items-center">
                                                                            {bedroom.ac === 'not-furnish' &&
                                                                                <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                                            }
                                                                        </div>

                                                                        {/* Other */}
                                                                        <div className="flex items-center text-gray-900 font-semibold">Other</div>
                                                                        <div className="flex justify-center items-center">
                                                                            {bedroom.other === 'furnished' &&
                                                                                <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                            }
                                                                        </div>
                                                                        <div className="flex justify-center items-center">
                                                                            {bedroom.other === 'not-furnish' &&
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
                                                                {bedroom.remark ? bedroom.remark : '-'}
                                                            </span>
                                                        </div>
                                                    </React.Fragment>
                                                )
                                            })}


                                            {Object.keys(formData.furnishing.bathrooms || {}).map((bathroomKey) => {

                                                const bathroom = formData.furnishing.bathrooms[bathroomKey];

                                                return (
                                                    <React.Fragment key={bathroomKey}>
                                                        <hr className="mb-8" />

                                                        <div className="card rounded-md mb-8">
                                                            <div className="card-header px-4 rounded-t-md bg-gray-300 text-gray-900 font-bold">
                                                                <h2 className="">{bathroomKey.charAt(0).toUpperCase() + bathroomKey.slice(1)}</h2>
                                                            </div>
                                                            <div className="card-body text-sm px-4">
                                                                <div className="w-full">
                                                                    <div className="grid grid-cols-3 gap-4">
                                                                        {/* Header Row */}
                                                                        <div className="col-start-2 text-xs text-center text-gray-900 font-semibold">Furnished</div>
                                                                        <div className="col-start-3 text-xs text-center text-gray-900 font-semibold">Not Furnished</div>

                                                                        {/* Water Heater */}
                                                                        <div className="flex items-center text-gray-900 font-semibold">Water Heater</div>
                                                                        <div className="flex justify-center items-center">
                                                                            {bathroom.water_heater === 'furnished' &&
                                                                                <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                            }
                                                                        </div>
                                                                        <div className="flex justify-center items-center">
                                                                            {bathroom.water_heater === 'not-furnish' &&
                                                                                <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                                            }
                                                                        </div>

                                                                        {/* Bidet */}
                                                                        <div className="flex items-center text-gray-900 font-semibold">Bidet</div>
                                                                        <div className="flex justify-center items-center">
                                                                            {bathroom.bidet === 'furnished' &&
                                                                                <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                            }
                                                                        </div>
                                                                        <div className="flex justify-center items-center">
                                                                            {bathroom.bidet === 'not-furnish' &&
                                                                                <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                                            }
                                                                        </div>

                                                                        {/* Mirror */}
                                                                        <div className="flex items-center text-gray-900 font-semibold">Mirror</div>
                                                                        <div className="flex justify-center items-center">
                                                                            {bathroom.mirror === 'furnished' &&
                                                                                <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                            }
                                                                        </div>
                                                                        <div className="flex justify-center items-center">
                                                                            {bathroom.mirror === 'not-furnish' &&
                                                                                <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                                            }
                                                                        </div>

                                                                        {/* Shower Screen */}
                                                                        <div className="flex items-center text-gray-900 font-semibold">Shower Screen </div>
                                                                        <div className="flex justify-center items-center">
                                                                            {bathroom.shower_screen === 'furnished' &&
                                                                                <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                            }
                                                                        </div>
                                                                        <div className="flex justify-center items-center">
                                                                            {bathroom.shower_screen === 'not-furnish' &&
                                                                                <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                                            }
                                                                        </div>

                                                                        {/* Lights */}
                                                                        <div className="flex items-center text-gray-900 font-semibold">Lights </div>
                                                                        <div className="flex justify-center items-center">
                                                                            {bathroom.lights === 'furnished' &&
                                                                                <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                            }
                                                                        </div>
                                                                        <div className="flex justify-center items-center">
                                                                            {bathroom.lights === 'not-furnish' &&
                                                                                <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                                            }
                                                                        </div>

                                                                        {/* Other */}
                                                                        <div className="flex items-center text-gray-900 font-semibold">Other</div>
                                                                        <div className="flex justify-center items-center">
                                                                            {bathroom.other === 'furnished' &&
                                                                                <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                            }
                                                                        </div>
                                                                        <div className="flex justify-center items-center">
                                                                            {bathroom.other === 'not-furnish' &&
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
                                                                {bathroom.remark ? bathroom.remark : '-'}
                                                            </span>
                                                        </div>
                                                    </React.Fragment>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            :
                            <div className="card w-full">
                                <div className="card-header py-2">
                                    <div className="flex gap-4 justify-center">
                                        {!!owner &&
                                            <Link
                                                to={LOCAL_PATH_PREFIX + 'home'}
                                                className="ki-solid ki-arrow-left items-center">
                                            </Link>
                                        }
                                        <h2 className="text-slate-900 text-lg font-semibold">[Reno] Registration Form</h2>
                                    </div>
                                </div>
                                <div className="card-body">
                                    <div className="flex flex-col mb-8">
                                        <label className="text-slate-900 mb-2 font-medium" htmlFor="salutations">Salutations</label>
                                        <select className={`select ${errors.salutations ? 'border-danger' : ''}`} disabled={!!owner} name="salutations" id="salutations" onChange={handleChange} value={formData.salutations}>
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
                                                <input className={`input ${errors.name_first ? 'border-danger' : ''}`} type="text" disabled={!!owner} name="name_first" id="name_first" value={formData.name_first} onChange={handleChange} />
                                                <span className="text-slate-500 text-xs">First Name</span>
                                            </div>
                                            <div className="flex flex-col w-full">
                                                <input className={`input ${errors.name_last ? 'border-danger' : ''}`} type="text" disabled={!!owner} name="name_last" id="name_last" value={formData.name_last} onChange={handleChange} />
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
                                        <input className={`input ${errors.name_preferred ? 'border-danger' : ''}`} type="text" disabled={!!owner} name="name_preferred" id="name_preferred" value={formData.name_preferred} onChange={handleChange} />
                                        {errors.name_preferred && <span className="text-red-500 text-xs mt-2">{errors.name_preferred}</span>}
                                    </div>

                                    <div className="flex flex-col mb-8">
                                        <div className="flex gap-2 flex-wrap">
                                            <div className="flex flex-col flex-auto mb-6 md:mb-0">
                                                <label className="text-slate-900 mb-2 font-medium" htmlFor="email">Email</label>
                                                <input className={`input ${errors.email ? 'border-danger' : ''}`} type="email" disabled={!!owner} name="email" id="email" value={formData.email} onChange={handleChange} />
                                                <span className="text-slate-500 text-xs">example@example.com</span>
                                            </div>
                                            <div className="flex flex-col flex-auto">
                                                <label className="text-slate-900 mb-2 font-medium" htmlFor="phone_no">Phone Number</label>
                                                <div className="flex">
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
                                                    <input className={`input ${errors.phone_no ? 'border-danger' : ''}`} type="tel" disabled={!!owner} name="phone_no" id="phone_no" value={formData.phone_no} onChange={handleChange} />
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
                                            <input className={`input ${errors.address_1 ? 'border-danger' : ''}`} type="text" disabled={!!owner} name="address_1" id="address_1" value={formData.address_1} onChange={handleChange} />
                                            <span className="text-slate-500 text-xs">Address Line 1</span>
                                            {errors.address_1 && <span className="text-red-500 text-xs mt-2">{errors.address_1}</span>}
                                        </div>

                                        <div className="flex flex-col mb-8">
                                            <input className="input" type="text" disabled={!!owner} name="address_2" id="address_2" value={formData.address_2} onChange={handleChange} />
                                            <span className="text-slate-500 text-xs">Address Line 2 (optional)</span>
                                        </div>

                                        <div className="flex flex-col mb-8">
                                            <div className="flex gap-2 ">
                                                <div className="flex flex-col w-full">
                                                    <input className={`input ${errors.city ? 'border-danger' : ''}`} type="text" disabled={!!owner} name="city" id="city" value={formData.city} onChange={handleChange} />
                                                    <span className="text-slate-500 text-xs">City</span>
                                                </div>
                                                <div className="flex flex-col w-full">
                                                    <input className={`input ${errors.state ? 'border-danger' : ''}`} type="text" disabled={!!owner} name="state" id="state" value={formData.state} onChange={handleChange} />
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
                                            <input className={`input ${errors.postcode ? 'border-danger' : ''}`} type="text" disabled={!!owner} name="postcode" id="postcode" value={formData.postcode} onChange={handleChange} />
                                            <span className="text-slate-500 text-xs">Postal / Zip Code</span>
                                            {errors.postcode && <span className="text-red-500 text-xs mt-2">{errors.postcode}</span>}
                                        </div>
                                    </div>

                                    <div className="flex flex-col mb-8">
                                        <label className="text-slate-900 mb-2 font-medium" htmlFor="ic">IC / ID number (information needed for renovation agreement purpose)</label>
                                        <input
                                            className={`input ${errors.ic ? 'border-danger' : ''}`}
                                            type="text"
                                            disabled={!!owner}
                                            name="ic"
                                            id="ic"
                                            value={formData.ic}
                                            onChange={handleChange}
                                        />
                                        {errors.ic && <span className="text-red-500 text-xs mt-2">{errors.ic}</span>}
                                    </div>

                                    <div className="flex flex-col mb-8">
                                        <div className="flex gap-2 flex-wrap">
                                            <div className="flex flex-col flex-auto mb-6 md:mb-0">
                                                <label className="text-slate-900 mb-2 font-medium" htmlFor="property_name">Property to be renovated</label>
                                                <select className={`select ${errors.property_name ? 'border-danger' : ''}`} name="property_name" id="property_name" onChange={handleChange} value={formData.property_name}>
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
                                            {formData.property_name === 'other' && (
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
                                        <label className="text-slate-900 mb-2 font-medium" htmlFor="questions.quest_1">What's your original number of rooms?</label>
                                        <select
                                            className={`select ${errors.quest_1 ? 'border-danger' : ''}`}
                                            name="questions.quest_1"
                                            id="questions.quest_1"
                                            onChange={(e) => {
                                                handleChange(e);
                                                handleDynamicBedroom(e);
                                            }}
                                            value={formData.questions.quest_1}
                                        >
                                            {q1Options.map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.quest_1 && <span className="text-red-500 text-xs mt-2">{errors.quest_1}</span>}
                                    </div>

                                    <div className="flex flex-col mb-8">
                                        <label className="text-slate-900 mb-2 font-medium" htmlFor="questions.quest_2">What's the number of bathroom?</label>
                                        <select
                                            className={`select ${errors.quest_2 ? 'border-danger' : ''}`}
                                            name="questions.quest_2"
                                            id="questions.quest_2"
                                            onChange={(e) => {
                                                handleChange(e);
                                                handleDynamicBathroom(e);
                                            }}
                                            value={formData.questions.quest_2}
                                        >
                                            {q2Options.map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.quest_2 && <span className="text-red-500 text-xs mt-2">{errors.quest_2}</span>}
                                    </div>

                                    <div className="flex flex-col mb-8">
                                        <label className="text-slate-900 mb-2 font-medium" htmlFor="questions.quest_3">Already Vacant Possessions (VP)?</label>
                                        <select className={`select ${errors.quest_3 ? 'border-danger' : ''}`} name="questions.quest_3" id="quest_3" onChange={handleChange} value={formData.questions.quest_3}>
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
                                        <label className="text-slate-900 mb-2 font-medium" htmlFor="questions.quest_4">Already collect key?</label>
                                        <select className={`select ${errors.quest_4 ? 'border-danger' : ''}`} name="questions.quest_4" id="questions.quest_4" onChange={handleChange} value={formData.questions.quest_4}>
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
                                        <label className="text-slate-900 mb-2 font-medium" htmlFor="questions.quest_5">Already done defect inspection?</label>
                                        <select className={`select ${errors.quest_5 ? 'border-danger' : ''}`} name="questions.quest_5" id="questions.quest_5" onChange={handleChange} value={formData.questions.quest_5}>
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
                                        <label className="text-slate-900 mb-2 font-medium" htmlFor="questions.quest_6">Already submit defect submission to MO?</label>
                                        <select className={`select ${errors.quest_6 ? 'border-danger' : ''}`} name="questions.quest_6" id="questions.quest_6" onChange={handleChange} value={formData.questions.quest_6}>
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
                                        <label className="text-slate-900 mb-2 font-medium" htmlFor="questions.quest_7">MO has completed that defect rectification?</label>
                                        <select className={`select ${errors.quest_7 ? 'border-danger' : ''}`} name="questions.quest_7" id="questions.quest_7" onChange={handleChange} value={formData.questions.quest_7}>
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
                                        <label className="text-slate-900 mb-2 font-medium" htmlFor="questions.quest_8">Do you want to add partition room to your unit?</label>
                                        <select className={`select ${errors.quest_8 ? 'border-danger' : ''}`} name="questions.quest_8" id="questions.quest_8" onChange={handleChange} value={formData.questions.quest_8}>
                                            <option value="">Please Select</option>
                                            {q8Options.map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        <span className="text-slate-500 text-xs text-justify">It is owner's decision to install partition in the unit. Owner assumes all risk for installing a partition. BeLive is not liable for penalties or removal costs requested by authorities, management office or any other parties.
                                        </span>
                                        {errors.quest_8 && <span className="text-red-500 text-xs mt-2">{errors.quest_8}</span>}
                                    </div>

                                    <div className="flex flex-col mb-8">
                                        <span className="text-sm text-gray-900 text-justify mb-6">
                                            * Please take note that defect inspection, defect rectification and renovation permit application might affect renovation start date. It is subjected to condo management office and developer's work process.
                                        </span>
                                        <span className="text-sm text-gray-900 text-justify">
                                            Thank you for your understanding.
                                        </span>
                                    </div>

                                    <div className="flex flex-col mb-8">
                                        <img src="/media/form/1.jpeg" alt="" />
                                    </div>

                                    <div className="flex flex-col mb-12">
                                        <span className="text-sm text-gray-900 text-justify mb-6">
                                            ** Image above is an example for room numbering. This is our method to determine the arrangement of rooms for each layout type. Kindly refer and don't hesitate to ask our sales team for assistance!
                                        </span>

                                        <span className="text-sm text-gray-900 text-justify">
                                            ** Room numbering is based on clockwise rotating basis
                                        </span>
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

                                                        {errors.foyer_entrance && <span className="text-red-500 text-sm mt-2">{errors.foyer_entrance}</span>}
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
                                                value={formData.furnishing.foyer_entrance.other}
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

                                                        {errors.kitchen && <span className="text-red-500 text-sm mt-2">{errors.kitchen}</span>}
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
                                                value={formData.furnishing.kitchen.other}
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

                                                        {errors.yard && <span className="text-red-500 text-sm mt-2">{errors.yard}</span>}
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
                                                value={formData.furnishing.yard.other}
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

                                                        {errors.dining && <span className="text-red-500 text-sm mt-2">{errors.dining}</span>}
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
                                                value={formData.furnishing.dining.other}
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

                                                        {errors.living && <span className="text-red-500 text-sm mt-2">{errors.living}</span>}
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
                                                value={formData.furnishing.living.other}
                                            >
                                            </textarea>
                                        </div>

                                        {Object.keys(formData.furnishing.bedrooms || {}).map((bedroomKey) => {

                                            const bedroom = formData.furnishing.bedrooms[bedroomKey];

                                            return (
                                                <React.Fragment key={bedroomKey}>
                                                    <hr className="mb-8" />

                                                    <div className="card rounded-md mb-8">
                                                        <div className="card-header px-4 rounded-t-md bg-gray-300 text-gray-900 font-bold">
                                                            <h2 className="">{bedroomKey.charAt(0).toUpperCase() + bedroomKey.slice(1)}</h2>
                                                        </div>
                                                        <div className="card-body text-sm px-4">
                                                            <div className="w-full">
                                                                <div className="grid grid-cols-3 gap-4">
                                                                    {/* Header Row */}
                                                                    <div className="col-start-2 text-xs text-center text-gray-900 font-semibold">Furnished</div>
                                                                    <div className="col-start-3 text-xs text-center text-gray-900 font-semibold">Not Furnished</div>

                                                                    {/* Bedframe */}
                                                                    <div className="flex items-center text-gray-900 font-semibold">Bedframe</div>
                                                                    <div className="flex justify-center items-center">
                                                                        <input
                                                                            type="radio"
                                                                            name={`furnishing.bedrooms.${bedroomKey}.bedframe`}
                                                                            value="furnished"
                                                                            checked={bedroom.bedframe === 'furnished'}
                                                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                                                            onChange={handleChange}
                                                                        />
                                                                    </div>
                                                                    <div className="flex justify-center items-center">
                                                                        <input
                                                                            type="radio"
                                                                            name={`furnishing.bedrooms.${bedroomKey}.bedframe`}
                                                                            value="not-furnish"
                                                                            checked={bedroom.bedframe === 'not-furnish'}
                                                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                                                            onChange={handleChange}
                                                                        />
                                                                    </div>

                                                                    {/* Wardrobe */}
                                                                    <div className="flex items-center text-gray-900 font-semibold">Wardrobe</div>
                                                                    <div className="flex justify-center items-center">
                                                                        <input
                                                                            type="radio"
                                                                            name={`furnishing.bedrooms.${bedroomKey}.wardrobe`}
                                                                            value="furnished"
                                                                            checked={bedroom.wardrobe === 'furnished'}
                                                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                                                            onChange={handleChange}
                                                                        />
                                                                    </div>
                                                                    <div className="flex justify-center items-center">
                                                                        <input
                                                                            type="radio"
                                                                            name={`furnishing.bedrooms.${bedroomKey}.wardrobe`}
                                                                            value="not-furnish"
                                                                            checked={bedroom.wardrobe === 'not-furnish'}
                                                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                                                            onChange={handleChange}
                                                                        />
                                                                    </div>

                                                                    {/* Study Table */}
                                                                    <div className="flex items-center text-gray-900 font-semibold">Study Table</div>
                                                                    <div className="flex justify-center items-center">
                                                                        <input
                                                                            type="radio"
                                                                            name={`furnishing.bedrooms.${bedroomKey}.study_table`}
                                                                            value="furnished"
                                                                            checked={bedroom.study_table === 'furnished'}
                                                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                                                            onChange={handleChange}
                                                                        />
                                                                    </div>
                                                                    <div className="flex justify-center items-center">
                                                                        <input
                                                                            type="radio"
                                                                            name={`furnishing.bedrooms.${bedroomKey}.study_table`}
                                                                            value="not-furnish"
                                                                            checked={bedroom.study_table === 'not-furnish'}
                                                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                                                            onChange={handleChange}
                                                                        />
                                                                    </div>

                                                                    {/* Writing Chair */}
                                                                    <div className="flex items-center text-gray-900 font-semibold">Writing Chair</div>
                                                                    <div className="flex justify-center items-center">
                                                                        <input
                                                                            type="radio"
                                                                            name={`furnishing.bedrooms.${bedroomKey}.writing_chair`}
                                                                            value="furnished"
                                                                            checked={bedroom.writing_chair === 'furnished'}
                                                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                                                            onChange={handleChange}
                                                                        />
                                                                    </div>
                                                                    <div className="flex justify-center items-center">
                                                                        <input
                                                                            type="radio"
                                                                            name={`furnishing.bedrooms.${bedroomKey}.writing_chair`}
                                                                            value="not-furnish"
                                                                            checked={bedroom.writing_chair === 'not-furnish'}
                                                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                                                            onChange={handleChange}
                                                                        />
                                                                    </div>

                                                                    {/* Curtain */}
                                                                    <div className="flex items-center text-gray-900 font-semibold">Curtain</div>
                                                                    <div className="flex justify-center items-center">
                                                                        <input
                                                                            type="radio"
                                                                            name={`furnishing.bedrooms.${bedroomKey}.curtain`}
                                                                            value="furnished"
                                                                            checked={bedroom.curtain === 'furnished'}
                                                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                                                            onChange={handleChange}
                                                                        />
                                                                    </div>
                                                                    <div className="flex justify-center items-center">
                                                                        <input
                                                                            type="radio"
                                                                            name={`furnishing.bedrooms.${bedroomKey}.curtain`}
                                                                            value="not-furnish"
                                                                            checked={bedroom.curtain === 'not-furnish'}
                                                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                                                            onChange={handleChange}
                                                                        />
                                                                    </div>

                                                                    {/* Lights */}
                                                                    <div className="flex items-center text-gray-900 font-semibold">Lights</div>
                                                                    <div className="flex justify-center items-center">
                                                                        <input
                                                                            type="radio"
                                                                            name={`furnishing.bedrooms.${bedroomKey}.lights`}
                                                                            value="furnished"
                                                                            checked={bedroom.lights === 'furnished'}
                                                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                                                            onChange={handleChange}
                                                                        />
                                                                    </div>
                                                                    <div className="flex justify-center items-center">
                                                                        <input
                                                                            type="radio"
                                                                            name={`furnishing.bedrooms.${bedroomKey}.lights`}
                                                                            value="not-furnish"
                                                                            checked={bedroom.lights === 'not-furnish'}
                                                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                                                            onChange={handleChange}
                                                                        />
                                                                    </div>

                                                                    {/* Fan */}
                                                                    <div className="flex items-center text-gray-900 font-semibold">Fan</div>
                                                                    <div className="flex justify-center items-center">
                                                                        <input
                                                                            type="radio"
                                                                            name={`furnishing.bedrooms.${bedroomKey}.fan`}
                                                                            value="furnished"
                                                                            checked={bedroom.fan === 'furnished'}
                                                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                                                            onChange={handleChange}
                                                                        />
                                                                    </div>
                                                                    <div className="flex justify-center items-center">
                                                                        <input
                                                                            type="radio"
                                                                            name={`furnishing.bedrooms.${bedroomKey}.fan`}
                                                                            value="not-furnish"
                                                                            checked={bedroom.fan === 'not-furnish'}
                                                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                                                            onChange={handleChange}
                                                                        />
                                                                    </div>

                                                                    {/* AC */}
                                                                    <div className="flex items-center text-gray-900 font-semibold">AC</div>
                                                                    <div className="flex justify-center items-center">
                                                                        <input
                                                                            type="radio"
                                                                            name={`furnishing.bedrooms.${bedroomKey}.ac`}
                                                                            value="furnished"
                                                                            checked={bedroom.ac === 'furnished'}
                                                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                                                            onChange={handleChange}
                                                                        />
                                                                    </div>
                                                                    <div className="flex justify-center items-center">
                                                                        <input
                                                                            type="radio"
                                                                            name={`furnishing.bedrooms.${bedroomKey}.ac`}
                                                                            value="not-furnish"
                                                                            checked={bedroom.ac === 'not-furnish'}
                                                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                                                            onChange={handleChange}
                                                                        />
                                                                    </div>

                                                                    {/* Other */}
                                                                    <div className="flex items-center text-gray-900 font-semibold">Other</div>
                                                                    <div className="flex justify-center items-center">
                                                                        <input
                                                                            type="radio"
                                                                            name={`furnishing.bedrooms.${bedroomKey}.other`}
                                                                            value="furnished"
                                                                            checked={bedroom.other === 'furnished'}
                                                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                                                            onChange={handleChange}
                                                                        />
                                                                    </div>
                                                                    <div className="flex justify-center items-center">
                                                                        <input
                                                                            type="radio"
                                                                            name={`furnishing.bedrooms.${bedroomKey}.other`}
                                                                            value="not-furnish"
                                                                            checked={bedroom.other === 'not-furnish'}
                                                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                                                            onChange={handleChange}
                                                                        />
                                                                    </div>

                                                                    {errors[bedroomKey] && <span className="text-red-500 text-sm mt-2">{errors[bedroomKey]}</span>}
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
                                                            value={formData.furnishing.living.other}
                                                        >
                                                        </textarea>
                                                    </div>
                                                </React.Fragment>
                                            )
                                        })}


                                        {Object.keys(formData.furnishing.bathrooms || {}).map((bathroomKey) => {

                                            const bathroom = formData.furnishing.bathrooms[bathroomKey];

                                            return (
                                                <React.Fragment key={bathroomKey}>
                                                    <hr className="mb-8" />

                                                    <div className="card rounded-md mb-8">
                                                        <div className="card-header px-4 rounded-t-md bg-gray-300 text-gray-900 font-bold">
                                                            <h2 className="">{bathroomKey.charAt(0).toUpperCase() + bathroomKey.slice(1)}</h2>
                                                        </div>
                                                        <div className="card-body text-sm px-4">
                                                            <div className="w-full">
                                                                <div className="grid grid-cols-3 gap-4">
                                                                    {/* Header Row */}
                                                                    <div className="col-start-2 text-xs text-center text-gray-900 font-semibold">Furnished</div>
                                                                    <div className="col-start-3 text-xs text-center text-gray-900 font-semibold">Not Furnished</div>

                                                                    {/* Water Heater */}
                                                                    <div className="flex items-center text-gray-900 font-semibold">Water Heater</div>
                                                                    <div className="flex justify-center items-center">
                                                                        <input
                                                                            type="radio"
                                                                            name={`furnishing.bathrooms.${bathroomKey}.water_heater`}
                                                                            value="furnished"
                                                                            checked={bathroom.water_heater === 'furnished'}
                                                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                                                            onChange={handleChange}
                                                                        />
                                                                    </div>
                                                                    <div className="flex justify-center items-center">
                                                                        <input
                                                                            type="radio"
                                                                            name={`furnishing.bathrooms.${bathroomKey}.water_heater`}
                                                                            value="not-furnish"
                                                                            checked={bathroom.water_heater === 'not-furnish'}
                                                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                                                            onChange={handleChange}
                                                                        />
                                                                    </div>

                                                                    {/* Bidet */}
                                                                    <div className="flex items-center text-gray-900 font-semibold">Bidet</div>
                                                                    <div className="flex justify-center items-center">
                                                                        <input
                                                                            type="radio"
                                                                            name={`furnishing.bathrooms.${bathroomKey}.bidet`}
                                                                            value="furnished"
                                                                            checked={bathroom.bidet === 'furnished'}
                                                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                                                            onChange={handleChange}
                                                                        />
                                                                    </div>
                                                                    <div className="flex justify-center items-center">
                                                                        <input
                                                                            type="radio"
                                                                            name={`furnishing.bathrooms.${bathroomKey}.bidet`}
                                                                            value="not-furnish"
                                                                            checked={bathroom.bidet === 'not-furnish'}
                                                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                                                            onChange={handleChange}
                                                                        />
                                                                    </div>

                                                                    {/* Mirror */}
                                                                    <div className="flex items-center text-gray-900 font-semibold">Mirror</div>
                                                                    <div className="flex justify-center items-center">
                                                                        <input
                                                                            type="radio"
                                                                            name={`furnishing.bathrooms.${bathroomKey}.mirror`}
                                                                            value="furnished"
                                                                            checked={bathroom.mirror === 'furnished'}
                                                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                                                            onChange={handleChange}
                                                                        />
                                                                    </div>
                                                                    <div className="flex justify-center items-center">
                                                                        <input
                                                                            type="radio"
                                                                            name={`furnishing.bathrooms.${bathroomKey}.mirror`}
                                                                            value="not-furnish"
                                                                            checked={bathroom.mirror === 'not-furnish'}
                                                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                                                            onChange={handleChange}
                                                                        />
                                                                    </div>

                                                                    {/* Shower Screen */}
                                                                    <div className="flex items-center text-gray-900 font-semibold">Shower Screen</div>
                                                                    <div className="flex justify-center items-center">
                                                                        <input
                                                                            type="radio"
                                                                            name={`furnishing.bathrooms.${bathroomKey}.shower_screen`}
                                                                            value="furnished"
                                                                            checked={bathroom.shower_screen === 'furnished'}
                                                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                                                            onChange={handleChange}
                                                                        />
                                                                    </div>
                                                                    <div className="flex justify-center items-center">
                                                                        <input
                                                                            type="radio"
                                                                            name={`furnishing.bathrooms.${bathroomKey}.shower_screen`}
                                                                            value="not-furnish"
                                                                            checked={bathroom.shower_screen === 'not-furnish'}
                                                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                                                            onChange={handleChange}
                                                                        />
                                                                    </div>

                                                                    {/* Lights */}
                                                                    <div className="flex items-center text-gray-900 font-semibold">Lights</div>
                                                                    <div className="flex justify-center items-center">
                                                                        <input
                                                                            type="radio"
                                                                            name={`furnishing.bathrooms.${bathroomKey}.lights`}
                                                                            value="furnished"
                                                                            checked={bathroom.lights === 'furnished'}
                                                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                                                            onChange={handleChange}
                                                                        />
                                                                    </div>
                                                                    <div className="flex justify-center items-center">
                                                                        <input
                                                                            type="radio"
                                                                            name={`furnishing.bathrooms.${bathroomKey}.lights`}
                                                                            value="not-furnish"
                                                                            checked={bathroom.lights === 'not-furnish'}
                                                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                                                            onChange={handleChange}
                                                                        />
                                                                    </div>

                                                                    {/* Other */}
                                                                    <div className="flex items-center text-gray-900 font-semibold">Other</div>
                                                                    <div className="flex justify-center items-center">
                                                                        <input
                                                                            type="radio"
                                                                            name={`furnishing.bathrooms.${bathroomKey}.other`}
                                                                            value="furnished"
                                                                            checked={bathroom.other === 'furnished'}
                                                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                                                            onChange={handleChange}
                                                                        />
                                                                    </div>
                                                                    <div className="flex justify-center items-center">
                                                                        <input
                                                                            type="radio"
                                                                            name={`furnishing.bathrooms.${bathroomKey}.other`}
                                                                            value="not-furnish"
                                                                            checked={bathroom.other === 'not-furnish'}
                                                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                                                            onChange={handleChange}
                                                                        />
                                                                    </div>
                                                                    {errors[bathroomKey] && <span className="text-red-500 text-sm mt-2">{errors[bathroomKey]}</span>}
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
                                                            value={formData.furnishing.living.other}
                                                        >
                                                        </textarea>
                                                    </div>
                                                </React.Fragment>
                                            )
                                        })}

                                        <hr />
                                    </div>

                                    <div className="flex flex-col mb-8">
                                        <div className="flex flex-col mb-8">
                                            <label className="text-slate-900 mb-2 font-medium" htmlFor="files">Please upload the photos of the item that furnished in your unit</label>
                                            <input
                                                className="file-input file-input-lg"
                                                multiple={true}
                                                type="file"
                                                name="attachments"
                                                onChange={handleFileUpload}
                                            />
                                            {attachmentErr && <span className="text-red-500 text-xs mt-2">{attachmentErr}</span>}
                                        </div>

                                        {/* Display uploaded files */}
                                        {files.length > 0 && (
                                            <div className="mt-4">
                                                <h4 className="text-lg font-medium">Uploaded Files</h4>
                                                <ul className="mt-2 space-y-2">
                                                    {files.map((uploadedFile) => (
                                                        <div className="flex flex-col" key={uploadedFile.id}>
                                                            <div className="flex items-center space-x-4 mb-4">
                                                                <div className="flex justify-center items-center w-16 h-16 bg-gray-100 rounded">
                                                                    {/* Check if file is an image, otherwise show an icon */}
                                                                    {isImage(uploadedFile.file.type) ? (
                                                                        <a
                                                                            href={uploadedFile.previewUrl}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                        >
                                                                            <img
                                                                                src={uploadedFile.previewUrl}
                                                                                alt={uploadedFile.file.name} // Use file name as alt text
                                                                                className="h-16 w-16 object-cover"
                                                                            />
                                                                        </a>
                                                                    ) : (
                                                                        <i className="ki-filled ki-files text-4xl"></i> // Icon for non-image files
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 flex flex-col">
                                                                    {/* Display file name and size */}
                                                                    <span className="text-slate-700">{uploadedFile.file.name}</span>
                                                                    <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                                        <span>{formatFileSize(uploadedFile.file.size)}</span>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    className="px-2 py-2 rounde"
                                                                    onClick={() => handleDelete(uploadedFile.id)}
                                                                >
                                                                    <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                                </button>
                                                            </div>
                                                            <hr />
                                                        </div>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        }
                    </div>

                    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2">
                        {readyToSubmit ?
                            validateOtp ?
                                <>
                                    <button
                                        className="btn btn-lg btn-secondary rounded-3xl shadow-lg mr-4"
                                        onClick={() => {
                                            setValidateOtp(false);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                    >
                                        Back
                                    </button>
                                </>
                                :
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
                                        onClick={handleConfirmForm}
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

export default OwnerRenoRegistrationForm;