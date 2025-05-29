import { useEffect, useRef, useState } from 'react';
import { DefectInspectionForm, FormQuestion, Property } from '../../types';
import KTComponents, { KTStepper, KTSticky } from '../../metronic/core';
import { Slide, toast } from 'react-toastify';
import { fetchDIForm, fetchProperties, liveUpdateDIForm, removeDIFormAttachment, submitDIForm } from '../../services/operationApi';
import Loading from '../../components/Loading';
import { useNavigate, useParams } from 'react-router-dom';
import imageCompression from 'browser-image-compression';
import { BuildingOfficeIcon, HomeIcon, SparklesIcon } from '@heroicons/react/24/outline'; // Using Heroicons

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/op/' : '/';

const AWS_S3_URL =
    import.meta.env.VITE_APP_ENV === "production"
        ? import.meta.env.VITE_AWS_S3_URL
        : import.meta.env.VITE_APP_ENV === "staging" || import.meta.env.VITE_APP_ENV === "local"
            ? import.meta.env.VITE_STAGING_AWS_S3_URL
            : null

interface UpdateDIFormData {
    area: string;
    sub_area: string | null;
    question: string;
    attachment?: File;
    file_index?: number;
    value?: string;
    remark?: string;
}

interface FormQuestionErrors {
    value?: string;
    remark?: string;
    attachments?: string;
}

interface BathroomErrors {
    [key: string]: FormQuestionErrors | undefined;
}

interface AreaErrors {
    owner_email?: string; // Explicitly define as string | undefined
    bathrooms?: {
        [bathroomKey: string]: BathroomErrors | undefined;
    };
    foyer?: { [key: string]: FormQuestionErrors | undefined };
    kitchen?: { [key: string]: FormQuestionErrors | undefined };
    yard?: { [key: string]: FormQuestionErrors | undefined };
    living?: { [key: string]: FormQuestionErrors | undefined };
    balcony?: { [key: string]: FormQuestionErrors | undefined };
    hallway?: { [key: string]: FormQuestionErrors | undefined };
    bedrooms?: { [bedroom: string]: { [key: string]: FormQuestionErrors | undefined } };
}

interface FormErrors {
    [key: string]: string | FormErrors | AreaErrors | undefined;
}

const isAreaErrors = (area: string | AreaErrors | FormErrors | undefined): area is AreaErrors => {
    return typeof area === 'object' && area !== null && 'bathrooms' in area;
};

// const acceptedFileTypes = [
//     'image/jpeg', // jpg
//     'image/png', // png
//     'image/gif', // gif
//     'image/webp', // webp (added for more image formats)
//     'audio/mpeg', // mp3
//     'audio/x-ms-wma', // wma
//     'audio/wav', // wav (added for more audio formats)
//     'audio/ogg', // ogg
//     'video/mpeg', // mpg
//     'video/x-flv', // flv
//     'video/x-msvideo', // avi
//     'video/mp4', // mp4 (added for more video formats)
//     'video/webm', // webm
// ];

const initInspectionForm: DefectInspectionForm = {
    date: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    }),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    owner_email: '',
    property: {
        property_name: '',
        other_property_name: '',
        block: '',
        level: '',
        unit: '',
    },
    contractor_name: '',
    contractor_email: '',
    bedroom_count: '1',
    bathroom_count: '1',
    area: {
        foyer: {
            q1: {
                value: '',
                remark: ''
            },
            q2: {
                value: '',
                remark: ''
            },
            q3: {
                value: '',
                remark: ''
            },
            q4: {
                value: '',
                remark: ''
            }
        },
        kitchen: {
            q1: {
                value: '',
                remark: ''
            },
            q2: {
                value: '',
                remark: ''
            },
            q3: {
                value: '',
                remark: ''
            },
            q4: {
                value: '',
                remark: ''
            },
            q5: {
                value: '',
                remark: ''
            },
            q6: {
                value: '',
                remark: ''
            },
            q7: {
                value: '',
                remark: ''
            },
            q8: {
                value: '',
                remark: ''
            }
        },
        yard: {
            q1: {
                value: '',
                remark: ''
            },
            q2: {
                value: '',
                remark: ''
            },
            q3: {
                value: '',
                remark: ''
            },
            q4: {
                value: '',
                remark: ''
            },
            q5: {
                value: '',
                remark: ''
            },
            q6: {
                value: '',
                remark: ''
            },
        },
        living: {
            q1: {
                value: '',
                remark: ''
            },
            q2: {
                value: '',
                remark: ''
            },
            q3: {
                value: '',
                remark: ''
            },
            q4: {
                value: '',
                remark: ''
            },
            q5: {
                value: '',
                remark: ''
            },
            q6: {
                value: '',
                remark: ''
            },
            q7: {
                value: '',
                remark: ''
            },
            q8: {
                value: '',
                remark: ''
            },
            q9: {
                value: '',
                remark: ''
            }
        },
        balcony: {
            q1: {
                value: '',
                remark: ''
            },
            q2: {
                value: '',
                remark: ''
            },
            q3: {
                value: '',
                remark: ''
            },
            q4: {
                value: '',
                remark: ''
            }
        },
        hallway: {
            q1: {
                value: '',
                remark: ''
            },
            q2: {
                value: '',
                remark: ''
            },
            q3: {
                value: '',
                remark: ''
            },
            q4: {
                value: '',
                remark: ''
            }
        },
        bedrooms: {
            bedroom1: {
                q1: {
                    value: '',
                    remark: ''
                },
                q2: {
                    value: '',
                    remark: ''
                },
                q3: {
                    value: '',
                    remark: ''
                },
                q4: {
                    value: '',
                    remark: ''
                },
                q5: {
                    value: '',
                    remark: ''
                },
                q6: {
                    value: '',
                    remark: ''
                },
                q7: {
                    value: '',
                    remark: ''
                },
                q8: {
                    value: '',
                    remark: ''
                },
                q9: {
                    value: '',
                    remark: ''
                }
            }
        },
        bathrooms: {
            bathroom1: {
                q1: {
                    value: '',
                    remark: ''
                },
                q2: {
                    value: '',
                    remark: ''
                },
                q3: {
                    value: '',
                    remark: ''
                },
                q4: {
                    value: '',
                    remark: ''
                },
                q5: {
                    value: '',
                    remark: ''
                },
                q6: {
                    value: '',
                    remark: ''
                },
                q7: {
                    value: '',
                    remark: ''
                },
                q8: {
                    value: '',
                    remark: ''
                },
                q9: {
                    value: '',
                    remark: ''
                },
            }
        }
    },
    status: 'not_submitted'
};

function DefectInspectionFormPage() {
    const navigate = useNavigate();
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
    const { id } = useParams<{ id: string }>();
    const formId = id ? parseInt(id, 10) : null;

    const [properties, setProperties] = useState<Property[] | null>(null);
    const [formData, setFormData] = useState<DefectInspectionForm>(initInspectionForm);
    const [attachmentErr, setAttanhmentErr] = useState(null);
    const [errors, setErrors] = useState<FormErrors>({});

    const [loading, setLoading] = useState<boolean>(true); // Loading state

    useEffect(() => {
        document.title = "DI Form | RenoXpert";

        const initFunctions = async () => {
            await KTComponents.init();
            await getProperties();

            const handleSearchDIForm = async (diFormId: number) => {
                setLoading(true);

                try {
                    const response = await fetchDIForm(diFormId);
                    const diForm: DefectInspectionForm = response.data;

                    if (response?.success) {

                        setFormData(diForm);

                        handleDynamicBedroomByNumber(diForm.bedroom_count);
                        handleDynamicBathroomByNumber(diForm.bathroom_count);
                    }

                } catch (error) {
                    notify('error', 'Failed to fetch DI Form');
                } finally {
                    setLoading(false);
                }
            }

            if (formId) {
                await handleSearchDIForm(formId);
            }

            await new Promise(resolve => setTimeout(resolve, 1));
            KTStepper.init();
        };

        initFunctions();

    }, [formId]);

    useEffect(() => {
        if (formData.status === 'submitted') {
            KTSticky.init();
        }
    }, [formData.status]);

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

    const handleGoTo = (step: number) => {
        const stepperEl = document.querySelector('#my_stepper') as HTMLElement;
        const stepper = KTStepper.getInstance(stepperEl);

        stepper.go(step);
    }

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

    const handleChange = async (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;

        // Handle property fields (e.g., property.property_name)
        if (name.startsWith('property.')) {
            const key = name.split('.')[1];
            setFormData((prevData) => ({
                ...prevData,
                property: {
                    ...prevData.property,
                    [key]: value,
                },
            }));
            setErrors((prevErrors) => ({
                ...prevErrors,
                property: {
                    ...(typeof prevErrors.property === 'object' && prevErrors.property !== null
                        ? prevErrors.property
                        : {}),
                    [key]: '',
                },
            }));
            return;
        }

        // Handle area fields (e.g., area.foyer.q1.value, area.bedrooms.bedroom1.q1.value)
        if (name.startsWith('area.')) {
            const [, cat] = name.split('.') as [
                string,
                keyof DefectInspectionForm['area'], // Restrict to valid area keys
                ...string[]
            ];

            const isDynamicArea = cat === 'bedrooms' || cat === 'bathrooms';

            if (isDynamicArea) {
                const [, , rooms, question, val] = name.split('.') as [
                    string,
                    string,
                    string,
                    string,
                    keyof FormQuestion
                ];

                // Update form data
                setFormData((prevData) => {
                    const area = prevData.area || {};
                    const dynamicArea = (area[cat] || {}) as Record<
                        string,
                        Record<string, FormQuestion>
                    >;
                    const roomData = dynamicArea[rooms] || {};
                    const questionData = roomData[question] || { value: '', remark: '' };

                    return {
                        ...prevData,
                        area: {
                            ...area,
                            [cat]: {
                                ...dynamicArea,
                                [rooms]: {
                                    ...roomData,
                                    [question]: {
                                        ...questionData,
                                        [val]: value,
                                    },
                                },
                            },
                        },
                    };
                });

                // Update errors
                setErrors((prevErrors) => {
                    const areaErrors = isAreaErrors(prevErrors.area) ? prevErrors.area : {};
                    const dynamicAreaErrors = (areaErrors[cat] || {}) as Record<
                        string,
                        Record<string, FormQuestionErrors>
                    >;
                    const roomErrors = dynamicAreaErrors[rooms] || {};
                    const questionErrors = roomErrors[question] || {};

                    return {
                        ...prevErrors,
                        area: {
                            ...areaErrors,
                            [cat]: {
                                ...dynamicAreaErrors,
                                [rooms]: {
                                    ...roomErrors,
                                    [question]: {
                                        ...questionErrors,
                                        [val]: '',
                                    },
                                },
                            },
                        },
                    };
                });

                // Debounced API call
                try {
                    const updateFormData: UpdateDIFormData = {
                        area: cat,
                        sub_area: rooms,
                        question,
                        [val]: value,
                    };

                    if (debounceTimeout.current) {
                        clearTimeout(debounceTimeout.current);
                    }

                    debounceTimeout.current = setTimeout(async () => {
                        const response = await liveUpdateDIForm(Number(formId), updateFormData);
                        if (response?.success) {
                            console.log(response?.data);
                        } else {
                            notify('error', response?.message || 'Failed to update form');
                        }
                    }, 500);
                } catch (error) {
                    notify('error', 'Error updating form');
                }
            } else {
                const [, , question, val] = name.split('.') as [
                    string,
                    string,
                    string,
                    keyof FormQuestion
                ];

                // Update form data
                setFormData((prevData) => {
                    const area = prevData.area || {};
                    const staticArea = (area[cat] || {}) as Record<string, FormQuestion>;
                    const questionData = staticArea[question] || { value: '', remark: '' };

                    return {
                        ...prevData,
                        area: {
                            ...area,
                            [cat]: {
                                ...staticArea,
                                [question]: {
                                    ...questionData,
                                    [val]: value,
                                },
                            },
                        },
                    };
                });

                // Update errors
                setErrors((prevErrors) => {
                    const areaErrors = isAreaErrors(prevErrors.area) ? prevErrors.area : {};
                    const staticAreaErrors = (areaErrors[cat] || {}) as Record<
                        string,
                        FormQuestionErrors
                    >;
                    const questionErrors = staticAreaErrors[question] || {};

                    return {
                        ...prevErrors,
                        area: {
                            ...areaErrors,
                            [cat]: {
                                ...staticAreaErrors,
                                [question]: {
                                    ...questionErrors,
                                    [val]: '',
                                },
                            },
                        },
                    };
                });

                // Debounced API call
                try {
                    const updateFormData: UpdateDIFormData = {
                        area: cat,
                        sub_area: null, // Explicitly set sub_area to null for static areas
                        question,
                        [val]: value,
                    };

                    if (debounceTimeout.current) {
                        clearTimeout(debounceTimeout.current);
                    }

                    debounceTimeout.current = setTimeout(async () => {
                        const response = await liveUpdateDIForm(Number(formId), updateFormData);
                        if (response?.success) {
                            console.log(response?.data);
                        } else {
                            notify('error', response?.message || 'Failed to update form');
                        }
                    }, 500);
                } catch (error) {
                    notify('error', 'Error updating form');
                }
            }
            return;
        }

        // Handle top-level fields (e.g., owner_email)
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
        setErrors((prevErrors) => ({
            ...prevErrors,
            [name]: '',
        }));
    };

    const validate = (): FormErrors => {
        const newErrors: FormErrors = {
            property: {},
            area: {}
        };

        // Top level fields
        if (!formData.owner_email) newErrors.owner_email = "Please fill in the field";
        // if (!formData.contractor_name) newErrors.contractor_name = "Please fill in the field";
        // if (!formData.contractor_email) newErrors.contractor_email = "Please fill in the field";
        if (!formData.bedroom_count) newErrors.bedroom_count = "Please select bedroom count";
        if (!formData.bathroom_count) newErrors.bathroom_count = "Please select bathroom count";

        // Property related fields
        if (!formData.property.property_name) {
            (newErrors.property as FormErrors).property_name = "Please select an option";
        }
        if (!formData.property.block) {
            (newErrors.property as FormErrors).block = "Block is required";
        }
        if (!formData.property.level) {
            (newErrors.property as FormErrors).level = "Level is required";
        }
        if (!formData.property.unit) {
            (newErrors.property as FormErrors).unit = "Unit is required";
        }

        if (formData.property.property_name === 'other' && !formData.property.other_property_name) {
            (newErrors.property as FormErrors).other_property_name = "Please fill the other property name";
        }

        // Static areas validation configuration
        const areaValidation = {
            foyer: 4,
            kitchen: 8,
            yard: 6,
            living: 9,
            balcony: 4,
            hallway: 4
        } as const;

        // Validate static areas
        type AreaKey = keyof typeof areaValidation;
        Object.entries(areaValidation).forEach(([area, questionCount]) => {
            const areaKey = area as AreaKey;
            const currentArea = formData.area?.[areaKey];

            if (currentArea) {
                const areaErrors: FormErrors = {};

                for (let q = 1; q <= questionCount; q++) {
                    const questionKey = `q${q}` as keyof typeof currentArea;
                    if (!currentArea[questionKey]?.value) {
                        areaErrors[questionKey] = {
                            value: 'Please select an option'
                        };
                    }
                }

                if (Object.keys(areaErrors).length > 0) {
                    (newErrors.area as FormErrors)[areaKey] = areaErrors;
                }
            }
        });

        // Dynamic bedroom validations
        if (formData.bedroom_count) {
            const bedroomCount = Number(formData.bedroom_count);
            (newErrors.area as FormErrors).bedrooms = {};

            for (let i = 1; i <= bedroomCount; i++) {
                const bedroomKey = `bedroom${i}`;
                const currentBedroom = formData.area?.bedrooms?.[bedroomKey];

                if (currentBedroom) {
                    const bedroomErrors: FormErrors = {};

                    for (let q = 1; q <= 9; q++) {
                        const questionKey = `q${q}` as keyof typeof currentBedroom;
                        if (!currentBedroom[questionKey]?.value) {
                            bedroomErrors[questionKey] = {
                                value: 'Please select an option'
                            };
                        }
                    }

                    if (Object.keys(bedroomErrors).length > 0) {
                        ((newErrors.area as FormErrors).bedrooms as FormErrors)[bedroomKey] = bedroomErrors;
                    }
                }
            }
        }

        // Dynamic bathroom validations
        if (formData.bathroom_count) {
            const bathroomCount = Number(formData.bathroom_count);
            (newErrors.area as FormErrors).bathrooms = {};

            for (let i = 1; i <= bathroomCount; i++) {
                const bathroomKey = `bathroom${i}`;
                const currentBathroom = formData.area?.bathrooms?.[bathroomKey];

                if (currentBathroom) {
                    const bathroomErrors: FormErrors = {};

                    for (let q = 1; q <= 9; q++) {
                        const questionKey = `q${q}` as keyof typeof currentBathroom;
                        if (!currentBathroom[questionKey]?.value) {
                            bathroomErrors[questionKey] = {
                                value: 'Please select an option'
                            };
                        }
                    }

                    if (Object.keys(bathroomErrors).length > 0) {
                        ((newErrors.area as FormErrors).bathrooms as FormErrors)[bathroomKey] = bathroomErrors;
                    }
                }
            }
        }

        // Clean up empty objects
        if (Object.keys(newErrors.property as FormErrors).length === 0) delete newErrors.property;

        // Clean up bedrooms and bathrooms if empty
        if ((newErrors.area as FormErrors).bedrooms &&
            Object.keys((newErrors.area as FormErrors).bedrooms as FormErrors).length === 0) {
            delete (newErrors.area as FormErrors).bedrooms;
        }

        if ((newErrors.area as FormErrors).bathrooms &&
            Object.keys((newErrors.area as FormErrors).bathrooms as FormErrors).length === 0) {
            delete (newErrors.area as FormErrors).bathrooms;
        }

        // Clean up area if empty
        if (Object.keys(newErrors.area as FormErrors).length === 0) delete newErrors.area;

        return newErrors;
    };

    const handleSubmit = async () => {
        const validationErrors = validate();

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            console.log(validationErrors);

            notify('error', 'Please check your form error.');
            return;
        } else {
            try {
                const response = await submitDIForm(Number(formId));

                if (response?.success) {
                    notify('success', 'Form successfully submitted.');
                    navigate(LOCAL_PATH_PREFIX + 'form/submit/success');
                }

            } catch (error) {
                console.log(error);
            }
        }
    }

    const handleDynamicBedroomByNumber = (value: string | number) => {
        const bedroomCount = Number(value);

        setErrors({});

        // Update the bathroom count and dynamically add/remove bedrooms in the form data
        setFormData((prevFormData) => {
            const updatedBedrooms = { ...prevFormData.area?.bedrooms };

            // Add or remove bathroom fields based on the new count
            for (let i = 1; i <= bedroomCount; i++) {
                if (!updatedBedrooms[`bedroom${i}`]) {
                    // Add a new bathroom with empty questions (q1, q2, ..., q8)
                    updatedBedrooms[`bedroom${i}`] = {
                        q1: { value: '', remark: '' },
                        q2: { value: '', remark: '' },
                        q3: { value: '', remark: '' },
                        q4: { value: '', remark: '' },
                        q5: { value: '', remark: '' },
                        q6: { value: '', remark: '' },
                        q7: { value: '', remark: '' },
                        q8: { value: '', remark: '' },
                        q9: { value: '', remark: '' },
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
                area: {
                    ...prevFormData.area,
                    bedrooms: updatedBedrooms
                }
            };
        });
    }

    const handleDynamicBathroomByNumber = (value: string | number) => {
        const bathroomCount = Number(value);

        setErrors({});

        // Update the bathroom count and dynamically add/remove bathrooms in the form data
        setFormData((prevFormData) => {
            const updatedBathrooms = { ...prevFormData.area?.bathrooms };

            // Add or remove bathroom fields based on the new count
            for (let i = 1; i <= bathroomCount; i++) {
                if (!updatedBathrooms[`bathroom${i}`]) {
                    // Add a new bathroom with empty questions (q1, q2, ..., q8)
                    updatedBathrooms[`bathroom${i}`] = {
                        q1: { value: '', remark: '' },
                        q2: { value: '', remark: '' },
                        q3: { value: '', remark: '' },
                        q4: { value: '', remark: '' },
                        q5: { value: '', remark: '' },
                        q6: { value: '', remark: '' },
                        q7: { value: '', remark: '' },
                        q8: { value: '', remark: '' },
                        q9: { value: '', remark: '' },
                    };
                }
            }

            // Remove bathrooms if the number is decreased
            Object.keys(updatedBathrooms).forEach((key) => {
                const bathroomNumber = parseInt(key.replace('bathroom', ''));
                if (bathroomNumber > bathroomCount) {
                    delete updatedBathrooms[key];
                }
            });

            // Return the updated formData
            return {
                ...prevFormData,
                bathroom_count: bathroomCount.toString(),
                area: {
                    ...prevFormData.area,
                    bathrooms: updatedBathrooms
                }
            };
        });
    }

    const handleFileUpload = async (
        event: React.ChangeEvent<HTMLInputElement>,
        areaKey: keyof DefectInspectionForm['area'], // Restrict to valid area keys
        questionKey: string,
        dynamicKey?: string
    ) => {
        setAttanhmentErr(null);

        const fileInput = event.target;
        if (!fileInput.files || fileInput.files.length === 0) {
            return;
        }

        try {
            const options = {
                maxSizeMB: 2,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
            };

            const compressedFile = await imageCompression(fileInput.files[0], options);
            const compressedImage = new File([compressedFile], fileInput.files[0].name, {
                type: fileInput.files[0].type,
            });

            const updatedFormData: UpdateDIFormData = {
                area: areaKey,
                sub_area: dynamicKey || null,
                question: questionKey,
                attachment: compressedImage,
            };

            const response = await liveUpdateDIForm(Number(formId), updatedFormData);

            if (response?.success) {
                setFormData((prevData) => {
                    const area = prevData.area || {};

                    // Handle dynamic areas (bedrooms, bathrooms)
                    if (dynamicKey && (areaKey === 'bedrooms' || areaKey === 'bathrooms')) {
                        const dynamicArea = (area[areaKey] || {}) as Record<
                            string,
                            Record<string, FormQuestion>
                        >;
                        const roomData = dynamicArea[dynamicKey] || {};
                        const questionData = roomData[questionKey] || { value: '', remark: '' };

                        return {
                            ...prevData,
                            area: {
                                ...area,
                                [areaKey]: {
                                    ...dynamicArea,
                                    [dynamicKey]: {
                                        ...roomData,
                                        [questionKey]: {
                                            ...questionData,
                                            attachments:
                                                response.data.area[areaKey]?.[dynamicKey]?.[questionKey]?.attachments,
                                        },
                                    },
                                },
                            },
                        };
                    }

                    // Handle static areas (foyer, kitchen, yard, living, balcony, hallway)
                    const staticArea = (area[areaKey] || {}) as Record<string, FormQuestion>;
                    const questionData = staticArea[questionKey] || { value: '', remark: '' };

                    return {
                        ...prevData,
                        area: {
                            ...area,
                            [areaKey]: {
                                ...staticArea,
                                [questionKey]: {
                                    ...questionData,
                                    attachments: response.data.area[areaKey]?.[questionKey]?.attachments,
                                },
                            },
                        },
                    };
                });
                notify('success', 'File uploaded successfully.');
            }
        } catch (error) {
            notify('error', 'Error uploading file.');
        }
    };

    const formatFileSize = (size: number) => {
        const KB = 1024;
        const MB = KB * 1024;
        if (size >= MB) {
            return `${(size / MB).toFixed(2)} MB`;
        }
        return `${(size / KB).toFixed(2)} KB`;
    };

    const handleDelete = async (
        fileIndex: string,
        areaKey: keyof DefectInspectionForm['area'], // Restrict to valid area keys
        questionKey: string,
        dynamicKey?: string
    ) => {
        setAttanhmentErr(null);

        const updatedFormData = {
            area: areaKey,
            sub_area: dynamicKey || null,
            question: questionKey,
            file_index: Number(fileIndex),
        };

        const response = await removeDIFormAttachment(Number(formId), updatedFormData);

        if (response?.success) {
            setFormData((prevData) => {
                const area = prevData.area || {};

                // Handle dynamic areas (bedrooms, bathrooms)
                if (dynamicKey && (areaKey === 'bedrooms' || areaKey === 'bathrooms')) {
                    const dynamicArea = (area[areaKey] || {}) as Record<
                        string,
                        Record<string, FormQuestion>
                    >;
                    const roomData = dynamicArea[dynamicKey] || {};
                    const questionData = roomData[questionKey] || { value: '', remark: '' };

                    return {
                        ...prevData,
                        area: {
                            ...area,
                            [areaKey]: {
                                ...dynamicArea,
                                [dynamicKey]: {
                                    ...roomData,
                                    [questionKey]: {
                                        ...questionData,
                                        attachments:
                                            response.data.area[areaKey]?.[dynamicKey]?.[questionKey]?.attachments,
                                    },
                                },
                            },
                        },
                    };
                }

                // Handle static areas (foyer, kitchen, yard, living, balcony, hallway)
                const staticArea = (area[areaKey] || {}) as Record<string, FormQuestion>;
                const questionData = staticArea[questionKey] || { value: '', remark: '' };

                return {
                    ...prevData,
                    area: {
                        ...area,
                        [areaKey]: {
                            ...staticArea,
                            [questionKey]: {
                                ...questionData,
                                attachments: response.data.area[areaKey]?.[questionKey]?.attachments,
                            },
                        },
                    },
                };
            });
            notify('success', 'File deleted successfully');
        }
    };

    if (loading) return <Loading />;

    return (
        <div className="card w-full" data-stepper="true" id="my_stepper">
            <div className="card-header py-2">
                <h2 className="text-slate-900 text-lg font-semibold">Defect Inspection Form</h2>
            </div>
            {formData.status === 'submitted' &&
                <div className="card-group">
                    <div data-sticky-wrapper="true">
                        <div className="badge badge-warning badge-outline text-md text-center flex flex-wrap justify-center gap-2.5 border rounded-lg py-2" data-sticky="true" data-sticky-activate="#release" data-sticky-class="fixed z-10 shadow-lg" data-sticky-name="basic" data-sticky-offset="20" data-sticky-release="#variants" data-sticky-start="auto" data-sticky-top="20" data-sticky-width="auto">
                            <span>
                                You are about to edit the submitted DI Form, edit will update the status to "not_submitted"
                            </span>
                        </div>
                    </div>
                </div>
            }
            <div className="card-group">
                <div className="flex flex-wrap justify-center items-center gap-4">
                    <div className="badge badge-xs active flex gap-2.5 items-center cursor-pointer" data-stepper-item="#stepper_1">
                        <div className="flex flex-col gap-0.5">
                            <h4 className="text-sm font-medium text-gray-900 stepper-item-completed:text-gray-600 stepper-item-active:text-primary" onClick={() => handleGoTo(1)}>
                                General
                            </h4>
                        </div>
                    </div>
                    <div className={`badge badge-xs flex gap-2.5 items-center cursor-pointer`} data-stepper-item="#stepper_2">
                        <div className="flex flex-col gap-0.5">
                            <h4 className="text-sm font-medium text-gray-900 stepper-item-completed:text-gray-600 stepper-item-active:text-primary" onClick={() => handleGoTo(2)}>
                                Foyer & Entrance
                            </h4>
                        </div>
                    </div>
                    <div className={`badge badge-xs flex gap-2.5 items-center cursor-pointer`} data-stepper-item="#stepper_3">
                        <div className="flex flex-col gap-0.5">
                            <h4 className="text-sm font-medium text-gray-900 stepper-item-completed:text-gray-600 stepper-item-active:text-primary" onClick={() => handleGoTo(3)}>
                                Kitchen
                            </h4>
                        </div>
                    </div>
                    <div className={`badge badge-xs flex gap-2.5 items-center cursor-pointer`} data-stepper-item="#stepper_4">
                        <div className="flex flex-col gap-0.5">
                            <h4 className="text-sm font-medium text-gray-900 stepper-item-completed:text-gray-600 stepper-item-active:text-primary" onClick={() => handleGoTo(4)}>
                                Yard
                            </h4>
                        </div>
                    </div>
                    <div className={`badge badge-xs flex gap-2.5 items-center cursor-pointer`} data-stepper-item="#stepper_5">
                        <div className="flex flex-col gap-0.5">
                            <h4 className="text-sm font-medium text-gray-900 stepper-item-completed:text-gray-600 stepper-item-active:text-primary" onClick={() => handleGoTo(5)}>
                                Living & Dining
                            </h4>
                        </div>
                    </div>
                    <div className={`badge badge-xs flex gap-2.5 items-center cursor-pointer`} data-stepper-item="#stepper_6">
                        <div className="flex flex-col gap-0.5">
                            <h4 className="text-sm font-medium text-gray-900 stepper-item-completed:text-gray-600 stepper-item-active:text-primary" onClick={() => handleGoTo(6)}>
                                Balcony
                            </h4>
                        </div>
                    </div>
                    <div className={`badge badge-xs flex gap-2.5 items-center cursor-pointer`} data-stepper-item="#stepper_7">
                        <div className="flex flex-col gap-0.5">
                            <h4 className="text-sm font-medium text-gray-900 stepper-item-completed:text-gray-600 stepper-item-active:text-primary" onClick={() => handleGoTo(7)}>
                                Hallway
                            </h4>
                        </div>
                    </div>
                    <div className={`badge badge-xs flex gap-2.5 items-center cursor-pointer`} data-stepper-item="#stepper_8">
                        <div className="flex flex-col gap-0.5">
                            <h4 className="text-sm font-medium text-gray-900 stepper-item-completed:text-gray-600 stepper-item-active:text-primary" onClick={() => handleGoTo(8)}>
                                Bedrooms
                            </h4>
                        </div>
                    </div>
                    <div className={`badge badge-xs flex gap-2.5 items-center cursor-pointer`} data-stepper-item="#stepper_9">
                        <div className="flex flex-col gap-0.5">
                            <h4 className="text-sm font-medium text-gray-900 stepper-item-completed:text-gray-600 stepper-item-active:text-primary" onClick={() => handleGoTo(9)}>
                                Bathrooms
                            </h4>
                        </div>
                    </div>
                </div>
            </div>
            <div className="card-body">
                <div className="" id="stepper_1">
                    <div className="flex flex-col">
                        {/* <div className="flex flex-col mb-8">
                            <label className="text-slate-900 mb-2 font-medium" htmlFor="date">Date & Time</label>
                            <div className="flex gap-6">
                                <div className="badge badge-lg">{formData.date}</div>
                                <div className="badge badge-lg">{formData.time}</div>
                            </div>
                        </div> */}

                        <div className="flex flex-col mb-8">
                            <label className="text-slate-900 mb-2 font-medium" htmlFor="owner_email">Owner's Email</label>
                            <input className={`input ${errors.owner_email ? 'border-danger' : ''}`} type="text" name="owner_email" id="owner_email" value={formData.owner_email} onChange={handleChange} />
                            {typeof errors.owner_email === 'string' && (
                                <span className="text-red-500 text-xs mt-2">{errors.owner_email}</span>
                            )}
                        </div>

                        <div className="md:flex md:gap-6">
                            {/* Property to be Renovated */}
                            <div className="flex flex-col w-full mb-8">
                                <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                    <BuildingOfficeIcon className="w-5 h-5 text-blue-600" aria-label="Property Icon" /> Property to be Renovated
                                </h3>
                                <div className="card bg-white shadow-md rounded-lg border border-gray-100 hover:shadow-lg transition-shadow">
                                    <div className="card-body p-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-base font-semibold text-gray-800">
                                                {formData.property?.block}-{formData.property?.level}-{formData.property?.unit}
                                            </span>
                                            <span className="text-sm text-gray-600">{formData.property?.property_name}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Rooms */}
                            <div className="flex flex-col w-full mb-8">
                                <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                    <HomeIcon className="w-5 h-5 text-blue-600" aria-label="Rooms Icon" /> Rooms
                                </h3>
                                <div className="card bg-white shadow-md rounded-lg border border-gray-100 hover:shadow-lg transition-shadow">
                                    <div className="card-body p-4">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2">
                                                <HomeIcon className="w-5 h-5 text-gray-500" aria-label="Bedroom Icon" />
                                                <span className="text-sm text-gray-700">Bedroom: {formData.bedroom_count}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <SparklesIcon className="w-5 h-5 text-gray-500" aria-label="Bathroom Icon" />
                                                <span className="text-sm text-gray-700">Bathroom: {formData.bathroom_count}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* <div className="flex flex-col mb-8">
                            <label className="text-slate-900 mb-2 font-medium" htmlFor="contractor_name">Inspector</label>
                            <input className={`input ${errors.contractor_name ? 'border-danger' : ''}`} type="text" name="contractor_name" id="contractor_name" value={formData.contractor_name} onChange={handleChange} />
                            {errors.contractor_name && <span className="text-red-500 text-xs mt-2">{errors.contractor_name}</span>}
                        </div>

                        <div className="flex flex-col mb-8">
                            <label className="text-slate-900 mb-2 font-medium" htmlFor="contractor_email">Inspector's Email</label>
                            <input className={`input ${errors.contractor_email ? 'border-danger' : ''}`} type="text" name="contractor_email" id="contractor_email" value={formData.contractor_email} onChange={handleChange} />
                            {errors.contractor_email && <span className="text-red-500 text-xs mt-2">{errors.contractor_email}</span>}
                        </div> */}

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
                    </div>
                </div>

                <div className="hidden" id="stepper_2">
                    <div className="flex flex-col">
                        <div className="flex flex-col mb-8">
                            <h2 className='text-xl font-bold'>1. Foyer & Entrance</h2>
                        </div>

                        <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                            <div className="flex flex-col flex-[3]">
                                <span className='mb-2'>1.1 Entrance door (Frame, leaf, handle, lock, accessories)</span>
                                <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                    {isAreaErrors(errors.area) && errors.area.foyer?.q1?.value && (
                                        <span className="text-red-500 text-xs mt-2">
                                            {errors.area.foyer.q1.value}
                                        </span>
                                    )}
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.foyer.q1.value"
                                            value="has-defect"
                                            checked={formData.area.foyer.q1.value === 'has-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Has Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.foyer.q1.value"
                                            value="no-defect"
                                            checked={formData.area.foyer.q1.value === 'no-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>No Defect</span>
                                    </label>
                                </div>
                                <input className='input' placeholder='remark' type="text" name="area.foyer.q1.remark" id="area.foyer.q1.remark" value={formData.area.foyer.q1.remark} onChange={handleChange} />
                            </div>

                            <div className="card w-auto flex-[2]">
                                <div className="card-header">
                                    <div className="card-title">
                                        Defect Photos
                                    </div>
                                </div>
                                <div className="card-body">
                                    <input
                                        className="file-input file-input-sm badge mb-2"
                                        type="file"
                                        multiple
                                        name="area.foyer.q1.attachments"
                                        onChange={(e) => handleFileUpload(e, 'foyer', 'q1')}
                                    />

                                    <div className="flex flex-col mb-4">
                                        {formData.area?.foyer?.q1?.attachments && Object.entries(formData.area.foyer.q1.attachments).map(([key, uploadedFile]) => (
                                            <div key={key} className="flex items-center space-x-4 mb-4">
                                                <div className="flex-1 flex flex-col">
                                                    <a
                                                        href={AWS_S3_URL + uploadedFile.file_url}
                                                        className="text-slate-700"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {uploadedFile.original_name}
                                                    </a>
                                                    <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                        <span>{formatFileSize(uploadedFile.size)}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    className="px-2 py-2 rounded"
                                                    onClick={() => handleDelete(key, 'foyer', 'q1')}
                                                >
                                                    <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                </button>
                                            </div>
                                        ))}

                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                            <div className="flex flex-col flex-[3]">
                                <span className='mb-2'>1.2 Floor & skirting</span>
                                <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                    {isAreaErrors(errors.area) && errors.area.foyer?.q2?.value && (
                                        <span className="text-red-500 text-xs mt-2">
                                            {errors.area.foyer.q2.value}
                                        </span>
                                    )}
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.foyer.q2.value"
                                            value="has-defect"
                                            checked={formData.area.foyer.q2.value === 'has-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Has Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.foyer.q2.value"
                                            value="no-defect"
                                            checked={formData.area.foyer.q2.value === 'no-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>No Defect</span>
                                    </label>
                                </div>
                                <input className='input' placeholder='remark' type="text" name="area.foyer.q2.remark" id="area.foyer.q2.remark" value={formData.area.foyer.q2.remark} onChange={handleChange} />
                            </div>

                            <div className="card w-auto flex-[2]">
                                <div className="card-header">
                                    <div className="card-title">
                                        Defect Photos
                                    </div>
                                </div>
                                <div className="card-body">
                                    <input
                                        className="file-input file-input-sm badge mb-2"
                                        type="file"
                                        accept="image/*"
                                        name="area.foyer.q2.attachments"
                                        onChange={(e) => handleFileUpload(e, 'foyer', 'q2')}
                                    />

                                    <div className="flex flex-col mb-4">
                                        {formData.area?.foyer?.q2?.attachments && Object.entries(formData.area.foyer.q2.attachments).map(([key, uploadedFile]) => (
                                            <div key={key} className="flex items-center space-x-4 mb-4">
                                                <div className="flex-1 flex flex-col">
                                                    <a
                                                        href={AWS_S3_URL + uploadedFile.file_url}
                                                        className="text-slate-700"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {uploadedFile.original_name}
                                                    </a>
                                                    <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                        <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    className="px-2 py-2 rounded"
                                                    onClick={() => handleDelete(key, 'foyer', 'q2')}
                                                >
                                                    <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                </button>
                                            </div>
                                        ))}

                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                            <div className="flex flex-col flex-[3]">
                                <span className='mb-2'>1.3 Wall & ceiling</span>
                                <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                    {isAreaErrors(errors.area) && errors.area.foyer?.q3?.value && (
                                        <span className="text-red-500 text-xs mt-2">
                                            {errors.area.foyer.q3.value}
                                        </span>
                                    )}
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.foyer.q3.value"
                                            value="has-defect"
                                            checked={formData.area.foyer.q3.value === 'has-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Has Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.foyer.q3.value"
                                            value="no-defect"
                                            checked={formData.area.foyer.q3.value === 'no-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>No Defect</span>
                                    </label>
                                </div>
                                <input className='input' placeholder='remark' type="text" name="area.foyer.q3.remark" id="area.foyer.q3.remark" value={formData.area.foyer.q3.remark} onChange={handleChange} />
                            </div>

                            <div className="card w-auto flex-[2]">
                                <div className="card-header">
                                    <div className="card-title">
                                        Defect Photos
                                    </div>
                                </div>
                                <div className="card-body">
                                    <input
                                        className="file-input file-input-sm badge mb-2"
                                        type="file"
                                        accept="image/*"
                                        name="area.foyer.q3.attachments"
                                        onChange={(e) => handleFileUpload(e, 'foyer', 'q3')}
                                    />

                                    <div className="flex flex-col mb-4">
                                        {formData.area?.foyer?.q3?.attachments && Object.entries(formData.area.foyer.q3.attachments).map(([key, uploadedFile]) => (
                                            <div key={key} className="flex items-center space-x-4 mb-4">
                                                <div className="flex-1 flex flex-col">
                                                    <a
                                                        href={AWS_S3_URL + uploadedFile.file_url}
                                                        className="text-slate-700"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {uploadedFile.original_name}
                                                    </a>
                                                    <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                        <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    className="px-2 py-2 rounded"
                                                    onClick={() => handleDelete(key, 'foyer', 'q3')}
                                                >
                                                    <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                </button>
                                            </div>
                                        ))}

                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                            <div className="flex flex-col flex-[3]">
                                <span className='mb-2'>1.4 DB box</span>
                                <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                    {isAreaErrors(errors.area) && errors.area.foyer?.q4?.value && (
                                        <span className="text-red-500 text-xs mt-2">
                                            {errors.area.foyer.q4.value}
                                        </span>
                                    )}
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.foyer.q4.value"
                                            value="has-defect"
                                            checked={formData.area.foyer.q4.value === 'has-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Has Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.foyer.q4.value"
                                            value="no-defect"
                                            checked={formData.area.foyer.q4.value === 'no-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>No Defect</span>
                                    </label>
                                </div>
                                <input className='input' placeholder='remark' type="text" name="area.foyer.q4.remark" id="area.foyer.q4.remark" value={formData.area.foyer.q4.remark} onChange={handleChange} />
                            </div>

                            <div className="card w-auto flex-[2]">
                                <div className="card-header">
                                    <div className="card-title">
                                        Defect Photos
                                    </div>
                                </div>
                                <div className="card-body">
                                    <input
                                        className="file-input file-input-sm badge mb-2"
                                        type="file"
                                        accept="image/*"
                                        name="area.foyer.q4.attachments"
                                        onChange={(e) => handleFileUpload(e, 'foyer', 'q4')}
                                    />

                                    <div className="flex flex-col mb-4">
                                        {formData.area?.foyer?.q4?.attachments && Object.entries(formData.area.foyer.q4.attachments).map(([key, uploadedFile]) => (
                                            <div key={key} className="flex items-center space-x-4 mb-4">
                                                <div className="flex-1 flex flex-col">
                                                    <a
                                                        href={AWS_S3_URL + uploadedFile.file_url}
                                                        className="text-slate-700"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {uploadedFile.original_name}
                                                    </a>
                                                    <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                        <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    className="px-2 py-2 rounded"
                                                    onClick={() => handleDelete(key, 'foyer', 'q4')}
                                                >
                                                    <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                </button>
                                            </div>
                                        ))}

                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="hidden" id="stepper_3">
                    <div className="flex flex-col">
                        <div className="flex flex-col mb-8">
                            <h2 className='text-xl font-bold'>2. Kitchen</h2>
                        </div>

                        <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                            <div className="flex flex-col flex-[3]">
                                <span className='mb-2'>2.1 Floor & skirting</span>
                                <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                    {isAreaErrors(errors.area) && errors.area.kitchen?.q1?.value && (
                                        <span className="text-red-500 text-xs mt-2">
                                            {errors.area.kitchen.q1.value}
                                        </span>
                                    )}
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.kitchen.q1.value"
                                            value="has-defect"
                                            checked={formData.area.kitchen.q1.value === 'has-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Has Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.kitchen.q1.value"
                                            value="no-defect"
                                            checked={formData.area.kitchen.q1.value === 'no-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>No Defect</span>
                                    </label>
                                </div>
                                <input className='input' placeholder='remark' type="text" name="area.kitchen.q1.remark" id="area.kitchen.q1.remark" value={formData.area.kitchen.q1.remark} onChange={handleChange} />
                            </div>

                            <div className="card w-auto flex-[2]">
                                <div className="card-header">
                                    <div className="card-title">
                                        Defect Photos
                                    </div>
                                </div>
                                <div className="card-body">
                                    {/* <div className="badge">Add Attachments</div> */}

                                    <input
                                        className="file-input file-input-sm badge mb-2"
                                        type="file"
                                        accept="image/*"
                                        name="area.kitchen.q1.attachments"
                                        onChange={(e) => handleFileUpload(e, 'kitchen', 'q1')}
                                    />

                                    <div className="flex flex-col mb-4">
                                        {formData.area?.kitchen?.q1?.attachments && Object.entries(formData.area.kitchen.q1.attachments).map(([key, uploadedFile]) => (
                                            <div key={key} className="flex items-center space-x-4 mb-4">
                                                <div className="flex-1 flex flex-col">
                                                    <a
                                                        href={AWS_S3_URL + uploadedFile.file_url}
                                                        className="text-slate-700"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {uploadedFile.original_name}
                                                    </a>
                                                    <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                        <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    className="px-2 py-2 rounded"
                                                    onClick={() => handleDelete(key, 'kitchen', 'q1')}
                                                >
                                                    <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                </button>
                                            </div>
                                        ))}

                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                            <div className="flex flex-col flex-[3]">
                                <span className='mb-2'>2.2 Wall & ceiling</span>
                                <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                    {isAreaErrors(errors.area) && errors.area.kitchen?.q2?.value && (
                                        <span className="text-red-500 text-xs mt-2">
                                            {errors.area.kitchen.q2.value}
                                        </span>
                                    )}
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.kitchen.q2.value"
                                            value="has-defect"
                                            checked={formData.area.kitchen.q2.value === 'has-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Has Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.kitchen.q2.value"
                                            value="no-defect"
                                            checked={formData.area.kitchen.q2.value === 'no-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>No Defect</span>
                                    </label>
                                </div>
                                <input className='input' placeholder='remark' type="text" name="area.kitchen.q2.remark" id="area.kitchen.q2.remark" value={formData.area.kitchen.q2.remark} onChange={handleChange} />
                            </div>

                            <div className="card w-auto flex-[2]">
                                <div className="card-header">
                                    <div className="card-title">
                                        Defect Photos
                                    </div>
                                </div>
                                <div className="card-body">
                                    {/* <div className="badge">Add Attachments</div> */}

                                    <input
                                        className="file-input file-input-sm badge mb-2"
                                        type="file"
                                        accept="image/*"
                                        name="area.kitchen.q2.attachments"
                                        onChange={(e) => handleFileUpload(e, 'kitchen', 'q2')}
                                    />

                                    <div className="flex flex-col mb-4">
                                        {formData.area?.kitchen?.q2?.attachments && Object.entries(formData.area.kitchen.q2.attachments).map(([key, uploadedFile]) => (
                                            <div key={key} className="flex items-center space-x-4 mb-4">
                                                <div className="flex-1 flex flex-col">
                                                    <a
                                                        href={AWS_S3_URL + uploadedFile.file_url}
                                                        className="text-slate-700"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {uploadedFile.original_name}
                                                    </a>
                                                    <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                        <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    className="px-2 py-2 rounded"
                                                    onClick={() => handleDelete(key, 'kitchen', 'q2')}
                                                >
                                                    <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                </button>
                                            </div>
                                        ))}

                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                            <div className="flex flex-col flex-[3]">
                                <span className='mb-2'>2.3 Electrical & wiring (plug point, switches, etc)</span>
                                <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                    {isAreaErrors(errors.area) && errors.area.kitchen?.q3?.value && (
                                        <span className="text-red-500 text-xs mt-2">
                                            {errors.area.kitchen.q3.value}
                                        </span>
                                    )}
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.kitchen.q3.value"
                                            value="has-defect"
                                            checked={formData.area.kitchen.q3.value === 'has-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Has Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.kitchen.q3.value"
                                            value="no-defect"
                                            checked={formData.area.kitchen.q3.value === 'no-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>No Defect</span>
                                    </label>
                                </div>
                                <input className='input' placeholder='remark' type="text" name="area.kitchen.q3.remark" id="area.kitchen.q3.remark" value={formData.area.kitchen.q3.remark} onChange={handleChange} />
                            </div>

                            <div className="card w-auto flex-[2]">
                                <div className="card-header">
                                    <div className="card-title">
                                        Defect Photos
                                    </div>
                                </div>
                                <div className="card-body">
                                    {/* <div className="badge">Add Attachments</div> */}

                                    <input
                                        className="file-input file-input-sm badge mb-2"
                                        type="file"
                                        accept="image/*"
                                        name="area.kitchen.q3.attachments"
                                        onChange={(e) => handleFileUpload(e, 'kitchen', 'q3')}
                                    />

                                    <div className="flex flex-col mb-4">
                                        {formData.area?.kitchen?.q3?.attachments && Object.entries(formData.area.kitchen.q3.attachments).map(([key, uploadedFile]) => (
                                            <div key={key} className="flex items-center space-x-4 mb-4">
                                                <div className="flex-1 flex flex-col">
                                                    <a
                                                        href={AWS_S3_URL + uploadedFile.file_url}
                                                        className="text-slate-700"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {uploadedFile.original_name}
                                                    </a>
                                                    <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                        <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    className="px-2 py-2 rounded"
                                                    onClick={() => handleDelete(key, 'kitchen', 'q3')}
                                                >
                                                    <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                </button>
                                            </div>
                                        ))}

                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                            <div className="flex flex-col flex-[3]">
                                <span className='mb-2'>2.4 Piping & water flow (Kitchen sink, etc)</span>
                                <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                    {isAreaErrors(errors.area) && errors.area.kitchen?.q4?.value && (
                                        <span className="text-red-500 text-xs mt-2">
                                            {errors.area.kitchen.q4.value}
                                        </span>
                                    )}
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.kitchen.q4.value"
                                            value="has-defect"
                                            checked={formData.area.kitchen.q4.value === 'has-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Has Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.kitchen.q4.value"
                                            value="no-defect"
                                            checked={formData.area.kitchen.q4.value === 'no-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>No Defect</span>
                                    </label>
                                </div>
                                <input className='input' placeholder='remark' type="text" name="area.kitchen.q4.remark" id="area.kitchen.q4.remark" value={formData.area.kitchen.q4.remark} onChange={handleChange} />
                            </div>

                            <div className="card w-auto flex-[2]">
                                <div className="card-header">
                                    <div className="card-title">
                                        Defect Photos
                                    </div>
                                </div>
                                <div className="card-body">
                                    {/* <div className="badge">Add Attachments</div> */}

                                    <input
                                        className="file-input file-input-sm badge mb-2"
                                        type="file"
                                        accept="image/*"
                                        name="area.kitchen.q4.attachments"
                                        onChange={(e) => handleFileUpload(e, 'kitchen', 'q4')}
                                    />

                                    <div className="flex flex-col mb-4">
                                        {formData.area?.kitchen?.q4?.attachments && Object.entries(formData.area.kitchen.q4.attachments).map(([key, uploadedFile]) => (
                                            <div key={key} className="flex items-center space-x-4 mb-4">
                                                <div className="flex-1 flex flex-col">
                                                    <a
                                                        href={AWS_S3_URL + uploadedFile.file_url}
                                                        className="text-slate-700"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {uploadedFile.original_name}
                                                    </a>
                                                    <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                        <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    className="px-2 py-2 rounded"
                                                    onClick={() => handleDelete(key, 'kitchen', 'q4')}
                                                >
                                                    <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                </button>
                                            </div>
                                        ))}

                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                            <div className="flex flex-col flex-[3]">
                                <span className='mb-2'>2.5 Kitchen cabinet (Kitchen top, drawer, cabinet door, accessories, etc)</span>
                                <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                    {isAreaErrors(errors.area) && errors.area.kitchen?.q5?.value && (
                                        <span className="text-red-500 text-xs mt-2">
                                            {errors.area.kitchen.q5.value}
                                        </span>
                                    )}
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.kitchen.q5.value"
                                            value="has-defect"
                                            checked={formData.area.kitchen.q5.value === 'has-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Has Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.kitchen.q5.value"
                                            value="no-defect"
                                            checked={formData.area.kitchen.q5.value === 'no-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>No Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.kitchen.q5.value"
                                            value="not-available"
                                            checked={formData.area.kitchen.q5.value === 'not-available'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Not Avaliable</span>
                                    </label>
                                </div>
                                <input className='input' placeholder='remark' type="text" name="area.kitchen.q5.remark" id="area.kitchen.q5.remark" value={formData.area.kitchen.q5.remark} onChange={handleChange} />
                            </div>

                            <div className="card w-auto flex-[2]">
                                <div className="card-header">
                                    <div className="card-title">
                                        Defect Photos
                                    </div>
                                </div>
                                <div className="card-body">
                                    {/* <div className="badge">Add Attachments</div> */}

                                    <input
                                        className="file-input file-input-sm badge mb-2"
                                        type="file"
                                        accept="image/*"
                                        name="area.kitchen.q5.attachments"
                                        onChange={(e) => handleFileUpload(e, 'kitchen', 'q5')}
                                    />

                                    <div className="flex flex-col mb-4">
                                        {formData.area?.kitchen?.q5?.attachments && Object.entries(formData.area.kitchen.q5.attachments).map(([key, uploadedFile]) => (
                                            <div key={key} className="flex items-center space-x-4 mb-4">
                                                <div className="flex-1 flex flex-col">
                                                    <a
                                                        href={AWS_S3_URL + uploadedFile.file_url}
                                                        className="text-slate-700"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {uploadedFile.original_name}
                                                    </a>
                                                    <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                        <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    className="px-2 py-2 rounded"
                                                    onClick={() => handleDelete(key, 'kitchen', 'q5')}
                                                >
                                                    <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                </button>
                                            </div>
                                        ))}

                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                            <div className="flex flex-col flex-[3]">
                                <span className='mb-2'>2.6 Electrical appliances (Fridge, microwave, oven, hood & hob, etc)</span>
                                <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                    {isAreaErrors(errors.area) && errors.area.kitchen?.q6?.value && (
                                        <span className="text-red-500 text-xs mt-2">
                                            {errors.area.kitchen.q6.value}
                                        </span>
                                    )}
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.kitchen.q6.value"
                                            value="has-defect"
                                            checked={formData.area.kitchen.q6.value === 'has-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Has Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.kitchen.q6.value"
                                            value="no-defect"
                                            checked={formData.area.kitchen.q6.value === 'no-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>No Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.kitchen.q6.value"
                                            value="not-available"
                                            checked={formData.area.kitchen.q6.value === 'not-available'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Not Avaliable</span>
                                    </label>
                                </div>
                                <input className='input' placeholder='remark' type="text" name="area.kitchen.q6.remark" id="area.kitchen.q6.remark" value={formData.area.kitchen.q6.remark} onChange={handleChange} />
                            </div>

                            <div className="card w-auto flex-[2]">
                                <div className="card-header">
                                    <div className="card-title">
                                        Defect Photos
                                    </div>
                                </div>
                                <div className="card-body">
                                    {/* <div className="badge">Add Attachments</div> */}

                                    <input
                                        className="file-input file-input-sm badge mb-2"
                                        type="file"
                                        accept="image/*"
                                        name="area.kitchen.q6.attachments"
                                        onChange={(e) => handleFileUpload(e, 'kitchen', 'q6')}
                                    />

                                    <div className="flex flex-col mb-4">
                                        {formData.area?.kitchen?.q6?.attachments && Object.entries(formData.area.kitchen.q6.attachments).map(([key, uploadedFile]) => (
                                            <div key={key} className="flex items-center space-x-4 mb-4">
                                                <div className="flex-1 flex flex-col">
                                                    <a
                                                        href={AWS_S3_URL + uploadedFile.file_url}
                                                        className="text-slate-700"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {uploadedFile.original_name}
                                                    </a>
                                                    <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                        <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    className="px-2 py-2 rounded"
                                                    onClick={() => handleDelete(key, 'kitchen', 'q6')}
                                                >
                                                    <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                </button>
                                            </div>
                                        ))}

                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                            <div className="flex flex-col flex-[3]">
                                <span className='mb-2'>2.7 Door (Frame, leaf, handle, accessories, etc)</span>
                                <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                    {isAreaErrors(errors.area) && errors.area.kitchen?.q7?.value && (
                                        <span className="text-red-500 text-xs mt-2">
                                            {errors.area.kitchen.q7.value}
                                        </span>
                                    )}
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.kitchen.q7.value"
                                            value="has-defect"
                                            checked={formData.area.kitchen.q7.value === 'has-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Has Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.kitchen.q7.value"
                                            value="no-defect"
                                            checked={formData.area.kitchen.q7.value === 'no-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>No Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.kitchen.q7.value"
                                            value="not-available"
                                            checked={formData.area.kitchen.q7.value === 'not-available'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Not Avaliable</span>
                                    </label>
                                </div>
                                <input className='input' placeholder='remark' type="text" name="area.kitchen.q7.remark" id="area.kitchen.q7.remark" value={formData.area.kitchen.q7.remark} onChange={handleChange} />
                            </div>

                            <div className="card w-auto flex-[2]">
                                <div className="card-header">
                                    <div className="card-title">
                                        Defect Photos
                                    </div>
                                </div>
                                <div className="card-body">
                                    {/* <div className="badge">Add Attachments</div> */}

                                    <input
                                        className="file-input file-input-sm badge mb-2"
                                        type="file"
                                        accept="image/*"
                                        name="area.kitchen.q7.attachments"
                                        onChange={(e) => handleFileUpload(e, 'kitchen', 'q7')}
                                    />

                                    <div className="flex flex-col mb-4">
                                        {formData.area?.kitchen?.q7?.attachments && Object.entries(formData.area.kitchen.q7.attachments).map(([key, uploadedFile]) => (
                                            <div key={key} className="flex items-center space-x-4 mb-4">
                                                <div className="flex-1 flex flex-col">
                                                    <a
                                                        href={AWS_S3_URL + uploadedFile.file_url}
                                                        className="text-slate-700"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {uploadedFile.original_name}
                                                    </a>
                                                    <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                        <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    className="px-2 py-2 rounded"
                                                    onClick={() => handleDelete(key, 'kitchen', 'q7')}
                                                >
                                                    <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                </button>
                                            </div>
                                        ))}

                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                            <div className="flex flex-col flex-[3]">
                                <span className='mb-2'>2.8 Window (Frame, panel, handle, accessories, etc)</span>
                                <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                    {isAreaErrors(errors.area) && errors.area.kitchen?.q8?.value && (
                                        <span className="text-red-500 text-xs mt-2">
                                            {errors.area.kitchen.q8.value}
                                        </span>
                                    )}
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.kitchen.q8.value"
                                            value="has-defect"
                                            checked={formData.area.kitchen.q8.value === 'has-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Has Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.kitchen.q8.value"
                                            value="no-defect"
                                            checked={formData.area.kitchen.q8.value === 'no-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>No Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.kitchen.q8.value"
                                            value="not-available"
                                            checked={formData.area.kitchen.q8.value === 'not-available'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Not Avaliable</span>
                                    </label>
                                </div>
                                <input className='input' placeholder='remark' type="text" name="area.kitchen.q8.remark" id="area.kitchen.q8.remark" value={formData.area.kitchen.q8.remark} onChange={handleChange} />
                            </div>

                            <div className="card w-auto flex-[2]">
                                <div className="card-header">
                                    <div className="card-title">
                                        Defect Photos
                                    </div>
                                </div>
                                <div className="card-body">
                                    {/* <div className="badge">Add Attachments</div> */}

                                    <input
                                        className="file-input file-input-sm badge mb-2"
                                        type="file"
                                        accept="image/*"
                                        name="area.kitchen.q8.attachments"
                                        onChange={(e) => handleFileUpload(e, 'kitchen', 'q8')}
                                    />

                                    <div className="flex flex-col mb-4">
                                        {formData.area?.kitchen?.q8?.attachments && Object.entries(formData.area.kitchen.q8.attachments).map(([key, uploadedFile]) => (
                                            <div key={key} className="flex items-center space-x-4 mb-4">
                                                <div className="flex-1 flex flex-col">
                                                    <a
                                                        href={AWS_S3_URL + uploadedFile.file_url}
                                                        className="text-slate-700"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {uploadedFile.original_name}
                                                    </a>
                                                    <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                        <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    className="px-2 py-2 rounded"
                                                    onClick={() => handleDelete(key, 'kitchen', 'q8')}
                                                >
                                                    <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                </button>
                                            </div>
                                        ))}

                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="hidden" id="stepper_4">
                    <div className="flex flex-col">
                        <div className="flex flex-col mb-8">
                            <h2 className='text-xl font-bold'>3. Yard</h2>
                        </div>

                        <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                            <div className="flex flex-col flex-[3]">
                                <span className='mb-2'>3.1 Floor & skirting (Floor trap)</span>
                                <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                    {isAreaErrors(errors.area) && errors.area.yard?.q1?.value && (
                                        <span className="text-red-500 text-xs mt-2">
                                            {errors.area.yard.q1.value}
                                        </span>
                                    )}
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.yard.q1.value"
                                            value="has-defect"
                                            checked={formData.area.yard.q1.value === 'has-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Has Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.yard.q1.value"
                                            value="no-defect"
                                            checked={formData.area.yard.q1.value === 'no-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>No Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.yard.q1.value"
                                            value="not-available"
                                            checked={formData.area.yard.q1.value === 'not-available'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Not Avaliable</span>
                                    </label>
                                </div>
                                <input className='input' placeholder='remark' type="text" name="area.yard.q1.remark" id="area.yard.q1.remark" value={formData.area.yard.q1.remark} onChange={handleChange} />
                            </div>

                            <div className="card w-auto flex-[2]">
                                <div className="card-header">
                                    <div className="card-title">
                                        Defect Photos
                                    </div>
                                </div>
                                <div className="card-body">
                                    {/* <div className="badge">Add Attachments</div> */}

                                    <input
                                        className="file-input file-input-sm badge mb-2"
                                        type="file"
                                        accept="image/*"
                                        name="area.yard.q1.attachments"
                                        onChange={(e) => handleFileUpload(e, 'yard', 'q1')}
                                    />

                                    <div className="flex flex-col mb-4">
                                        {formData.area?.yard?.q1?.attachments && Object.entries(formData.area.yard.q1.attachments).map(([key, uploadedFile]) => (
                                            <div key={key} className="flex items-center space-x-4 mb-4">
                                                <div className="flex-1 flex flex-col">
                                                    <a
                                                        href={AWS_S3_URL + uploadedFile.file_url}
                                                        className="text-slate-700"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {uploadedFile.original_name}
                                                    </a>
                                                    <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                        <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    className="px-2 py-2 rounded"
                                                    onClick={() => handleDelete(key, 'yard', 'q1')}
                                                >
                                                    <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                </button>
                                            </div>
                                        ))}

                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                            <div className="flex flex-col flex-[3]">
                                <span className='mb-2'>3.2 Wall & ceiling</span>
                                <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                    {isAreaErrors(errors.area) && errors.area.yard?.q2?.value && (
                                        <span className="text-red-500 text-xs mt-2">
                                            {errors.area.yard.q2.value}
                                        </span>
                                    )}
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.yard.q2.value"
                                            value="has-defect"
                                            checked={formData.area.yard.q2.value === 'has-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Has Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.yard.q2.value"
                                            value="no-defect"
                                            checked={formData.area.yard.q2.value === 'no-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>No Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.yard.q2.value"
                                            value="not-available"
                                            checked={formData.area.yard.q2.value === 'not-available'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Not Avaliable</span>
                                    </label>
                                </div>
                                <input className='input' placeholder='remark' type="text" name="area.yard.q2.remark" id="area.yard.q2.remark" value={formData.area.yard.q2.remark} onChange={handleChange} />
                            </div>

                            <div className="card w-auto flex-[2]">
                                <div className="card-header">
                                    <div className="card-title">
                                        Defect Photos
                                    </div>
                                </div>
                                <div className="card-body">
                                    {/* <div className="badge">Add Attachments</div> */}

                                    <input
                                        className="file-input file-input-sm badge mb-2"
                                        type="file"
                                        accept="image/*"
                                        name="area.yard.q2.attachments"
                                        onChange={(e) => handleFileUpload(e, 'yard', 'q2')}
                                    />

                                    <div className="flex flex-col mb-4">
                                        {formData.area?.yard?.q2?.attachments && Object.entries(formData.area.yard.q2.attachments).map(([key, uploadedFile]) => (
                                            <div key={key} className="flex items-center space-x-4 mb-4">
                                                <div className="flex-1 flex flex-col">
                                                    <a
                                                        href={AWS_S3_URL + uploadedFile.file_url}
                                                        className="text-slate-700"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {uploadedFile.original_name}
                                                    </a>
                                                    <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                        <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    className="px-2 py-2 rounded"
                                                    onClick={() => handleDelete(key, 'yard', 'q2')}
                                                >
                                                    <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                </button>
                                            </div>
                                        ))}

                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                            <div className="flex flex-col flex-[3]">
                                <span className='mb-2'>3.3 Electrical & wiring (plug point, switches, etc)</span>
                                <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                    {isAreaErrors(errors.area) && errors.area.yard?.q3?.value && (
                                        <span className="text-red-500 text-xs mt-2">
                                            {errors.area.yard.q3.value}
                                        </span>
                                    )}
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.yard.q3.value"
                                            value="has-defect"
                                            checked={formData.area.yard.q3.value === 'has-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Has Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.yard.q3.value"
                                            value="no-defect"
                                            checked={formData.area.yard.q3.value === 'no-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>No Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.yard.q3.value"
                                            value="not-available"
                                            checked={formData.area.yard.q3.value === 'not-available'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Not Avaliable</span>
                                    </label>
                                </div>
                                <input className='input' placeholder='remark' type="text" name="area.yard.q3.remark" id="area.yard.q3.remark" value={formData.area.yard.q3.remark} onChange={handleChange} />
                            </div>

                            <div className="card w-auto flex-[2]">
                                <div className="card-header">
                                    <div className="card-title">
                                        Defect Photos
                                    </div>
                                </div>
                                <div className="card-body">
                                    {/* <div className="badge">Add Attachments</div> */}

                                    <input
                                        className="file-input file-input-sm badge mb-2"
                                        type="file"
                                        accept="image/*"
                                        name="area.yard.q3.attachments"
                                        onChange={(e) => handleFileUpload(e, 'yard', 'q3')}
                                    />

                                    <div className="flex flex-col mb-4">
                                        {formData.area?.yard?.q3?.attachments && Object.entries(formData.area.yard.q3.attachments).map(([key, uploadedFile]) => (
                                            <div key={key} className="flex items-center space-x-4 mb-4">
                                                <div className="flex-1 flex flex-col">
                                                    <a
                                                        href={AWS_S3_URL + uploadedFile.file_url}
                                                        className="text-slate-700"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {uploadedFile.original_name}
                                                    </a>
                                                    <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                        <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    className="px-2 py-2 rounded"
                                                    onClick={() => handleDelete(key, 'yard', 'q3')}
                                                >
                                                    <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                </button>
                                            </div>
                                        ))}

                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                            <div className="flex flex-col flex-[3]">
                                <span className='mb-2'>3.4 Piping & water flow</span>
                                <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                    {isAreaErrors(errors.area) && errors.area.yard?.q4?.value && (
                                        <span className="text-red-500 text-xs mt-2">
                                            {errors.area.yard.q4.value}
                                        </span>
                                    )}
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.yard.q4.value"
                                            value="has-defect"
                                            checked={formData.area.yard.q4.value === 'has-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Has Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.yard.q4.value"
                                            value="no-defect"
                                            checked={formData.area.yard.q4.value === 'no-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>No Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.yard.q4.value"
                                            value="not-available"
                                            checked={formData.area.yard.q4.value === 'not-available'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Not Avaliable</span>
                                    </label>
                                </div>
                                <input className='input' placeholder='remark' type="text" name="area.yard.q4.remark" id="area.yard.q4.remark" value={formData.area.yard.q4.remark} onChange={handleChange} />
                            </div>

                            <div className="card w-auto flex-[2]">
                                <div className="card-header">
                                    <div className="card-title">
                                        Defect Photos
                                    </div>
                                </div>
                                <div className="card-body">
                                    {/* <div className="badge">Add Attachments</div> */}

                                    <input
                                        className="file-input file-input-sm badge mb-2"
                                        type="file"
                                        accept="image/*"
                                        name="area.yard.q4.attachments"
                                        onChange={(e) => handleFileUpload(e, 'yard', 'q4')}
                                    />

                                    <div className="flex flex-col mb-4">
                                        {formData.area?.yard?.q4?.attachments && Object.entries(formData.area.yard.q4.attachments).map(([key, uploadedFile]) => (
                                            <div key={key} className="flex items-center space-x-4 mb-4">
                                                <div className="flex-1 flex flex-col">
                                                    <a
                                                        href={AWS_S3_URL + uploadedFile.file_url}
                                                        className="text-slate-700"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {uploadedFile.original_name}
                                                    </a>
                                                    <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                        <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    className="px-2 py-2 rounded"
                                                    onClick={() => handleDelete(key, 'yard', 'q4')}
                                                >
                                                    <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                </button>
                                            </div>
                                        ))}

                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                            <div className="flex flex-col flex-[3]">
                                <span className='mb-2'>3.5 Electrical appliances (Washing machine, dryer, etc)</span>
                                <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                    {isAreaErrors(errors.area) && errors.area.yard?.q5?.value && (
                                        <span className="text-red-500 text-xs mt-2">
                                            {errors.area.yard.q5.value}
                                        </span>
                                    )}
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.yard.q5.value"
                                            value="has-defect"
                                            checked={formData.area.yard.q5.value === 'has-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Has Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.yard.q5.value"
                                            value="no-defect"
                                            checked={formData.area.yard.q5.value === 'no-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>No Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.yard.q5.value"
                                            value="not-available"
                                            checked={formData.area.yard.q5.value === 'not-available'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Not Avaliable</span>
                                    </label>
                                </div>
                                <input className='input' placeholder='remark' type="text" name="area.yard.q5.remark" id="area.yard.q5.remark" value={formData.area.yard.q5.remark} onChange={handleChange} />
                            </div>

                            <div className="card w-auto flex-[2]">
                                <div className="card-header">
                                    <div className="card-title">
                                        Defect Photos
                                    </div>
                                </div>
                                <div className="card-body">
                                    {/* <div className="badge">Add Attachments</div> */}

                                    <input
                                        className="file-input file-input-sm badge mb-2"
                                        type="file"
                                        accept="image/*"
                                        name="area.yard.q5.attachments"
                                        onChange={(e) => handleFileUpload(e, 'yard', 'q5')}
                                    />

                                    <div className="flex flex-col mb-4">
                                        {formData.area?.yard?.q5?.attachments && Object.entries(formData.area.yard.q5.attachments).map(([key, uploadedFile]) => (
                                            <div key={key} className="flex items-center space-x-4 mb-4">
                                                <div className="flex-1 flex flex-col">
                                                    <a
                                                        href={AWS_S3_URL + uploadedFile.file_url}
                                                        className="text-slate-700"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {uploadedFile.original_name}
                                                    </a>
                                                    <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                        <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    className="px-2 py-2 rounded"
                                                    onClick={() => handleDelete(key, 'yard', 'q5')}
                                                >
                                                    <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                </button>
                                            </div>
                                        ))}

                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                            <div className="flex flex-col flex-[3]">
                                <span className='mb-2'>3.6 AC ledge (Railing, compressor, etc)</span>
                                <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                    {isAreaErrors(errors.area) && errors.area.yard?.q6?.value && (
                                        <span className="text-red-500 text-xs mt-2">
                                            {errors.area.yard.q6.value}
                                        </span>
                                    )}
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.yard.q6.value"
                                            value="has-defect"
                                            checked={formData.area.yard.q6.value === 'has-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Has Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.yard.q6.value"
                                            value="no-defect"
                                            checked={formData.area.yard.q6.value === 'no-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>No Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.yard.q6.value"
                                            value="not-available"
                                            checked={formData.area.yard.q6.value === 'not-available'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Not Avaliable</span>
                                    </label>
                                </div>
                                <input className='input' placeholder='remark' type="text" name="area.yard.q6.remark" id="area.yard.q6.remark" value={formData.area.yard.q6.remark} onChange={handleChange} />
                            </div>

                            <div className="card w-auto flex-[2]">
                                <div className="card-header">
                                    <div className="card-title">
                                        Defect Photos
                                    </div>
                                </div>
                                <div className="card-body">
                                    {/* <div className="badge">Add Attachments</div> */}

                                    <input
                                        className="file-input file-input-sm badge mb-2"
                                        type="file"
                                        accept="image/*"
                                        name="area.yard.q6.attachments"
                                        onChange={(e) => handleFileUpload(e, 'yard', 'q6')}
                                    />

                                    <div className="flex flex-col mb-4">
                                        {formData.area?.yard?.q6?.attachments && Object.entries(formData.area.yard.q6.attachments).map(([key, uploadedFile]) => (
                                            <div key={key} className="flex items-center space-x-4 mb-4">
                                                <div className="flex-1 flex flex-col">
                                                    <a
                                                        href={AWS_S3_URL + uploadedFile.file_url}
                                                        className="text-slate-700"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {uploadedFile.original_name}
                                                    </a>
                                                    <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                        <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    className="px-2 py-2 rounded"
                                                    onClick={() => handleDelete(key, 'yard', 'q6')}
                                                >
                                                    <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                </button>
                                            </div>
                                        ))}

                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="hidden" id="stepper_5">
                    <div className="flex flex-col">
                        <div className="flex flex-col mb-8">
                            <h2 className='text-xl font-bold'>4. Living & Dining</h2>
                        </div>

                        <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                            <div className="flex flex-col flex-[3]">
                                <span className='mb-2'>4.1 Floor & skirting</span>
                                <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                    {isAreaErrors(errors.area) && errors.area.living?.q1?.value && (
                                        <span className="text-red-500 text-xs mt-2">
                                            {errors.area.living.q1.value}
                                        </span>
                                    )}
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.living.q1.value"
                                            value="has-defect"
                                            checked={formData.area.living.q1.value === 'has-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Has Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.living.q1.value"
                                            value="no-defect"
                                            checked={formData.area.living.q1.value === 'no-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>No Defect</span>
                                    </label>
                                </div>
                                <input className='input' placeholder='remark' type="text" name="area.living.q1.remark" id="area.living.q1.remark" value={formData.area.living.q1.remark} onChange={handleChange} />
                            </div>

                            <div className="card w-auto flex-[2]">
                                <div className="card-header">
                                    <div className="card-title">
                                        Defect Photos
                                    </div>
                                </div>
                                <div className="card-body">
                                    {/* <div className="badge">Add Attachments</div> */}

                                    <input
                                        className="file-input file-input-sm badge mb-2"
                                        type="file"
                                        accept="image/*"
                                        name="area.living.q1.attachments"
                                        onChange={(e) => handleFileUpload(e, 'living', 'q1')}
                                    />

                                    <div className="flex flex-col mb-4">
                                        {formData.area?.living?.q1?.attachments && Object.entries(formData.area.living.q1.attachments).map(([key, uploadedFile]) => (
                                            <div key={key} className="flex items-center space-x-4 mb-4">
                                                <div className="flex-1 flex flex-col">
                                                    <a
                                                        href={AWS_S3_URL + uploadedFile.file_url}
                                                        className="text-slate-700"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {uploadedFile.original_name}
                                                    </a>
                                                    <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                        <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    className="px-2 py-2 rounded"
                                                    onClick={() => handleDelete(key, 'living', 'q1')}
                                                >
                                                    <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                </button>
                                            </div>
                                        ))}

                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                            <div className="flex flex-col flex-[3]">
                                <span className='mb-2'>4.2 Wall</span>
                                <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                    {isAreaErrors(errors.area) && errors.area.living?.q2?.value && (
                                        <span className="text-red-500 text-xs mt-2">
                                            {errors.area.living.q2.value}
                                        </span>
                                    )}
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.living.q2.value"
                                            value="has-defect"
                                            checked={formData.area.living.q2.value === 'has-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Has Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.living.q2.value"
                                            value="no-defect"
                                            checked={formData.area.living.q2.value === 'no-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>No Defect</span>
                                    </label>
                                </div>
                                <input className='input' placeholder='remark' type="text" name="area.living.q2.remark" id="area.living.q2.remark" value={formData.area.living.q2.remark} onChange={handleChange} />
                            </div>

                            <div className="card w-auto flex-[2]">
                                <div className="card-header">
                                    <div className="card-title">
                                        Defect Photos
                                    </div>
                                </div>
                                <div className="card-body">
                                    {/* <div className="badge">Add Attachments</div> */}

                                    <input
                                        className="file-input file-input-sm badge mb-2"
                                        type="file"
                                        accept="image/*"
                                        name="area.living.q2.attachments"
                                        onChange={(e) => handleFileUpload(e, 'living', 'q2')}
                                    />

                                    <div className="flex flex-col mb-4">
                                        {formData.area?.living?.q2?.attachments && Object.entries(formData.area.living.q2.attachments).map(([key, uploadedFile]) => (
                                            <div key={key} className="flex items-center space-x-4 mb-4">
                                                <div className="flex-1 flex flex-col">
                                                    <a
                                                        href={AWS_S3_URL + uploadedFile.file_url}
                                                        className="text-slate-700"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {uploadedFile.original_name}
                                                    </a>
                                                    <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                        <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    className="px-2 py-2 rounded"
                                                    onClick={() => handleDelete(key, 'living', 'q2')}
                                                >
                                                    <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                </button>
                                            </div>
                                        ))}

                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                            <div className="flex flex-col flex-[3]">
                                <span className='mb-2'>4.3 Ceiling</span>
                                <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                    {isAreaErrors(errors.area) && errors.area.living?.q3?.value && (
                                        <span className="text-red-500 text-xs mt-2">
                                            {errors.area.living.q3.value}
                                        </span>
                                    )}
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.living.q3.value"
                                            value="has-defect"
                                            checked={formData.area.living.q3.value === 'has-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Has Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.living.q3.value"
                                            value="no-defect"
                                            checked={formData.area.living.q3.value === 'no-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>No Defect</span>
                                    </label>
                                </div>
                                <input className='input' placeholder='remark' type="text" name="area.living.q3.remark" id="area.living.q3.remark" value={formData.area.living.q3.remark} onChange={handleChange} />
                            </div>

                            <div className="card w-auto flex-[2]">
                                <div className="card-header">
                                    <div className="card-title">
                                        Defect Photos
                                    </div>
                                </div>
                                <div className="card-body">
                                    {/* <div className="badge">Add Attachments</div> */}

                                    <input
                                        className="file-input file-input-sm badge mb-2"
                                        type="file"
                                        accept="image/*"
                                        name="area.living.q3.attachments"
                                        onChange={(e) => handleFileUpload(e, 'living', 'q3')}
                                    />

                                    <div className="flex flex-col mb-4">
                                        {formData.area?.living?.q3?.attachments && Object.entries(formData.area.living.q3.attachments).map(([key, uploadedFile]) => (
                                            <div key={key} className="flex items-center space-x-4 mb-4">
                                                <div className="flex-1 flex flex-col">
                                                    <a
                                                        href={AWS_S3_URL + uploadedFile.file_url}
                                                        className="text-slate-700"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {uploadedFile.original_name}
                                                    </a>
                                                    <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                        <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    className="px-2 py-2 rounded"
                                                    onClick={() => handleDelete(key, 'living', 'q3')}
                                                >
                                                    <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                </button>
                                            </div>
                                        ))}

                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                            <div className="flex flex-col flex-[3]">
                                <span className='mb-2'>4.4 Electrical & wiring (plug point, switches, etc)</span>
                                <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                    {isAreaErrors(errors.area) && errors.area.living?.q4?.value && (
                                        <span className="text-red-500 text-xs mt-2">
                                            {errors.area.living.q4.value}
                                        </span>
                                    )}
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.living.q4.value"
                                            value="has-defect"
                                            checked={formData.area.living.q4.value === 'has-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Has Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.living.q4.value"
                                            value="no-defect"
                                            checked={formData.area.living.q4.value === 'no-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>No Defect</span>
                                    </label>
                                </div>
                                <input className='input' placeholder='remark' type="text" name="area.living.q4.remark" id="area.living.q4.remark" value={formData.area.living.q4.remark} onChange={handleChange} />
                            </div>

                            <div className="card w-auto flex-[2]">
                                <div className="card-header">
                                    <div className="card-title">
                                        Defect Photos
                                    </div>
                                </div>
                                <div className="card-body">
                                    {/* <div className="badge">Add Attachments</div> */}

                                    <input
                                        className="file-input file-input-sm badge mb-2"
                                        type="file"
                                        accept="image/*"
                                        name="area.living.q4.attachments"
                                        onChange={(e) => handleFileUpload(e, 'living', 'q4')}
                                    />

                                    <div className="flex flex-col mb-4">
                                        {formData.area?.living?.q4?.attachments && Object.entries(formData.area.living.q4.attachments).map(([key, uploadedFile]) => (
                                            <div key={key} className="flex items-center space-x-4 mb-4">
                                                <div className="flex-1 flex flex-col">
                                                    <a
                                                        href={AWS_S3_URL + uploadedFile.file_url}
                                                        className="text-slate-700"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {uploadedFile.original_name}
                                                    </a>
                                                    <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                        <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    className="px-2 py-2 rounded"
                                                    onClick={() => handleDelete(key, 'living', 'q4')}
                                                >
                                                    <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                </button>
                                            </div>
                                        ))}

                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                            <div className="flex flex-col flex-[3]">
                                <span className='mb-2'>4.5 Window (Frame, panel, handle, accessories, etc)</span>
                                <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                    {isAreaErrors(errors.area) && errors.area.living?.q5?.value && (
                                        <span className="text-red-500 text-xs mt-2">
                                            {errors.area.living.q5.value}
                                        </span>
                                    )}
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.living.q5.value"
                                            value="has-defect"
                                            checked={formData.area.living.q5.value === 'has-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Has Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.living.q5.value"
                                            value="no-defect"
                                            checked={formData.area.living.q5.value === 'no-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>No Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.living.q5.value"
                                            value="not-available"
                                            checked={formData.area.living.q5.value === 'not-available'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Not Avaliable</span>
                                    </label>
                                </div>
                                <input className='input' placeholder='remark' type="text" name="area.living.q5.remark" id="area.living.q5.remark" value={formData.area.living.q5.remark} onChange={handleChange} />
                            </div>

                            <div className="card w-auto flex-[2]">
                                <div className="card-header">
                                    <div className="card-title">
                                        Defect Photos
                                    </div>
                                </div>
                                <div className="card-body">
                                    {/* <div className="badge">Add Attachments</div> */}

                                    <input
                                        className="file-input file-input-sm badge mb-2"
                                        type="file"
                                        accept="image/*"
                                        name="area.living.q5.attachments"
                                        onChange={(e) => handleFileUpload(e, 'living', 'q5')}
                                    />

                                    <div className="flex flex-col mb-4">
                                        {formData.area?.living?.q5?.attachments && Object.entries(formData.area.living.q5.attachments).map(([key, uploadedFile]) => (
                                            <div key={key} className="flex items-center space-x-4 mb-4">
                                                <div className="flex-1 flex flex-col">
                                                    <a
                                                        href={AWS_S3_URL + uploadedFile.file_url}
                                                        className="text-slate-700"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {uploadedFile.original_name}
                                                    </a>
                                                    <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                        <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    className="px-2 py-2 rounded"
                                                    onClick={() => handleDelete(key, 'living', 'q5')}
                                                >
                                                    <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                </button>
                                            </div>
                                        ))}

                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                            <div className="flex flex-col flex-[3]">
                                <span className='mb-2'>4.6 Sliding door (Frame, panel, handle, accessories, etc)</span>
                                <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                    {isAreaErrors(errors.area) && errors.area.living?.q6?.value && (
                                        <span className="text-red-500 text-xs mt-2">
                                            {errors.area.living.q6.value}
                                        </span>
                                    )}
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.living.q6.value"
                                            value="has-defect"
                                            checked={formData.area.living.q6.value === 'has-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Has Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.living.q6.value"
                                            value="no-defect"
                                            checked={formData.area.living.q6.value === 'no-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>No Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.living.q6.value"
                                            value="not-available"
                                            checked={formData.area.living.q6.value === 'not-available'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Not Avaliable</span>
                                    </label>
                                </div>
                                <input className='input' placeholder='remark' type="text" name="area.living.q6.remark" id="area.living.q6.remark" value={formData.area.living.q6.remark} onChange={handleChange} />
                            </div>

                            <div className="card w-auto flex-[2]">
                                <div className="card-header">
                                    <div className="card-title">
                                        Defect Photos
                                    </div>
                                </div>
                                <div className="card-body">
                                    {/* <div className="badge">Add Attachments</div> */}

                                    <input
                                        className="file-input file-input-sm badge mb-2"
                                        type="file"
                                        accept="image/*"
                                        name="area.living.q6.attachments"
                                        onChange={(e) => handleFileUpload(e, 'living', 'q6')}
                                    />

                                    <div className="flex flex-col mb-4">
                                        {formData.area?.living?.q6?.attachments && Object.entries(formData.area.living.q6.attachments).map(([key, uploadedFile]) => (
                                            <div key={key} className="flex items-center space-x-4 mb-4">
                                                <div className="flex-1 flex flex-col">
                                                    <a
                                                        href={AWS_S3_URL + uploadedFile.file_url}
                                                        className="text-slate-700"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {uploadedFile.original_name}
                                                    </a>
                                                    <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                        <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    className="px-2 py-2 rounded"
                                                    onClick={() => handleDelete(key, 'living', 'q6')}
                                                >
                                                    <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                </button>
                                            </div>
                                        ))}

                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                            <div className="flex flex-col flex-[3]">
                                <span className='mb-2'>4.7 Air conditioner</span>
                                <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                    {isAreaErrors(errors.area) && errors.area.living?.q7?.value && (
                                        <span className="text-red-500 text-xs mt-2">
                                            {errors.area.living.q7.value}
                                        </span>
                                    )}
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.living.q7.value"
                                            value="has-defect"
                                            checked={formData.area.living.q7.value === 'has-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Has Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.living.q7.value"
                                            value="no-defect"
                                            checked={formData.area.living.q7.value === 'no-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>No Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.living.q7.value"
                                            value="not-available"
                                            checked={formData.area.living.q7.value === 'not-available'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Not Avaliable</span>
                                    </label>
                                </div>
                                <input className='input' placeholder='remark' type="text" name="area.living.q7.remark" id="area.living.q7.remark" value={formData.area.living.q7.remark} onChange={handleChange} />
                            </div>

                            <div className="card w-auto flex-[2]">
                                <div className="card-header">
                                    <div className="card-title">
                                        Defect Photos
                                    </div>
                                </div>
                                <div className="card-body">
                                    {/* <div className="badge">Add Attachments</div> */}

                                    <input
                                        className="file-input file-input-sm badge mb-2"
                                        type="file"
                                        accept="image/*"
                                        name="area.living.q7.attachments"
                                        onChange={(e) => handleFileUpload(e, 'living', 'q7')}
                                    />

                                    <div className="flex flex-col mb-4">
                                        {formData.area?.living?.q7?.attachments && Object.entries(formData.area.living.q7.attachments).map(([key, uploadedFile]) => (
                                            <div key={key} className="flex items-center space-x-4 mb-4">
                                                <div className="flex-1 flex flex-col">
                                                    <a
                                                        href={AWS_S3_URL + uploadedFile.file_url}
                                                        className="text-slate-700"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {uploadedFile.original_name}
                                                    </a>
                                                    <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                        <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    className="px-2 py-2 rounded"
                                                    onClick={() => handleDelete(key, 'living', 'q7')}
                                                >
                                                    <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                </button>
                                            </div>
                                        ))}

                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                            <div className="flex flex-col flex-[3]">
                                <span className='mb-2'>4.8 Air conditioner turned on for 2 hours or more</span>
                                <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                    {isAreaErrors(errors.area) && errors.area.living?.q8?.value && (
                                        <span className="text-red-500 text-xs mt-2">
                                            {errors.area.living.q8.value}
                                        </span>
                                    )}
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.living.q8.value"
                                            value="yes"
                                            checked={formData.area.living.q8.value === 'yes'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Yes</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.living.q8.value"
                                            value="not-available"
                                            checked={formData.area.living.q8.value === 'not-available'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Not Avaliable</span>
                                    </label>
                                </div>
                                <input className='input' placeholder='remark' type="text" name="area.living.q8.remark" id="area.living.q8.remark" value={formData.area.living.q8.remark} onChange={handleChange} />
                            </div>

                            <div className="card w-auto flex-[2]">
                                <div className="card-header">
                                    <div className="card-title">
                                        Defect Photos
                                    </div>
                                </div>
                                <div className="card-body">
                                    {/* <div className="badge">Add Attachments</div> */}

                                    <input
                                        className="file-input file-input-sm badge mb-2"
                                        type="file"
                                        accept="image/*"
                                        name="area.living.q8.attachments"
                                        onChange={(e) => handleFileUpload(e, 'living', 'q8')}
                                    />

                                    <div className="flex flex-col mb-4">
                                        {formData.area?.living?.q8?.attachments && Object.entries(formData.area.living.q8.attachments).map(([key, uploadedFile]) => (
                                            <div key={key} className="flex items-center space-x-4 mb-4">
                                                <div className="flex-1 flex flex-col">
                                                    <a
                                                        href={AWS_S3_URL + uploadedFile.file_url}
                                                        className="text-slate-700"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {uploadedFile.original_name}
                                                    </a>
                                                    <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                        <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    className="px-2 py-2 rounded"
                                                    onClick={() => handleDelete(key, 'living', 'q8')}
                                                >
                                                    <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                </button>
                                            </div>
                                        ))}

                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                            <div className="flex flex-col flex-[3]">
                                <span className='mb-2'>4.9 Other</span>
                                <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                    {isAreaErrors(errors.area) && errors.area.living?.q9?.value && (
                                        <span className="text-red-500 text-xs mt-2">
                                            {errors.area.living.q9.value}
                                        </span>
                                    )}
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.living.q9.value"
                                            value="has-defect"
                                            checked={formData.area.living.q9.value === 'has-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Has Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.living.q9.value"
                                            value="no-defect"
                                            checked={formData.area.living.q9.value === 'no-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>No Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.living.q9.value"
                                            value="not-available"
                                            checked={formData.area.living.q9.value === 'not-available'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Not Avaliable</span>
                                    </label>
                                </div>
                                <input className='input' placeholder='remark' type="text" name="area.living.q9.remark" id="area.living.q9.remark" value={formData.area.living.q9.remark} onChange={handleChange} />
                            </div>

                            <div className="card w-auto flex-[2]">
                                <div className="card-header">
                                    <div className="card-title">
                                        Defect Photos
                                    </div>
                                </div>
                                <div className="card-body">
                                    {/* <div className="badge">Add Attachments</div> */}

                                    <input
                                        className="file-input file-input-sm badge mb-2"
                                        type="file"
                                        accept="image/*"
                                        name="area.living.q9.attachments"
                                        onChange={(e) => handleFileUpload(e, 'living', 'q9')}
                                    />

                                    <div className="flex flex-col mb-4">
                                        {formData.area?.living?.q9?.attachments && Object.entries(formData.area.living.q9.attachments).map(([key, uploadedFile]) => (
                                            <div key={key} className="flex items-center space-x-4 mb-4">
                                                <div className="flex-1 flex flex-col">
                                                    <a
                                                        href={AWS_S3_URL + uploadedFile.file_url}
                                                        className="text-slate-700"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {uploadedFile.original_name}
                                                    </a>
                                                    <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                        <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    className="px-2 py-2 rounded"
                                                    onClick={() => handleDelete(key, 'living', 'q9')}
                                                >
                                                    <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                </button>
                                            </div>
                                        ))}

                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="hidden" id="stepper_6">
                    <div className="flex flex-col">
                        <div className="flex flex-col mb-8">
                            <h2 className='text-xl font-bold'>5. Balcony</h2>
                        </div>

                        <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                            <div className="flex flex-col flex-[3]">
                                <span className='mb-2'>5.1 Floor & skirting (Floor trap, evenness, etc)</span>
                                <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                    {isAreaErrors(errors.area) && errors.area.balcony?.q1?.value && (
                                        <span className="text-red-500 text-xs mt-2">
                                            {errors.area.balcony.q1.value}
                                        </span>
                                    )}
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.balcony.q1.value"
                                            value="has-defect"
                                            checked={formData.area.balcony.q1.value === 'has-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Has Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.balcony.q1.value"
                                            value="no-defect"
                                            checked={formData.area.balcony.q1.value === 'no-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>No Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.balcony.q1.value"
                                            value="not-available"
                                            checked={formData.area.balcony.q1.value === 'not-available'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Not Avaliable</span>
                                    </label>
                                </div>
                                <input className='input' placeholder='remark' type="text" name="area.balcony.q1.remark" id="area.balcony.q1.remark" value={formData.area.balcony.q1.remark} onChange={handleChange} />
                            </div>

                            <div className="card w-auto flex-[2]">
                                <div className="card-header">
                                    <div className="card-title">
                                        Defect Photos
                                    </div>
                                </div>
                                <div className="card-body">
                                    {/* <div className="badge">Add Attachments</div> */}

                                    <input
                                        className="file-input file-input-sm badge mb-2"
                                        type="file"
                                        accept="image/*"
                                        name="area.balcony.q1.attachments"
                                        onChange={(e) => handleFileUpload(e, 'balcony', 'q1')}
                                    />

                                    <div className="flex flex-col mb-4">
                                        {formData.area?.balcony?.q1?.attachments && Object.entries(formData.area.balcony.q1.attachments).map(([key, uploadedFile]) => (
                                            <div key={key} className="flex items-center space-x-4 mb-4">
                                                <div className="flex-1 flex flex-col">
                                                    <a
                                                        href={AWS_S3_URL + uploadedFile.file_url}
                                                        className="text-slate-700"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {uploadedFile.original_name}
                                                    </a>
                                                    <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                        <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    className="px-2 py-2 rounded"
                                                    onClick={() => handleDelete(key, 'balcony', 'q1')}
                                                >
                                                    <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                </button>
                                            </div>
                                        ))}

                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                            <div className="flex flex-col flex-[3]">
                                <span className='mb-2'>5.2 Wall & ceiling</span>
                                <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                    {isAreaErrors(errors.area) && errors.area.balcony?.q2?.value && (
                                        <span className="text-red-500 text-xs mt-2">
                                            {errors.area.balcony.q2.value}
                                        </span>
                                    )}
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.balcony.q2.value"
                                            value="has-defect"
                                            checked={formData.area.balcony.q2.value === 'has-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Has Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.balcony.q2.value"
                                            value="no-defect"
                                            checked={formData.area.balcony.q2.value === 'no-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>No Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.balcony.q2.value"
                                            value="not-available"
                                            checked={formData.area.balcony.q2.value === 'not-available'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Not Avaliable</span>
                                    </label>
                                </div>
                                <input className='input' placeholder='remark' type="text" name="area.balcony.q2.remark" id="area.balcony.q2.remark" value={formData.area.balcony.q2.remark} onChange={handleChange} />
                            </div>

                            <div className="card w-auto flex-[2]">
                                <div className="card-header">
                                    <div className="card-title">
                                        Defect Photos
                                    </div>
                                </div>
                                <div className="card-body">
                                    {/* <div className="badge">Add Attachments</div> */}

                                    <input
                                        className="file-input file-input-sm badge mb-2"
                                        type="file"
                                        accept="image/*"
                                        name="area.balcony.q2.attachments"
                                        onChange={(e) => handleFileUpload(e, 'balcony', 'q2')}
                                    />

                                    <div className="flex flex-col mb-4">
                                        {formData.area?.balcony?.q2?.attachments && Object.entries(formData.area.balcony.q2.attachments).map(([key, uploadedFile]) => (
                                            <div key={key} className="flex items-center space-x-4 mb-4">
                                                <div className="flex-1 flex flex-col">
                                                    <a
                                                        href={AWS_S3_URL + uploadedFile.file_url}
                                                        className="text-slate-700"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {uploadedFile.original_name}
                                                    </a>
                                                    <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                        <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    className="px-2 py-2 rounded"
                                                    onClick={() => handleDelete(key, 'balcony', 'q2')}
                                                >
                                                    <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                </button>
                                            </div>
                                        ))}

                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                            <div className="flex flex-col flex-[3]">
                                <span className='mb-2'>5.3 Railing</span>
                                <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                    {isAreaErrors(errors.area) && errors.area.balcony?.q3?.value && (
                                        <span className="text-red-500 text-xs mt-2">
                                            {errors.area.balcony.q3.value}
                                        </span>
                                    )}
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.balcony.q3.value"
                                            value="has-defect"
                                            checked={formData.area.balcony.q3.value === 'has-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Has Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.balcony.q3.value"
                                            value="no-defect"
                                            checked={formData.area.balcony.q3.value === 'no-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>No Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.balcony.q3.value"
                                            value="not-available"
                                            checked={formData.area.balcony.q3.value === 'not-available'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Not Avaliable</span>
                                    </label>
                                </div>
                                <input className='input' placeholder='remark' type="text" name="area.balcony.q3.remark" id="area.balcony.q3.remark" value={formData.area.balcony.q3.remark} onChange={handleChange} />
                            </div>

                            <div className="card w-auto flex-[2]">
                                <div className="card-header">
                                    <div className="card-title">
                                        Defect Photos
                                    </div>
                                </div>
                                <div className="card-body">
                                    {/* <div className="badge">Add Attachments</div> */}

                                    <input
                                        className="file-input file-input-sm badge mb-2"
                                        type="file"
                                        accept="image/*"
                                        name="area.balcony.q3.attachments"
                                        onChange={(e) => handleFileUpload(e, 'balcony', 'q3')}
                                    />

                                    <div className="flex flex-col mb-4">
                                        {formData.area?.balcony?.q3?.attachments && Object.entries(formData.area.balcony.q3.attachments).map(([key, uploadedFile]) => (
                                            <div key={key} className="flex items-center space-x-4 mb-4">
                                                <div className="flex-1 flex flex-col">
                                                    <a
                                                        href={AWS_S3_URL + uploadedFile.file_url}
                                                        className="text-slate-700"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {uploadedFile.original_name}
                                                    </a>
                                                    <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                        <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    className="px-2 py-2 rounded"
                                                    onClick={() => handleDelete(key, 'balcony', 'q3')}
                                                >
                                                    <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                </button>
                                            </div>
                                        ))}

                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                            <div className="flex flex-col flex-[3]">
                                <span className='mb-2'>5.4 AC ledge</span>
                                <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                    {isAreaErrors(errors.area) && errors.area.balcony?.q4?.value && (
                                        <span className="text-red-500 text-xs mt-2">
                                            {errors.area.balcony.q4.value}
                                        </span>
                                    )}
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.balcony.q4.value"
                                            value="has-defect"
                                            checked={formData.area.balcony.q4.value === 'has-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Has Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.balcony.q4.value"
                                            value="no-defect"
                                            checked={formData.area.balcony.q4.value === 'no-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>No Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.balcony.q4.value"
                                            value="not-available"
                                            checked={formData.area.balcony.q4.value === 'not-available'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Not Avaliable</span>
                                    </label>
                                </div>
                                <input className='input' placeholder='remark' type="text" name="area.balcony.q4.remark" id="area.balcony.q4.remark" value={formData.area.balcony.q4.remark} onChange={handleChange} />
                            </div>

                            <div className="card w-auto flex-[2]">
                                <div className="card-header">
                                    <div className="card-title">
                                        Defect Photos
                                    </div>
                                </div>
                                <div className="card-body">
                                    {/* <div className="badge">Add Attachments</div> */}

                                    <input
                                        className="file-input file-input-sm badge mb-2"
                                        type="file"
                                        accept="image/*"
                                        name="area.balcony.q4.attachments"
                                        onChange={(e) => handleFileUpload(e, 'balcony', 'q4')}
                                    />

                                    <div className="flex flex-col mb-4">
                                        {formData.area?.balcony?.q4?.attachments && Object.entries(formData.area.balcony.q4.attachments).map(([key, uploadedFile]) => (
                                            <div key={key} className="flex items-center space-x-4 mb-4">
                                                <div className="flex-1 flex flex-col">
                                                    <a
                                                        href={AWS_S3_URL + uploadedFile.file_url}
                                                        className="text-slate-700"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {uploadedFile.original_name}
                                                    </a>
                                                    <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                        <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    className="px-2 py-2 rounded"
                                                    onClick={() => handleDelete(key, 'balcony', 'q4')}
                                                >
                                                    <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                </button>
                                            </div>
                                        ))}

                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="hidden" id="stepper_7">
                    <div className="flex flex-col">
                        <div className="flex flex-col mb-8">
                            <h2 className='text-xl font-bold'>6. Hallway</h2>
                        </div>

                        <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                            <div className="flex flex-col flex-[3]">
                                <span className='mb-2'>6.1 Floor & skirting</span>
                                <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                    {isAreaErrors(errors.area) && errors.area.hallway?.q1?.value && (
                                        <span className="text-red-500 text-xs mt-2">
                                            {errors.area.hallway.q1.value}
                                        </span>
                                    )}
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.hallway.q1.value"
                                            value="has-defect"
                                            checked={formData.area.hallway.q1.value === 'has-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Has Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.hallway.q1.value"
                                            value="no-defect"
                                            checked={formData.area.hallway.q1.value === 'no-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>No Defect</span>
                                    </label>
                                </div>
                                <input className='input' placeholder='remark' type="text" name="area.hallway.q1.remark" id="area.hallway.q1.remark" value={formData.area.hallway.q1.remark} onChange={handleChange} />
                            </div>

                            <div className="card w-auto flex-[2]">
                                <div className="card-header">
                                    <div className="card-title">
                                        Defect Photos
                                    </div>
                                </div>
                                <div className="card-body">
                                    {/* <div className="badge">Add Attachments</div> */}

                                    <input
                                        className="file-input file-input-sm badge mb-2"
                                        type="file"
                                        accept="image/*"
                                        name="area.hallway.q1.attachments"
                                        onChange={(e) => handleFileUpload(e, 'hallway', 'q1')}
                                    />

                                    <div className="flex flex-col mb-4">
                                        {formData.area?.hallway?.q1?.attachments && Object.entries(formData.area.hallway.q1.attachments).map(([key, uploadedFile]) => (
                                            <div key={key} className="flex items-center space-x-4 mb-4">
                                                <div className="flex-1 flex flex-col">
                                                    <a
                                                        href={AWS_S3_URL + uploadedFile.file_url}
                                                        className="text-slate-700"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {uploadedFile.original_name}
                                                    </a>
                                                    <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                        <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    className="px-2 py-2 rounded"
                                                    onClick={() => handleDelete(key, 'hallway', 'q1')}
                                                >
                                                    <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                </button>
                                            </div>
                                        ))}

                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                            <div className="flex flex-col flex-[3]">
                                <span className='mb-2'>6.2 Wall</span>
                                <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                    {isAreaErrors(errors.area) && errors.area.hallway?.q2?.value && (
                                        <span className="text-red-500 text-xs mt-2">
                                            {errors.area.hallway.q2.value}
                                        </span>
                                    )}
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.hallway.q2.value"
                                            value="has-defect"
                                            checked={formData.area.hallway.q2.value === 'has-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Has Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.hallway.q2.value"
                                            value="no-defect"
                                            checked={formData.area.hallway.q2.value === 'no-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>No Defect</span>
                                    </label>
                                </div>
                                <input className='input' placeholder='remark' type="text" name="area.hallway.q2.remark" id="area.hallway.q2.remark" value={formData.area.hallway.q2.remark} onChange={handleChange} />
                            </div>

                            <div className="card w-auto flex-[2]">
                                <div className="card-header">
                                    <div className="card-title">
                                        Defect Photos
                                    </div>
                                </div>
                                <div className="card-body">
                                    {/* <div className="badge">Add Attachments</div> */}

                                    <input
                                        className="file-input file-input-sm badge mb-2"
                                        type="file"
                                        accept="image/*"
                                        name="area.hallway.q2.attachments"
                                        onChange={(e) => handleFileUpload(e, 'hallway', 'q2')}
                                    />

                                    <div className="flex flex-col mb-4">
                                        {formData.area?.hallway?.q2?.attachments && Object.entries(formData.area.hallway.q2.attachments).map(([key, uploadedFile]) => (
                                            <div key={key} className="flex items-center space-x-4 mb-4">
                                                <div className="flex-1 flex flex-col">
                                                    <a
                                                        href={AWS_S3_URL + uploadedFile.file_url}
                                                        className="text-slate-700"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {uploadedFile.original_name}
                                                    </a>
                                                    <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                        <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    className="px-2 py-2 rounded"
                                                    onClick={() => handleDelete(key, 'hallway', 'q2')}
                                                >
                                                    <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                </button>
                                            </div>
                                        ))}

                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                            <div className="flex flex-col flex-[3]">
                                <span className='mb-2'>6.3 Ceiling</span>
                                <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                    {isAreaErrors(errors.area) && errors.area.hallway?.q3?.value && (
                                        <span className="text-red-500 text-xs mt-2">
                                            {errors.area.hallway.q3.value}
                                        </span>
                                    )}
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.hallway.q3.value"
                                            value="has-defect"
                                            checked={formData.area.hallway.q3.value === 'has-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Has Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.hallway.q3.value"
                                            value="no-defect"
                                            checked={formData.area.hallway.q3.value === 'no-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>No Defect</span>
                                    </label>
                                </div>
                                <input className='input' placeholder='remark' type="text" name="area.hallway.q3.remark" id="area.hallway.q3.remark" value={formData.area.hallway.q3.remark} onChange={handleChange} />
                            </div>

                            <div className="card w-auto flex-[2]">
                                <div className="card-header">
                                    <div className="card-title">
                                        Defect Photos
                                    </div>
                                </div>
                                <div className="card-body">
                                    {/* <div className="badge">Add Attachments</div> */}

                                    <input
                                        className="file-input file-input-sm badge mb-2"
                                        type="file"
                                        accept="image/*"
                                        name="area.hallway.q3.attachments"
                                        onChange={(e) => handleFileUpload(e, 'hallway', 'q3')}
                                    />

                                    <div className="flex flex-col mb-4">
                                        {formData.area?.hallway?.q3?.attachments && Object.entries(formData.area.hallway.q3.attachments).map(([key, uploadedFile]) => (
                                            <div key={key} className="flex items-center space-x-4 mb-4">
                                                <div className="flex-1 flex flex-col">
                                                    <a
                                                        href={AWS_S3_URL + uploadedFile.file_url}
                                                        className="text-slate-700"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {uploadedFile.original_name}
                                                    </a>
                                                    <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                        <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    className="px-2 py-2 rounded"
                                                    onClick={() => handleDelete(key, 'hallway', 'q3')}
                                                >
                                                    <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                </button>
                                            </div>
                                        ))}

                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                            <div className="flex flex-col flex-[3]">
                                <span className='mb-2'>6.4 Electrical & wiring (plug point, switches, etc)</span>
                                <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                    {isAreaErrors(errors.area) && errors.area.hallway?.q4?.value && (
                                        <span className="text-red-500 text-xs mt-2">
                                            {errors.area.hallway.q4.value}
                                        </span>
                                    )}
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.hallway.q4.value"
                                            value="has-defect"
                                            checked={formData.area.hallway.q4.value === 'has-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>Has Defect</span>
                                    </label>
                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                        <input
                                            type="radio"
                                            name="area.hallway.q4.value"
                                            value="no-defect"
                                            checked={formData.area.hallway.q4.value === 'no-defect'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            onChange={handleChange}
                                        />
                                        <span className='text-md'>No Defect</span>
                                    </label>
                                </div>
                                <input className='input' placeholder='remark' type="text" name="area.hallway.q4.remark" id="area.hallway.q4.remark" value={formData.area.hallway.q4.remark} onChange={handleChange} />
                            </div>

                            <div className="card w-auto flex-[2]">
                                <div className="card-header">
                                    <div className="card-title">
                                        Defect Photos
                                    </div>
                                </div>
                                <div className="card-body">
                                    {/* <div className="badge">Add Attachments</div> */}

                                    <input
                                        className="file-input file-input-sm badge mb-2"
                                        type="file"
                                        accept="image/*"
                                        name="area.hallway.q4.attachments"
                                        onChange={(e) => handleFileUpload(e, 'hallway', 'q4')}
                                    />

                                    <div className="flex flex-col mb-4">
                                        {formData.area?.hallway?.q4?.attachments && Object.entries(formData.area.hallway.q4.attachments).map(([key, uploadedFile]) => (
                                            <div key={key} className="flex items-center space-x-4 mb-4">
                                                <div className="flex-1 flex flex-col">
                                                    <a
                                                        href={AWS_S3_URL + uploadedFile.file_url}
                                                        className="text-slate-700"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {uploadedFile.original_name}
                                                    </a>
                                                    <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                        <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    className="px-2 py-2 rounded"
                                                    onClick={() => handleDelete(key, 'hallway', 'q4')}
                                                >
                                                    <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                </button>
                                            </div>
                                        ))}

                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="hidden" id="stepper_8">
                    <div className="flex flex-col">
                        <div className="flex flex-col mb-8">
                            <h2 className='text-xl font-bold'>7. Bedroom</h2>
                            <h2 className='text-md font-semibold'>The bedroom number is based on the Bedroom Count on the top</h2>
                        </div>

                        {Object.keys(formData.area?.bedrooms || {}).map((bedroomKey) => {
                            const bedroom = formData.area?.bedrooms[bedroomKey];

                            return (
                                <div key={bedroomKey}>
                                    <div className="flex flex-col mb-8">
                                        <h2 className='text-xl font-bold'>{bedroomKey.charAt(0).toUpperCase() + bedroomKey.slice(1)}</h2>
                                    </div>

                                    <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                                        <div className="flex flex-col flex-[3]">
                                            <span className='mb-2'>1. Floor & skirting</span>
                                            <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                                {isAreaErrors(errors.area) && errors.area.bedrooms?.[bedroomKey]?.q1?.value && (
                                                    <span className="text-red-500 text-xs mt-2">
                                                        {errors.area.bedrooms[bedroomKey].q1.value}
                                                    </span>
                                                )}
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bedrooms.${bedroomKey}.q1.value`}
                                                        value="has-defect"
                                                        checked={bedroom.q1.value === 'has-defect'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>Has Defect</span>
                                                </label>
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bedrooms.${bedroomKey}.q1.value`}
                                                        value="no-defect"
                                                        checked={bedroom.q1.value === 'no-defect'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>No Defect</span>
                                                </label>
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bedrooms.${bedroomKey}.q1.value`}
                                                        value="not-available"
                                                        checked={bedroom.q1.value === 'not-available'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>Not Avaliable</span>
                                                </label>
                                            </div>
                                            <input className='input' placeholder='remark' type="text" name={`area.bedrooms.${bedroomKey}.q1.remark`} id={`area.bedrooms.${bedroomKey}.q1.remark`} value={bedroom.q1.remark} onChange={handleChange} />
                                        </div>

                                        <div className="card w-auto flex-[2]">
                                            <div className="card-header">
                                                <div className="card-title">
                                                    Defect Photos
                                                </div>
                                            </div>
                                            <div className="card-body">
                                                {/* <div className="badge">Add Attachments</div> */}

                                                <input
                                                    className="file-input file-input-sm badge mb-2"
                                                    // multiple={true}
                                                    type="file"
                                                    accept="image/*"
                                                    name={`area.bedrooms.${bedroomKey}.q1.attachments`}
                                                    onChange={(e) => handleFileUpload(e, 'bedrooms', 'q1', bedroomKey)}
                                                />

                                                <div className="flex flex-col mb-4">
                                                    {formData.area?.bedrooms?.[bedroomKey]?.q1?.attachments && Object.entries(formData.area.bedrooms[bedroomKey].q1.attachments).map(([key, uploadedFile]) => (
                                                        <div key={key} className="flex items-center space-x-4 mb-4">
                                                            <div className="flex-1 flex flex-col">
                                                                <a
                                                                    href={AWS_S3_URL + uploadedFile.file_url}
                                                                    className="text-slate-700"
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    {uploadedFile.original_name}
                                                                </a>
                                                                <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                                    <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                                </div>
                                                            </div>
                                                            <button
                                                                className="px-2 py-2 rounded"
                                                                onClick={() => handleDelete(key, 'bedrooms', 'q1', bedroomKey)}
                                                            >
                                                                <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                            </button>
                                                        </div>
                                                    ))}

                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                                        <div className="flex flex-col flex-[3]">
                                            <span className='mb-2'>2. Wall</span>
                                            <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                                {isAreaErrors(errors.area) && errors.area.bedrooms?.[bedroomKey]?.q2?.value && (
                                                    <span className="text-red-500 text-xs mt-2">
                                                        {errors.area.bedrooms[bedroomKey].q2.value}
                                                    </span>
                                                )}
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bedrooms.${bedroomKey}.q2.value`}
                                                        value="has-defect"
                                                        checked={bedroom.q2.value === 'has-defect'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>Has Defect</span>
                                                </label>
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bedrooms.${bedroomKey}.q2.value`}
                                                        value="no-defect"
                                                        checked={bedroom.q2.value === 'no-defect'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>No Defect</span>
                                                </label>
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bedrooms.${bedroomKey}.q2.value`}
                                                        value="not-available"
                                                        checked={bedroom.q2.value === 'not-available'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>Not Avaliable</span>
                                                </label>
                                            </div>
                                            <input className='input' placeholder='remark' type="text" name={`area.bedrooms.${bedroomKey}.q2.remark`} id={`area.bedrooms.${bedroomKey}.q2.remark`} value={bedroom.q2.remark} onChange={handleChange} />
                                        </div>

                                        <div className="card w-auto flex-[2]">
                                            <div className="card-header">
                                                <div className="card-title">
                                                    Defect Photos
                                                </div>
                                            </div>
                                            <div className="card-body">
                                                {/* <div className="badge">Add Attachments</div> */}

                                                <input
                                                    className="file-input file-input-sm badge mb-2"
                                                    // multiple={true}
                                                    type="file"
                                                    accept="image/*"
                                                    name={`area.bedrooms.${bedroomKey}.q2.attachments`}
                                                    onChange={(e) => handleFileUpload(e, 'bedrooms', 'q2', bedroomKey)}
                                                />

                                                <div className="flex flex-col mb-4">
                                                    {formData.area?.bedrooms?.[bedroomKey]?.q2?.attachments && Object.entries(formData.area.bedrooms[bedroomKey].q2.attachments).map(([key, uploadedFile]) => (
                                                        <div key={key} className="flex items-center space-x-4 mb-4">
                                                            <div className="flex-1 flex flex-col">
                                                                <a
                                                                    href={AWS_S3_URL + uploadedFile.file_url}
                                                                    className="text-slate-700"
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    {uploadedFile.original_name}
                                                                </a>
                                                                <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                                    <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                                </div>
                                                            </div>
                                                            <button
                                                                className="px-2 py-2 rounded"
                                                                onClick={() => handleDelete(key, 'bedrooms', 'q2', bedroomKey)}
                                                            >
                                                                <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                            </button>
                                                        </div>
                                                    ))}

                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                                        <div className="flex flex-col flex-[3]">
                                            <span className='mb-2'>3. Ceiling</span>
                                            <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                                {isAreaErrors(errors.area) && errors.area.bedrooms?.[bedroomKey]?.q3?.value && (
                                                    <span className="text-red-500 text-xs mt-2">
                                                        {errors.area.bedrooms[bedroomKey].q3.value}
                                                    </span>
                                                )}
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bedrooms.${bedroomKey}.q3.value`}
                                                        value="has-defect"
                                                        checked={bedroom.q3.value === 'has-defect'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>Has Defect</span>
                                                </label>
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bedrooms.${bedroomKey}.q3.value`}
                                                        value="no-defect"
                                                        checked={bedroom.q3.value === 'no-defect'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>No Defect</span>
                                                </label>
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bedrooms.${bedroomKey}.q3.value`}
                                                        value="not-available"
                                                        checked={bedroom.q3.value === 'not-available'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>Not Avaliable</span>
                                                </label>
                                            </div>
                                            <input className='input' placeholder='remark' type="text" name={`area.bedrooms.${bedroomKey}.q3.remark`} id={`area.bedrooms.${bedroomKey}.q3.remark`} value={bedroom.q3.remark} onChange={handleChange} />
                                        </div>

                                        <div className="card w-auto flex-[2]">
                                            <div className="card-header">
                                                <div className="card-title">
                                                    Defect Photos
                                                </div>
                                            </div>
                                            <div className="card-body">
                                                {/* <div className="badge">Add Attachments</div> */}

                                                <input
                                                    className="file-input file-input-sm badge mb-2"
                                                    // multiple={true}
                                                    type="file"
                                                    accept="image/*"
                                                    name={`area.bedrooms.${bedroomKey}.q3.attachments`}
                                                    onChange={(e) => handleFileUpload(e, 'bedrooms', 'q3', bedroomKey)}
                                                />

                                                <div className="flex flex-col mb-4">
                                                    {formData.area?.bedrooms?.[bedroomKey]?.q3?.attachments && Object.entries(formData.area.bedrooms[bedroomKey].q3.attachments).map(([key, uploadedFile]) => (
                                                        <div key={key} className="flex items-center space-x-4 mb-4">
                                                            <div className="flex-1 flex flex-col">
                                                                <a
                                                                    href={AWS_S3_URL + uploadedFile.file_url}
                                                                    className="text-slate-700"
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    {uploadedFile.original_name}
                                                                </a>
                                                                <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                                    <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                                </div>
                                                            </div>
                                                            <button
                                                                className="px-2 py-2 rounded"
                                                                onClick={() => handleDelete(key, 'bedrooms', 'q3', bedroomKey)}
                                                            >
                                                                <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                            </button>
                                                        </div>
                                                    ))}

                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                                        <div className="flex flex-col flex-[3]">
                                            <span className='mb-2'>4. Electrical & wiring (plug point, switches, etc)</span>
                                            <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                                {isAreaErrors(errors.area) && errors.area.bedrooms?.[bedroomKey]?.q4?.value && (
                                                    <span className="text-red-500 text-xs mt-2">
                                                        {errors.area.bedrooms[bedroomKey].q4.value}
                                                    </span>
                                                )}
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bedrooms.${bedroomKey}.q4.value`}
                                                        value="has-defect"
                                                        checked={bedroom.q4.value === 'has-defect'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>Has Defect</span>
                                                </label>
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bedrooms.${bedroomKey}.q4.value`}
                                                        value="no-defect"
                                                        checked={bedroom.q4.value === 'no-defect'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>No Defect</span>
                                                </label>
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bedrooms.${bedroomKey}.q4.value`}
                                                        value="not-available"
                                                        checked={bedroom.q4.value === 'not-available'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>Not Avaliable</span>
                                                </label>
                                            </div>
                                            <input className='input' placeholder='remark' type="text" name={`area.bedrooms.${bedroomKey}.q4.remark`} id={`area.bedrooms.${bedroomKey}.q4.remark`} value={bedroom.q4.remark} onChange={handleChange} />
                                        </div>

                                        <div className="card w-auto flex-[2]">
                                            <div className="card-header">
                                                <div className="card-title">
                                                    Defect Photos
                                                </div>
                                            </div>
                                            <div className="card-body">
                                                {/* <div className="badge">Add Attachments</div> */}

                                                <input
                                                    className="file-input file-input-sm badge mb-2"
                                                    // multiple={true}
                                                    type="file"
                                                    accept="image/*"
                                                    name={`area.bedrooms.${bedroomKey}.q4.attachments`}
                                                    onChange={(e) => handleFileUpload(e, 'bedrooms', 'q4', bedroomKey)}
                                                />

                                                <div className="flex flex-col mb-4">
                                                    {formData.area?.bedrooms?.[bedroomKey]?.q4?.attachments && Object.entries(formData.area.bedrooms[bedroomKey].q4.attachments).map(([key, uploadedFile]) => (
                                                        <div key={key} className="flex items-center space-x-4 mb-4">
                                                            <div className="flex-1 flex flex-col">
                                                                <a
                                                                    href={AWS_S3_URL + uploadedFile.file_url}
                                                                    className="text-slate-700"
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    {uploadedFile.original_name}
                                                                </a>
                                                                <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                                    <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                                </div>
                                                            </div>
                                                            <button
                                                                className="px-2 py-2 rounded"
                                                                onClick={() => handleDelete(key, 'bedrooms', 'q4', bedroomKey)}
                                                            >
                                                                <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                            </button>
                                                        </div>
                                                    ))}

                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                                        <div className="flex flex-col flex-[3]">
                                            <span className='mb-2'>5. Door (Frame, panel, handle, accessories, etc)</span>
                                            <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                                {isAreaErrors(errors.area) && errors.area.bedrooms?.[bedroomKey]?.q5?.value && (
                                                    <span className="text-red-500 text-xs mt-2">
                                                        {errors.area.bedrooms[bedroomKey].q5.value}
                                                    </span>
                                                )}
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bedrooms.${bedroomKey}.q5.value`}
                                                        value="has-defect"
                                                        checked={bedroom.q5.value === 'has-defect'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>Has Defect</span>
                                                </label>
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bedrooms.${bedroomKey}.q5.value`}
                                                        value="no-defect"
                                                        checked={bedroom.q5.value === 'no-defect'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>No Defect</span>
                                                </label>
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bedrooms.${bedroomKey}.q5.value`}
                                                        value="not-available"
                                                        checked={bedroom.q5.value === 'not-available'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>Not Avaliable</span>
                                                </label>
                                            </div>
                                            <input className='input' placeholder='remark' type="text" name={`area.bedrooms.${bedroomKey}.q5.remark`} id={`area.bedrooms.${bedroomKey}.q5.remark`} value={bedroom.q5.remark} onChange={handleChange} />
                                        </div>

                                        <div className="card w-auto flex-[2]">
                                            <div className="card-header">
                                                <div className="card-title">
                                                    Defect Photos
                                                </div>
                                            </div>
                                            <div className="card-body">
                                                {/* <div className="badge">Add Attachments</div> */}

                                                <input
                                                    className="file-input file-input-sm badge mb-2"
                                                    // multiple={true}
                                                    type="file"
                                                    accept="image/*"
                                                    name={`area.bedrooms.${bedroomKey}.q5.attachments`}
                                                    onChange={(e) => handleFileUpload(e, 'bedrooms', 'q5', bedroomKey)}
                                                />

                                                <div className="flex flex-col mb-4">
                                                    {formData.area?.bedrooms?.[bedroomKey]?.q5?.attachments && Object.entries(formData.area.bedrooms[bedroomKey].q5.attachments).map(([key, uploadedFile]) => (
                                                        <div key={key} className="flex items-center space-x-4 mb-4">
                                                            <div className="flex-1 flex flex-col">
                                                                <a
                                                                    href={AWS_S3_URL + uploadedFile.file_url}
                                                                    className="text-slate-700"
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    {uploadedFile.original_name}
                                                                </a>
                                                                <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                                    <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                                </div>
                                                            </div>
                                                            <button
                                                                className="px-2 py-2 rounded"
                                                                onClick={() => handleDelete(key, 'bedrooms', 'q5', bedroomKey)}
                                                            >
                                                                <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                            </button>
                                                        </div>
                                                    ))}

                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                                        <div className="flex flex-col flex-[3]">
                                            <span className='mb-2'>6. Window (Frame, panel, handle, accessories, etc)</span>
                                            <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                                {isAreaErrors(errors.area) && errors.area.bedrooms?.[bedroomKey]?.q6?.value && (
                                                    <span className="text-red-500 text-xs mt-2">
                                                        {errors.area.bedrooms[bedroomKey].q6.value}
                                                    </span>
                                                )}
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bedrooms.${bedroomKey}.q6.value`}
                                                        value="has-defect"
                                                        checked={bedroom.q6.value === 'has-defect'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>Has Defect</span>
                                                </label>
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bedrooms.${bedroomKey}.q6.value`}
                                                        value="no-defect"
                                                        checked={bedroom.q6.value === 'no-defect'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>No Defect</span>
                                                </label>
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bedrooms.${bedroomKey}.q6.value`}
                                                        value="not-available"
                                                        checked={bedroom.q6.value === 'not-available'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>Not Avaliable</span>
                                                </label>
                                            </div>
                                            <input className='input' placeholder='remark' type="text" name={`area.bedrooms.${bedroomKey}.q6.remark`} id={`area.bedrooms.${bedroomKey}.q6.remark`} value={bedroom.q6.remark} onChange={handleChange} />
                                        </div>

                                        <div className="card w-auto flex-[2]">
                                            <div className="card-header">
                                                <div className="card-title">
                                                    Defect Photos
                                                </div>
                                            </div>
                                            <div className="card-body">
                                                {/* <div className="badge">Add Attachments</div> */}

                                                <input
                                                    className="file-input file-input-sm badge mb-2"
                                                    // multiple={true}
                                                    type="file"
                                                    accept="image/*"
                                                    name={`area.bedrooms.${bedroomKey}.q6.attachments`}
                                                    onChange={(e) => handleFileUpload(e, 'bedrooms', 'q6', bedroomKey)}
                                                />

                                                <div className="flex flex-col mb-4">
                                                    {formData.area?.bedrooms?.[bedroomKey]?.q6?.attachments && Object.entries(formData.area.bedrooms[bedroomKey].q6.attachments).map(([key, uploadedFile]) => (
                                                        <div key={key} className="flex items-center space-x-4 mb-4">
                                                            <div className="flex-1 flex flex-col">
                                                                <a
                                                                    href={AWS_S3_URL + uploadedFile.file_url}
                                                                    className="text-slate-700"
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    {uploadedFile.original_name}
                                                                </a>
                                                                <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                                    <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                                </div>
                                                            </div>
                                                            <button
                                                                className="px-2 py-2 rounded"
                                                                onClick={() => handleDelete(key, 'bedrooms', 'q6', bedroomKey)}
                                                            >
                                                                <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                            </button>
                                                        </div>
                                                    ))}

                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                                        <div className="flex flex-col flex-[3]">
                                            <span className='mb-2'>7. Air conditioner</span>
                                            <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                                {isAreaErrors(errors.area) && errors.area.bedrooms?.[bedroomKey]?.q7?.value && (
                                                    <span className="text-red-500 text-xs mt-2">
                                                        {errors.area.bedrooms[bedroomKey].q7.value}
                                                    </span>
                                                )}
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bedrooms.${bedroomKey}.q7.value`}
                                                        value="has-defect"
                                                        checked={bedroom.q7.value === 'has-defect'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>Has Defect</span>
                                                </label>
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bedrooms.${bedroomKey}.q7.value`}
                                                        value="no-defect"
                                                        checked={bedroom.q7.value === 'no-defect'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>No Defect</span>
                                                </label>
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bedrooms.${bedroomKey}.q7.value`}
                                                        value="not-available"
                                                        checked={bedroom.q7.value === 'not-available'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>Not Avaliable</span>
                                                </label>
                                            </div>
                                            <input className='input' placeholder='remark' type="text" name={`area.bedrooms.${bedroomKey}.q7.remark`} id={`area.bedrooms.${bedroomKey}.q7.remark`} value={bedroom.q7.remark} onChange={handleChange} />
                                        </div>

                                        <div className="card w-auto flex-[2]">
                                            <div className="card-header">
                                                <div className="card-title">
                                                    Defect Photos
                                                </div>
                                            </div>
                                            <div className="card-body">
                                                {/* <div className="badge">Add Attachments</div> */}

                                                <input
                                                    className="file-input file-input-sm badge mb-2"
                                                    // multiple={true}
                                                    type="file"
                                                    accept="image/*"
                                                    name={`area.bedrooms.${bedroomKey}.q7.attachments`}
                                                    onChange={(e) => handleFileUpload(e, 'bedrooms', 'q7', bedroomKey)}
                                                />

                                                <div className="flex flex-col mb-4">
                                                    {formData.area?.bedrooms?.[bedroomKey]?.q7?.attachments && Object.entries(formData.area.bedrooms[bedroomKey].q7.attachments).map(([key, uploadedFile]) => (
                                                        <div key={key} className="flex items-center space-x-4 mb-4">
                                                            <div className="flex-1 flex flex-col">
                                                                <a
                                                                    href={AWS_S3_URL + uploadedFile.file_url}
                                                                    className="text-slate-700"
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    {uploadedFile.original_name}
                                                                </a>
                                                                <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                                    <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                                </div>
                                                            </div>
                                                            <button
                                                                className="px-2 py-2 rounded"
                                                                onClick={() => handleDelete(key, 'bedrooms', 'q7', bedroomKey)}
                                                            >
                                                                <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                            </button>
                                                        </div>
                                                    ))}

                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                                        <div className="flex flex-col flex-[3]">
                                            <span className='mb-2'>8. Air conditioner turned on for 2 hours or more</span>
                                            <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                                {isAreaErrors(errors.area) && errors.area.bedrooms?.[bedroomKey]?.q8?.value && (
                                                    <span className="text-red-500 text-xs mt-2">
                                                        {errors.area.bedrooms[bedroomKey].q8.value}
                                                    </span>
                                                )}
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bedrooms.${bedroomKey}.q8.value`}
                                                        value="yes"
                                                        checked={bedroom.q8.value === 'yes'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>Yes</span>
                                                </label>
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bedrooms.${bedroomKey}.q8.value`}
                                                        value="not-available"
                                                        checked={bedroom.q8.value === 'not-available'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>Not Avaliable</span>
                                                </label>
                                            </div>
                                            <input className='input' placeholder='remark' type="text" name={`area.bedrooms.${bedroomKey}.q8.remark`} id={`area.bedrooms.${bedroomKey}.q8.remark`} value={bedroom.q8.remark} onChange={handleChange} />
                                        </div>

                                        <div className="card w-auto flex-[2]">
                                            <div className="card-header">
                                                <div className="card-title">
                                                    Defect Photos
                                                </div>
                                            </div>
                                            <div className="card-body">
                                                {/* <div className="badge">Add Attachments</div> */}

                                                <input
                                                    className="file-input file-input-sm badge mb-2"
                                                    // multiple={true}
                                                    type="file"
                                                    accept="image/*"
                                                    name={`area.bedrooms.${bedroomKey}.q8.attachments`}
                                                    onChange={(e) => handleFileUpload(e, 'bedrooms', 'q8', bedroomKey)}
                                                />

                                                <div className="flex flex-col mb-4">
                                                    {formData.area?.bedrooms?.[bedroomKey]?.q8?.attachments && Object.entries(formData.area.bedrooms[bedroomKey].q8.attachments).map(([key, uploadedFile]) => (
                                                        <div key={key} className="flex items-center space-x-4 mb-4">
                                                            <div className="flex-1 flex flex-col">
                                                                <a
                                                                    href={AWS_S3_URL + uploadedFile.file_url}
                                                                    className="text-slate-700"
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    {uploadedFile.original_name}
                                                                </a>
                                                                <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                                    <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                                </div>
                                                            </div>
                                                            <button
                                                                className="px-2 py-2 rounded"
                                                                onClick={() => handleDelete(key, 'bedrooms', 'q8', bedroomKey)}
                                                            >
                                                                <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                            </button>
                                                        </div>
                                                    ))}

                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                                        <div className="flex flex-col flex-[3]">
                                            <span className='mb-2'>9. Other</span>
                                            <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                                {isAreaErrors(errors.area) && errors.area.bedrooms?.[bedroomKey]?.q9?.value && (
                                                    <span className="text-red-500 text-xs mt-2">
                                                        {errors.area.bedrooms[bedroomKey].q9.value}
                                                    </span>
                                                )}
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bedrooms.${bedroomKey}.q9.value`}
                                                        value="has-defect"
                                                        checked={bedroom.q9.value === 'has-defect'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>Has Defect</span>
                                                </label>
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bedrooms.${bedroomKey}.q9.value`}
                                                        value="no-defect"
                                                        checked={bedroom.q9.value === 'no-defect'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>No Defect</span>
                                                </label>
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bedrooms.${bedroomKey}.q9.value`}
                                                        value="not-available"
                                                        checked={bedroom.q9.value === 'not-available'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>Not Avaliable</span>
                                                </label>
                                            </div>
                                            <input className='input' placeholder='remark' type="text" name={`area.bedrooms.${bedroomKey}.q9.remark`} id={`area.bedrooms.${bedroomKey}.q9.remark`} value={bedroom.q9.remark} onChange={handleChange} />
                                        </div>

                                        <div className="card w-auto flex-[2]">
                                            <div className="card-header">
                                                <div className="card-title">
                                                    Defect Photos
                                                </div>
                                            </div>
                                            <div className="card-body">
                                                {/* <div className="badge">Add Attachments</div> */}

                                                <input
                                                    className="file-input file-input-sm badge mb-2"
                                                    // multiple={true}
                                                    type="file"
                                                    accept="image/*"
                                                    name={`area.bedrooms.${bedroomKey}.q9.attachments`}
                                                    onChange={(e) => handleFileUpload(e, 'bedrooms', 'q9', bedroomKey)}
                                                />

                                                <div className="flex flex-col mb-4">
                                                    {formData.area?.bedrooms?.[bedroomKey]?.q9?.attachments && Object.entries(formData.area.bedrooms[bedroomKey].q9.attachments).map(([key, uploadedFile]) => (
                                                        <div key={key} className="flex items-center space-x-4 mb-4">
                                                            <div className="flex-1 flex flex-col">
                                                                <a
                                                                    href={AWS_S3_URL + uploadedFile.file_url}
                                                                    className="text-slate-700"
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    {uploadedFile.original_name}
                                                                </a>
                                                                <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                                    <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                                </div>
                                                            </div>
                                                            <button
                                                                className="px-2 py-2 rounded"
                                                                onClick={() => handleDelete(key, 'bedrooms', 'q9', bedroomKey)}
                                                            >
                                                                <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                            </button>
                                                        </div>
                                                    ))}

                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="hidden" id="stepper_9">
                    <div className="flex flex-col">
                        <div className="flex flex-col mb-8">
                            <h2 className='text-xl font-bold'>8. Bathroom</h2>
                            <h2 className='text-md font-semibold'>The bathroom number is based on the Bathroom Count on the top</h2>
                        </div>

                        {Object.keys(formData.area?.bathrooms || {}).map((bathroomKey) => {
                            const bathroom = formData.area?.bathrooms[bathroomKey];
                            return (
                                <div key={bathroomKey}>
                                    <div className="flex flex-col mb-8">
                                        <h2 className='text-xl font-bold'>{bathroomKey.charAt(0).toUpperCase() + bathroomKey.slice(1)}</h2>
                                    </div>

                                    <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                                        <div className="flex flex-col flex-[3]">
                                            <span className='mb-2'>1. Floor (Floor trap, etc)</span>
                                            <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                                {isAreaErrors(errors.area) && errors.area.bathrooms?.[bathroomKey]?.q1?.value && (
                                                    <span className="text-red-500 text-xs mt-2">
                                                        {errors.area.bathrooms[bathroomKey].q1.value}
                                                    </span>
                                                )}
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bathrooms.${bathroomKey}.q1.value`}
                                                        value="has-defect"
                                                        checked={bathroom.q1.value === 'has-defect'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>Has Defect</span>
                                                </label>
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bathrooms.${bathroomKey}.q1.value`}
                                                        value="no-defect"
                                                        checked={bathroom.q1.value === 'no-defect'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>No Defect</span>
                                                </label>
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bathrooms.${bathroomKey}.q1.value`}
                                                        value="not-available"
                                                        checked={bathroom.q1.value === 'not-available'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>Not Avaliable</span>
                                                </label>
                                            </div>
                                            <input className='input' placeholder='remark' type="text" name={`area.bathrooms.${bathroomKey}.q1.remark`} id={`area.bathrooms.${bathroomKey}.q1.remark`} value={bathroom.q1.remark} onChange={handleChange} />
                                        </div>

                                        <div className="card w-auto flex-[2]">
                                            <div className="card-header">
                                                <div className="card-title">
                                                    Defect Photos
                                                </div>
                                            </div>
                                            <div className="card-body">
                                                {/* <div className="badge">Add Attachments</div> */}

                                                <input
                                                    className="file-input file-input-sm badge mb-2"
                                                    type="file"
                                                    accept="image/*"
                                                    name={`area.bathrooms.${bathroomKey}.q1.attachments`}
                                                    onChange={(e) => handleFileUpload(e, 'bathrooms', 'q1', bathroomKey)}
                                                />

                                                <div className="flex flex-col mb-4">
                                                    {formData.area?.bathrooms?.[bathroomKey]?.q1?.attachments && Object.entries(formData.area.bathrooms[bathroomKey].q1.attachments).map(([key, uploadedFile]) => (
                                                        <div key={key} className="flex items-center space-x-4 mb-4">
                                                            <div className="flex-1 flex flex-col">
                                                                <a
                                                                    href={AWS_S3_URL + uploadedFile.file_url}
                                                                    className="text-slate-700"
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    {uploadedFile.original_name}
                                                                </a>
                                                                <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                                    <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                                </div>
                                                            </div>
                                                            <button
                                                                className="px-2 py-2 rounded"
                                                                onClick={() => handleDelete(key, 'bathrooms', 'q1', bathroomKey)}
                                                            >
                                                                <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                            </button>
                                                        </div>
                                                    ))}

                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                                        <div className="flex flex-col flex-[3]">
                                            <span className='mb-2'>2. Wall & ceiling</span>
                                            <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                                {isAreaErrors(errors.area) && errors.area.bathrooms?.[bathroomKey]?.q2?.value && (
                                                    <span className="text-red-500 text-xs mt-2">
                                                        {errors.area.bathrooms[bathroomKey].q2.value}
                                                    </span>
                                                )}
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bathrooms.${bathroomKey}.q2.value`}
                                                        value="has-defect"
                                                        checked={bathroom.q2.value === 'has-defect'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>Has Defect</span>
                                                </label>
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bathrooms.${bathroomKey}.q2.value`}
                                                        value="no-defect"
                                                        checked={bathroom.q2.value === 'no-defect'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>No Defect</span>
                                                </label>
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bathrooms.${bathroomKey}.q2.value`}
                                                        value="not-available"
                                                        checked={bathroom.q2.value === 'not-available'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>Not Avaliable</span>
                                                </label>
                                            </div>
                                            <input className='input' placeholder='remark' type="text" name={`area.bathrooms.${bathroomKey}.q2.remark`} id={`area.bathrooms.${bathroomKey}.q2.remark`} value={bathroom.q2.remark} onChange={handleChange} />
                                        </div>

                                        <div className="card w-auto flex-[2]">
                                            <div className="card-header">
                                                <div className="card-title">
                                                    Defect Photos
                                                </div>
                                            </div>
                                            <div className="card-body">
                                                {/* <div className="badge">Add Attachments</div> */}

                                                <input
                                                    className="file-input file-input-sm badge mb-2"
                                                    // multiple={true}
                                                    type="file"
                                                    accept="image/*"
                                                    name={`area.bathrooms.${bathroomKey}.q2.attachments`}
                                                    onChange={(e) => handleFileUpload(e, 'bathrooms', 'q2', bathroomKey)}
                                                />

                                                <div className="flex flex-col mb-4">
                                                    {formData.area?.bathrooms?.[bathroomKey]?.q2?.attachments && Object.entries(formData.area.bathrooms[bathroomKey].q2.attachments).map(([key, uploadedFile]) => (
                                                        <div key={key} className="flex items-center space-x-4 mb-4">
                                                            <div className="flex-1 flex flex-col">
                                                                <a
                                                                    href={AWS_S3_URL + uploadedFile.file_url}
                                                                    className="text-slate-700"
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    {uploadedFile.original_name}
                                                                </a>
                                                                <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                                    <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                                </div>
                                                            </div>
                                                            <button
                                                                className="px-2 py-2 rounded"
                                                                onClick={() => handleDelete(key, 'bathrooms', 'q2', bathroomKey)}
                                                            >
                                                                <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                            </button>
                                                        </div>
                                                    ))}

                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                                        <div className="flex flex-col flex-[3]">
                                            <span className='mb-2'>3. Door (Frame, panel, handle, accessories, etc)</span>
                                            <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                                {isAreaErrors(errors.area) && errors.area.bathrooms?.[bathroomKey]?.q3?.value && (
                                                    <span className="text-red-500 text-xs mt-2">
                                                        {errors.area.bathrooms[bathroomKey].q3.value}
                                                    </span>
                                                )}
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bathrooms.${bathroomKey}.q3.value`}
                                                        value="has-defect"
                                                        checked={bathroom.q3.value === 'has-defect'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>Has Defect</span>
                                                </label>
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bathrooms.${bathroomKey}.q3.value`}
                                                        value="no-defect"
                                                        checked={bathroom.q3.value === 'no-defect'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>No Defect</span>
                                                </label>
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bathrooms.${bathroomKey}.q3.value`}
                                                        value="not-available"
                                                        checked={bathroom.q3.value === 'not-available'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>Not Avaliable</span>
                                                </label>
                                            </div>
                                            <input className='input' placeholder='remark' type="text" name={`area.bathrooms.${bathroomKey}.q3.remark`} id={`area.bathrooms.${bathroomKey}.q3.remark`} value={bathroom.q3.remark} onChange={handleChange} />
                                        </div>

                                        <div className="card w-auto flex-[2]">
                                            <div className="card-header">
                                                <div className="card-title">
                                                    Defect Photos
                                                </div>
                                            </div>
                                            <div className="card-body">
                                                {/* <div className="badge">Add Attachments</div> */}

                                                <input
                                                    className="file-input file-input-sm badge mb-2"
                                                    // multiple={true}
                                                    type="file"
                                                    accept="image/*"
                                                    name={`area.bathrooms.${bathroomKey}.q3.attachments`}
                                                    onChange={(e) => handleFileUpload(e, 'bathrooms', 'q3', bathroomKey)}
                                                />

                                                <div className="flex flex-col mb-4">
                                                    {formData.area?.bathrooms?.[bathroomKey]?.q3?.attachments && Object.entries(formData.area.bathrooms[bathroomKey].q3.attachments).map(([key, uploadedFile]) => (
                                                        <div key={key} className="flex items-center space-x-4 mb-4">
                                                            <div className="flex-1 flex flex-col">
                                                                <a
                                                                    href={AWS_S3_URL + uploadedFile.file_url}
                                                                    className="text-slate-700"
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    {uploadedFile.original_name}
                                                                </a>
                                                                <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                                    <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                                </div>
                                                            </div>
                                                            <button
                                                                className="px-2 py-2 rounded"
                                                                onClick={() => handleDelete(key, 'bathrooms', 'q3', bathroomKey)}
                                                            >
                                                                <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                            </button>
                                                        </div>
                                                    ))}

                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                                        <div className="flex flex-col flex-[3]">
                                            <span className='mb-2'>4. Window (Frame, panel, handle, accessories, etc)</span>
                                            <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                                {isAreaErrors(errors.area) && errors.area.bathrooms?.[bathroomKey]?.q4?.value && (
                                                    <span className="text-red-500 text-xs mt-2">
                                                        {errors.area.bathrooms[bathroomKey].q4.value}
                                                    </span>
                                                )}
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bathrooms.${bathroomKey}.q4.value`}
                                                        value="has-defect"
                                                        checked={bathroom.q4.value === 'has-defect'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>Has Defect</span>
                                                </label>
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bathrooms.${bathroomKey}.q4.value`}
                                                        value="no-defect"
                                                        checked={bathroom.q4.value === 'no-defect'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>No Defect</span>
                                                </label>
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bathrooms.${bathroomKey}.q4.value`}
                                                        value="not-available"
                                                        checked={bathroom.q4.value === 'not-available'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>Not Avaliable</span>
                                                </label>
                                            </div>
                                            <input className='input' placeholder='remark' type="text" name={`area.bathrooms.${bathroomKey}.q4.remark`} id={`area.bathrooms.${bathroomKey}.q4.remark`} value={bathroom.q4.remark} onChange={handleChange} />
                                        </div>

                                        <div className="card w-auto flex-[2]">
                                            <div className="card-header">
                                                <div className="card-title">
                                                    Defect Photos
                                                </div>
                                            </div>
                                            <div className="card-body">
                                                {/* <div className="badge">Add Attachments</div> */}

                                                <input
                                                    className="file-input file-input-sm badge mb-2"
                                                    // multiple={true}
                                                    type="file"
                                                    accept="image/*"
                                                    name={`area.bathrooms.${bathroomKey}.q4.attachments`}
                                                    onChange={(e) => handleFileUpload(e, 'bathrooms', 'q4', bathroomKey)}
                                                />

                                                <div className="flex flex-col mb-4">
                                                    {formData.area?.bathrooms?.[bathroomKey]?.q4?.attachments && Object.entries(formData.area.bathrooms[bathroomKey].q4.attachments).map(([key, uploadedFile]) => (
                                                        <div key={key} className="flex items-center space-x-4 mb-4">
                                                            <div className="flex-1 flex flex-col">
                                                                <a
                                                                    href={AWS_S3_URL + uploadedFile.file_url}
                                                                    className="text-slate-700"
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    {uploadedFile.original_name}
                                                                </a>
                                                                <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                                    <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                                </div>
                                                            </div>
                                                            <button
                                                                className="px-2 py-2 rounded"
                                                                onClick={() => handleDelete(key, 'bathrooms', 'q4', bathroomKey)}
                                                            >
                                                                <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                            </button>
                                                        </div>
                                                    ))}

                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                                        <div className="flex flex-col flex-[3]">
                                            <span className='mb-2'>5. Electrical & wiring (plug point, switches, etc)</span>
                                            <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                                {isAreaErrors(errors.area) && errors.area.bathrooms?.[bathroomKey]?.q5?.value && (
                                                    <span className="text-red-500 text-xs mt-2">
                                                        {errors.area.bathrooms[bathroomKey].q5.value}
                                                    </span>
                                                )}
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bathrooms.${bathroomKey}.q5.value`}
                                                        value="has-defect"
                                                        checked={bathroom.q5.value === 'has-defect'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>Has Defect</span>
                                                </label>
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bathrooms.${bathroomKey}.q5.value`}
                                                        value="no-defect"
                                                        checked={bathroom.q5.value === 'no-defect'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>No Defect</span>
                                                </label>
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bathrooms.${bathroomKey}.q5.value`}
                                                        value="not-available"
                                                        checked={bathroom.q5.value === 'not-available'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>Not Avaliable</span>
                                                </label>
                                            </div>
                                            <input className='input' placeholder='remark' type="text" name={`area.bathrooms.${bathroomKey}.q5.remark`} id={`area.bathrooms.${bathroomKey}.q5.remark`} value={bathroom.q5.remark} onChange={handleChange} />
                                        </div>

                                        <div className="card w-auto flex-[2]">
                                            <div className="card-header">
                                                <div className="card-title">
                                                    Defect Photos
                                                </div>
                                            </div>
                                            <div className="card-body">
                                                {/* <div className="badge">Add Attachments</div> */}

                                                <input
                                                    className="file-input file-input-sm badge mb-2"
                                                    // multiple={true}
                                                    type="file"
                                                    accept="image/*"
                                                    name={`area.bathrooms.${bathroomKey}.q5.attachments`}
                                                    onChange={(e) => handleFileUpload(e, 'bathrooms', 'q5', bathroomKey)}
                                                />

                                                <div className="flex flex-col mb-4">
                                                    {formData.area?.bathrooms?.[bathroomKey]?.q5?.attachments && Object.entries(formData.area.bathrooms[bathroomKey].q5.attachments).map(([key, uploadedFile]) => (
                                                        <div key={key} className="flex items-center space-x-4 mb-4">
                                                            <div className="flex-1 flex flex-col">
                                                                <a
                                                                    href={AWS_S3_URL + uploadedFile.file_url}
                                                                    className="text-slate-700"
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    {uploadedFile.original_name}
                                                                </a>
                                                                <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                                    <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                                </div>
                                                            </div>
                                                            <button
                                                                className="px-2 py-2 rounded"
                                                                onClick={() => handleDelete(key, 'bathrooms', 'q5', bathroomKey)}
                                                            >
                                                                <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                            </button>
                                                        </div>
                                                    ))}

                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                                        <div className="flex flex-col flex-[3]">
                                            <span className='mb-2'>6. Sanitary ware (Basin, bidet, tap, WC, shower, etc)</span>
                                            <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                                {isAreaErrors(errors.area) && errors.area.bathrooms?.[bathroomKey]?.q6?.value && (
                                                    <span className="text-red-500 text-xs mt-2">
                                                        {errors.area.bathrooms[bathroomKey].q6.value}
                                                    </span>
                                                )}
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bathrooms.${bathroomKey}.q6.value`}
                                                        value="has-defect"
                                                        checked={bathroom.q6.value === 'has-defect'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>Has Defect</span>
                                                </label>
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bathrooms.${bathroomKey}.q6.value`}
                                                        value="no-defect"
                                                        checked={bathroom.q6.value === 'no-defect'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>No Defect</span>
                                                </label>
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bathrooms.${bathroomKey}.q6.value`}
                                                        value="not-available"
                                                        checked={bathroom.q6.value === 'not-available'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>Not Avaliable</span>
                                                </label>
                                            </div>
                                            <input className='input' placeholder='remark' type="text" name={`area.bathrooms.${bathroomKey}.q6.remark`} id={`area.bathrooms.${bathroomKey}.q6.remark`} value={bathroom.q6.remark} onChange={handleChange} />
                                        </div>

                                        <div className="card w-auto flex-[2]">
                                            <div className="card-header">
                                                <div className="card-title">
                                                    Defect Photos
                                                </div>
                                            </div>
                                            <div className="card-body">
                                                {/* <div className="badge">Add Attachments</div> */}

                                                <input
                                                    className="file-input file-input-sm badge mb-2"
                                                    // multiple={true}
                                                    type="file"
                                                    accept="image/*"
                                                    name={`area.bathrooms.${bathroomKey}.q6.attachments`}
                                                    onChange={(e) => handleFileUpload(e, 'bathrooms', 'q6', bathroomKey)}
                                                />

                                                <div className="flex flex-col mb-4">
                                                    {formData.area?.bathrooms?.[bathroomKey]?.q6?.attachments && Object.entries(formData.area.bathrooms[bathroomKey].q6.attachments).map(([key, uploadedFile]) => (
                                                        <div key={key} className="flex items-center space-x-4 mb-4">
                                                            <div className="flex-1 flex flex-col">
                                                                <a
                                                                    href={AWS_S3_URL + uploadedFile.file_url}
                                                                    className="text-slate-700"
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    {uploadedFile.original_name}
                                                                </a>
                                                                <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                                    <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                                </div>
                                                            </div>
                                                            <button
                                                                className="px-2 py-2 rounded"
                                                                onClick={() => handleDelete(key, 'bathrooms', 'q6', bathroomKey)}
                                                            >
                                                                <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                            </button>
                                                        </div>
                                                    ))}

                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                                        <div className="flex flex-col flex-[3]">
                                            <span className='mb-2'>7. Piping & water flow (Basin, bidet, tap, WC, shower, etc)</span>
                                            <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                                {isAreaErrors(errors.area) && errors.area.bathrooms?.[bathroomKey]?.q7?.value && (
                                                    <span className="text-red-500 text-xs mt-2">
                                                        {errors.area.bathrooms[bathroomKey].q7.value}
                                                    </span>
                                                )}
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bathrooms.${bathroomKey}.q7.value`}
                                                        value="has-defect"
                                                        checked={bathroom.q7.value === 'has-defect'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>Has Defect</span>
                                                </label>
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bathrooms.${bathroomKey}.q7.value`}
                                                        value="no-defect"
                                                        checked={bathroom.q7.value === 'no-defect'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>No Defect</span>
                                                </label>
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bathrooms.${bathroomKey}.q7.value`}
                                                        value="not-available"
                                                        checked={bathroom.q7.value === 'not-available'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>Not Avaliable</span>
                                                </label>
                                            </div>
                                            <input className='input' placeholder='remark' type="text" name={`area.bathrooms.${bathroomKey}.q7.remark`} id={`area.bathrooms.${bathroomKey}.q7.remark`} value={bathroom.q7.remark} onChange={handleChange} />
                                        </div>

                                        <div className="card w-auto flex-[2]">
                                            <div className="card-header">
                                                <div className="card-title">
                                                    Defect Photos
                                                </div>
                                            </div>
                                            <div className="card-body">
                                                {/* <div className="badge">Add Attachments</div> */}

                                                <input
                                                    className="file-input file-input-sm badge mb-2"
                                                    // multiple={true}
                                                    type="file"
                                                    accept="image/*"
                                                    name={`area.bathrooms.${bathroomKey}.q7.attachments`}
                                                    onChange={(e) => handleFileUpload(e, 'bathrooms', 'q7', bathroomKey)}
                                                />

                                                <div className="flex flex-col mb-4">
                                                    {formData.area?.bathrooms?.[bathroomKey]?.q7?.attachments && Object.entries(formData.area.bathrooms[bathroomKey].q7.attachments).map(([key, uploadedFile]) => (
                                                        <div key={key} className="flex items-center space-x-4 mb-4">
                                                            <div className="flex-1 flex flex-col">
                                                                <a
                                                                    href={AWS_S3_URL + uploadedFile.file_url}
                                                                    className="text-slate-700"
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    {uploadedFile.original_name}
                                                                </a>
                                                                <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                                    <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                                </div>
                                                            </div>
                                                            <button
                                                                className="px-2 py-2 rounded"
                                                                onClick={() => handleDelete(key, 'bathrooms', 'q7', bathroomKey)}
                                                            >
                                                                <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                            </button>
                                                        </div>
                                                    ))}

                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                                        <div className="flex flex-col flex-[3]">
                                            <span className='mb-2'>8. Shower screen (Panel, frame, accessories, etc)</span>
                                            <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                                {isAreaErrors(errors.area) && errors.area.bathrooms?.[bathroomKey]?.q8?.value && (
                                                    <span className="text-red-500 text-xs mt-2">
                                                        {errors.area.bathrooms[bathroomKey].q8.value}
                                                    </span>
                                                )}
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bathrooms.${bathroomKey}.q8.value`}
                                                        value="has-defect"
                                                        checked={bathroom.q8.value === 'has-defect'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>Has Defect</span>
                                                </label>
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bathrooms.${bathroomKey}.q8.value`}
                                                        value="no-defect"
                                                        checked={bathroom.q8.value === 'no-defect'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>No Defect</span>
                                                </label>
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bathrooms.${bathroomKey}.q8.value`}
                                                        value="not-available"
                                                        checked={bathroom.q8.value === 'not-available'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>Not Avaliable</span>
                                                </label>
                                            </div>
                                            <input className='input' placeholder='remark' type="text" name={`area.bathrooms.${bathroomKey}.q8.remark`} id={`area.bathrooms.${bathroomKey}.q8.remark`} value={bathroom.q8.remark} onChange={handleChange} />
                                        </div>

                                        <div className="card w-auto flex-[2]">
                                            <div className="card-header">
                                                <div className="card-title">
                                                    Defect Photos
                                                </div>
                                            </div>
                                            <div className="card-body">
                                                {/* <div className="badge">Add Attachments</div> */}

                                                <input
                                                    className="file-input file-input-sm badge mb-2"
                                                    // multiple={true}
                                                    type="file"
                                                    accept="image/*"
                                                    name={`area.bathrooms.${bathroomKey}.q8.attachments`}
                                                    onChange={(e) => handleFileUpload(e, 'bathrooms', 'q8', bathroomKey)}
                                                />

                                                <div className="flex flex-col mb-4">
                                                    {formData.area?.bathrooms?.[bathroomKey]?.q8?.attachments && Object.entries(formData.area.bathrooms[bathroomKey].q8.attachments).map(([key, uploadedFile]) => (
                                                        <div key={key} className="flex items-center space-x-4 mb-4">
                                                            <div className="flex-1 flex flex-col">
                                                                <a
                                                                    href={AWS_S3_URL + uploadedFile.file_url}
                                                                    className="text-slate-700"
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    {uploadedFile.original_name}
                                                                </a>
                                                                <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                                    <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                                </div>
                                                            </div>
                                                            <button
                                                                className="px-2 py-2 rounded"
                                                                onClick={() => handleDelete(key, 'bathrooms', 'q8', bathroomKey)}
                                                            >
                                                                <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                            </button>
                                                        </div>
                                                    ))}

                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex mb-16 gap-8 flex-col sm:flex-row">
                                        <div className="flex flex-col flex-[3]">
                                            <span className='mb-2'>9. Other</span>
                                            <div className="flex max-sm:flex-wrap max-sm:gap-2 mb-4">
                                                {isAreaErrors(errors.area) && errors.area.bathrooms?.[bathroomKey]?.q9?.value && (
                                                    <span className="text-red-500 text-xs mt-2">
                                                        {errors.area.bathrooms[bathroomKey].q9.value}
                                                    </span>
                                                )}
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bathrooms.${bathroomKey}.q9.value`}
                                                        value="has-defect"
                                                        checked={bathroom.q9.value === 'has-defect'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>Has Defect</span>
                                                </label>
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bathrooms.${bathroomKey}.q9.value`}
                                                        value="no-defect"
                                                        checked={bathroom.q9.value === 'no-defect'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>No Defect</span>
                                                </label>
                                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                    <input
                                                        type="radio"
                                                        name={`area.bathrooms.${bathroomKey}.q9.value`}
                                                        value="not-available"
                                                        checked={bathroom.q9.value === 'not-available'}
                                                        className="radio radio-lg h-4 w-4 text-blue-600"
                                                        onChange={handleChange}
                                                    />
                                                    <span className='text-md'>Not Avaliable</span>
                                                </label>
                                            </div>
                                            <input className='input' placeholder='remark' type="text" name={`area.bathrooms.${bathroomKey}.q9.remark`} id={`area.bathrooms.${bathroomKey}.q9.remark`} value={bathroom.q9.remark} onChange={handleChange} />
                                        </div>

                                        <div className="card w-auto flex-[2]">
                                            <div className="card-header">
                                                <div className="card-title">
                                                    Defect Photos
                                                </div>
                                            </div>
                                            <div className="card-body">
                                                {/* <div className="badge">Add Attachments</div> */}

                                                <input
                                                    className="file-input file-input-sm badge mb-2"
                                                    // multiple={true}
                                                    type="file"
                                                    accept="image/*"
                                                    name={`area.bathrooms.${bathroomKey}.q9.attachments`}
                                                    onChange={(e) => handleFileUpload(e, 'bathrooms', 'q9', bathroomKey)}
                                                />

                                                <div className="flex flex-col mb-4">
                                                    {formData.area?.bathrooms?.[bathroomKey]?.q9?.attachments && Object.entries(formData.area.bathrooms[bathroomKey].q9.attachments).map(([key, uploadedFile]) => (
                                                        <div key={key} className="flex items-center space-x-4 mb-4">
                                                            <div className="flex-1 flex flex-col">
                                                                <a
                                                                    href={AWS_S3_URL + uploadedFile.file_url}
                                                                    className="text-slate-700"
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    {uploadedFile.original_name}
                                                                </a>
                                                                <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
                                                                    <span>{uploadedFile.file_url ? formatFileSize(uploadedFile.size) : 'N/A'}</span>
                                                                </div>
                                                            </div>
                                                            <button
                                                                className="px-2 py-2 rounded"
                                                                onClick={() => handleDelete(key, 'bathrooms', 'q9', bathroomKey)}
                                                            >
                                                                <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
                                                            </button>
                                                        </div>
                                                    ))}

                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2">
                <button
                    className="btn btn-lg btn-secondary rounded-3xl shadow-lg mr-4 stepper-first:hidden"
                    data-stepper-back="true"
                >
                    Back
                </button>

                <button
                    className="btn btn-lg btn-primary rounded-3xl shadow-lg stepper-last:hidden"
                    data-stepper-next="true"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                    Next
                </button>
                <button
                    className="btn btn-lg btn-primary rounded-3xl shadow-lg hidden stepper-last:inline-flex"
                    onClick={handleSubmit}
                >
                    Submit
                </button>
            </div>
        </div>
    );
}

export default DefectInspectionFormPage;