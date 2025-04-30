// import React, { useEffect, useState } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import { Slide, toast } from "react-toastify";
// import { Property, QCForm, User } from "../../types";
// import KTComponents, { KTStepper, KTTabs } from "../../metronic/core";
// import Loading from "../../components/Loading";
// import { user } from "../../services/ownerApi";
// import { fetchRenoProgressDetail } from "../../services/operationApi";

// interface FormErrors {
//     [key: string]: string | FormErrors | undefined; // Use string or undefined for error messages
// }

// const initQCForm: QCForm = {
//     date: new Date().toLocaleDateString('en-GB', {
//         day: '2-digit',
//         month: 'long',
//         year: 'numeric'
//     }),
//     time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
//     property: {
//         property_name: '',
//         other_property_name: '',
//         block: '',
//         level: '',
//         unit: '',
//     },
//     bedroom_count: '1',
//     bathroom_count: '1',
//     include_commune_living: true,
//     inspector_first_name: '',
//     inspector_last_name: '',
//     inspector_role: 'belive',
//     area: {
//         foyer: {
//             s1: {
//                 label: '1. Door & lock (2 sides)',
//                 q1: { label: 'Painting', value: '', remark: '' },
//                 q2: { label: 'Door open & close smoothly', value: '', remark: '' },
//                 q3: { label: 'Door no crack line', value: '', remark: '' },
//                 q4: { label: 'Smart door lock install properly', value: '', remark: '' },
//                 q5: { label: 'Smart door lock with battery & functioning', value: '', remark: '' },
//             },
//             s2: {
//                 label: '2. Floor & skirting',
//                 q1: { label: 'No paint stain', value: '', remark: '' },
//                 q2: { label: 'No scratch', value: '', remark: '' },
//                 q3: { label: 'No holes', value: '', remark: '' },
//                 q4: { label: 'Painting line & corner smooth', value: '', remark: '' },
//                 q5: { label: 'General Cleanliness', value: '', remark: '' },
//             },
//             s3: {
//                 label: '3. Wall & ceiling',
//                 q1: { label: 'No paint stain', value: '', remark: '' },
//                 q2: { label: 'No scratch', value: '', remark: '' },
//                 q3: { label: 'No holes', value: '', remark: '' },
//                 q4: { label: 'Painting line & corner smooth', value: '', remark: '' },
//                 q5: { label: 'General Cleanliness', value: '', remark: '' },
//             },
//             s4: {
//                 label: '4. Lights & switches',
//                 q1: { label: 'All light points are installed', value: '', remark: '' },
//                 q2: { label: 'Light is functioning', value: '', remark: '' },
//                 q3: { label: 'Switches are functioning', value: '', remark: '' },
//                 q4: { label: 'Switches are installed property', value: '', remark: '' },
//             },
//             s5: {
//                 label: '5. Shoe Cabinet, decoration & fire extinguisher',
//                 q1: { label: 'Shoe cabinet surface no scratch', value: '', remark: '' },
//                 q2: { label: 'Shoe cabinet is sturdy, not shaking', value: '', remark: '' },
//                 q3: { label: 'Drawer and door open smoothly', value: '', remark: '' },
//                 q4: { label: 'Decoration nicely placed', value: '', remark: '' },
//                 q5: { label: 'Fire extinguisher 2kg', value: '', remark: '' },
//                 q6: { label: 'Fire extinguisher arrow in green', value: '', remark: '' },
//                 q7: { label: 'Fire extinguisher mounted properly on wall', value: '', remark: '' },
//             },
//             s6: {
//                 label: '6. Smart Meter with label',
//                 q1: { label: 'All smart meter with Room label', value: '', remark: '' },
//                 q2: { label: 'Room 1 - Commissioning accepted', value: '', remark: '' },
//                 q3: { label: 'Room 2 - Commissioning accepted', value: '', remark: '' },
//                 q4: { label: 'Room 3 - Commissioning accepted', value: '', remark: '' },
//                 q5: { label: 'Room 4 - Commissioning accepted', value: '', remark: '' },
//                 q6: { label: 'Room 5 - Commissioning accepted', value: '', remark: '' },
//                 q7: { label: 'Room 6 - Commissioning accepted', value: '', remark: '' },
//             }
//         },
//         kitchen: {
//             s1: {
//                 label: '1. Floor & skirting',
//                 q1: { label: 'No paint stain', value: '', remark: '' },
//                 q2: { label: 'No scratch', value: '', remark: '' },
//                 q3: { label: 'No holes', value: '', remark: '' },
//                 q4: { label: 'Painting line & corner smooth', value: '', remark: '' },
//                 q5: { label: 'General Cleanliness', value: '', remark: '' },
//             },
//             s2: {
//                 label: '2. Wall & ceiling',
//                 q1: { label: 'No paint stain', value: '', remark: '' },
//                 q2: { label: 'No scratch', value: '', remark: '' },
//                 q3: { label: 'No holes', value: '', remark: '' },
//                 q4: { label: 'Painting line & corner smooth', value: '', remark: '' },
//                 q5: { label: 'General Cleanliness', value: '', remark: '' },
//             },
//             s3: {
//                 label: '3. Lights & switches',
//                 q1: { label: 'All light points are installed', value: '', remark: '' },
//                 q2: { label: 'Light is functioning', value: '', remark: '' },
//                 q3: { label: 'Switches are functioning', value: '', remark: '' },
//                 q4: { label: 'Switches are installed property', value: '', remark: '' },
//             },
//             s4: {
//                 label: '4. Kitchen Cabinet, Sink, tap & Pipping',
//                 q1: { label: 'Top cabinet/shelves is there', value: '', remark: '' },
//                 q2: { label: 'Bottom cabinet is there', value: '', remark: '' },
//                 q3: { label: 'Cabinet Surface no scratches or dented', value: '', remark: '' },
//                 q4: { label: 'Door and drawer open and close smoothly		', value: '', remark: '' },
//                 q5: { label: 'Kitchen top no crack, no stain, smooth', value: '', remark: '' },
//                 q6: { label: 'hinges, drawer runner, table top', value: '', remark: '' },
//                 q7: { label: 'Sink and water tap is installed properly', value: '', remark: '' },
//                 q8: { label: 'Water pressure good', value: '', remark: '' },
//                 q9: { label: 'Water outlet', value: '', remark: '' },
//                 q10: { label: 'Plumbing connected and no leaking', value: '', remark: '' },
//                 q11: { label: 'General cleanliness', value: '', remark: '' },
//             },
//             s5: {
//                 label: '5. Hood, Hob, Microwave, water dispenser (front & back)',
//                 q1: { label: 'Hood & hob is installed properly connected to plug', value: '', remark: '' },
//                 q2: { label: 'Hood & hob is functioning', value: '', remark: '' },
//                 q3: { label: 'Microwave is functioning', value: '', remark: '' },
//                 q4: { label: 'Dedicated plug point for microwave', value: '', remark: '' },
//                 q5: { label: 'Water Dispenser hot & cold water', value: '', remark: '' },
//                 q6: { label: 'Water Dispenser no leaking', value: '', remark: '' },
//                 q7: { label: 'Dedicated plug point for water dispenser', value: '', remark: '' },
//                 q8: { label: 'General cleanliness', value: '', remark: '' },
//             },
//         },
//         laundry: {
//             s1: {
//                 label: '1. Light & switches',
//                 q1: { label: 'Lights functioning', value: '', remark: '' },
//                 q2: { label: 'Switches functioning', value: '', remark: '' },
//                 q3: { label: 'General cleanliness', value: '', remark: '' },
//             },
//             s2: {
//                 label: '2. Washer Dryer, inlet & outlet',
//                 q1: { label: 'Installed properly', value: '', remark: '' },
//                 q2: { label: 'No leaking', value: '', remark: '' },
//                 q3: { label: 'Internal no defect', value: '', remark: '' },
//                 q4: { label: 'Test functionality', value: '', remark: '' },
//                 q5: { label: 'General cleanliness and appearance', value: '', remark: '' },
//             },
//             s3: {
//                 label: '3. Cleaning tools',
//                 q1: { label: 'Cleaning tools hanger mounted on wall', value: '', remark: '' },
//                 q2: { label: 'Broom, duster, mop, Bucket, dustbin', value: '', remark: '' },
//                 q3: { label: 'Cleaning cloth', value: '', remark: '' },
//             },
//             s4: {
//                 label: '4. Drying rack',
//                 q1: { label: 'Installed properly', value: '', remark: '' },
//                 q2: { label: 'Drying rack is sturdy', value: '', remark: '' },
//             },
//         },
//         dining: {
//             s1: {
//                 label: '1. Ceiling, wall, lights, fan & switches',
//                 q1: { label: 'No paint stain', value: '', remark: '' },
//                 q2: { label: 'No scratch', value: '', remark: '' },
//                 q3: { label: 'No holes', value: '', remark: '' },
//                 q4: { label: 'Painting line & corner smooth', value: '', remark: '' },
//                 q5: { label: 'Switches are working', value: '', remark: '' },
//                 q6: { label: 'Lights are working', value: '', remark: '' },
//                 q7: { label: 'Fan is working', value: '', remark: '' },
//                 q8: { label: 'General cleanliness', value: '', remark: '' },
//             },
//             s2: {
//                 label: '2. Dinning set & decoration',
//                 q1: { label: 'Dining Table & Chairs sturdy', value: '', remark: '' },
//                 q2: { label: 'Dining Table & Chairs no scratch & chip', value: '', remark: '' },
//                 q3: { label: 'Decoration display', value: '', remark: '' },
//             },
//             s3: {
//                 label: '3. CCTV, Gateway, Router rack',
//                 q1: { label: 'Fiber Optic Cable & 2 Sockets functioning', value: '', remark: '' },
//                 q2: { label: 'WiFi Router Rack installed sturdy', value: '', remark: '' },
//                 q3: { label: 'Gateway is functioning', value: '', remark: '' },
//                 q4: { label: 'CCTV directing maindoor & kitchen', value: '', remark: '' },
//                 q5: { label: 'CCTV with memory card & paired', value: '', remark: '' },
//             },
//             s4: {
//                 label: '4. Others',
//                 other: { value: '', remark: '' },
//             }
//         },
//         commune: {
//             s1: {
//                 label: '1. Ceiling, walls & floor',
//                 q1: { label: 'Ceiling no holes', value: '', remark: '' },
//                 q2: { label: 'No paint stain', value: '', remark: '' },
//                 q3: { label: 'No scratch', value: '', remark: '' },
//                 q4: { label: 'No holes', value: '', remark: '' },
//                 q5: { label: 'Painting line & corner smooth', value: '', remark: '' },
//                 q6: { label: 'General cleanliness', value: '', remark: '' },
//             },
//             s2: {
//                 label: '2. Light, fan & switches',
//                 q1: { label: 'All light & fan points are installed', value: '', remark: '' },
//                 q2: { label: 'Light & fan is functioning', value: '', remark: '' },
//                 q3: { label: 'Fan installed properly', value: '', remark: '' },
//                 q4: { label: 'Switches are functioning', value: '', remark: '' },
//                 q5: { label: 'Switches are installed properly', value: '', remark: '' },
//                 q6: { label: 'AC is working & cold', value: '', remark: '' },
//                 q7: { label: 'Remote control with batteries & functioning', value: '', remark: '' },
//                 q8: { label: 'Remote control is mounted on wall', value: '', remark: '' },
//             },
//             s3: {
//                 label: '3. Carpentry work',
//                 q1: { label: 'Furnitures are sturdy not shaky', value: '', remark: '' },
//                 q2: { label: 'No scratch', value: '', remark: '' },
//                 q3: { label: 'No hole', value: '', remark: '' },
//                 q4: { label: 'No peel off', value: '', remark: '' },
//                 q5: { label: 'All doors and drawers can open and close smoothly', value: '', remark: '' },
//             },
//             s4: {
//                 label: '4. Loose furniture & items (Chair, pillow, rug, decoration, curtain)',
//                 q1: { label: 'Chair in good condition', value: '', remark: '' },
//                 q2: { label: 'Curtain & Hook', value: '', remark: '' },
//                 q3: { label: 'Decoration display', value: '', remark: '' },
//                 q4: { label: 'Rug is displyed', value: '', remark: '' },
//                 q5: { label: 'General cleanliness', value: '', remark: '' },
//             },
//             s5: {
//                 label: '5. Others',
//                 other: { value: '', remark: '' },
//             }
//         },
//         bedrooms: {
//             bedroom1: {
//                 s1: {
//                     label: '1. Door & lock (2 sides)',
//                     q1: { label: 'Painting', value: '', remark: '' },
//                     q2: { label: 'Door open & close smoothly', value: '', remark: '' },
//                     q3: { label: 'Door no crack line', value: '', remark: '' },
//                     q4: { label: 'Smart door lock install properly', value: '', remark: '' },
//                     q5: { label: 'Smart door lock with battery & functioning', value: '', remark: '' },
//                 },
//                 s2: {
//                     label: '2. Light, fan, AC, switches & remote control',
//                     q1: { label: 'All light & fan points are installed', value: '', remark: '' },
//                     q2: { label: 'Light & fan is functioning', value: '', remark: '' },
//                     q3: { label: 'Fan installed properly', value: '', remark: '' },
//                     q4: { label: 'Switches are functioning', value: '', remark: '' },
//                     q5: { label: 'Switches are installed properly', value: '', remark: '' },
//                     q6: { label: 'AC is working & cold', value: '', remark: '' },
//                     q7: { label: '2 Remote control with batteries & functioning', value: '', remark: '' },
//                     q8: { label: '2 Remote control is mounted on wall', value: '', remark: '' },
//                 },
//                 s3: {
//                     label: '3. Ceiling, walls & floor',
//                     q1: { label: 'Ceiling no holes', value: '', remark: '' },
//                     q2: { label: 'No paint stain', value: '', remark: '' },
//                     q3: { label: 'No scratch', value: '', remark: '' },
//                     q4: { label: 'No holes', value: '', remark: '' },
//                     q5: { label: 'Painting line & corner smooth', value: '', remark: '' },
//                     q6: { label: 'General Cleanliness', value: '', remark: '' },
//                 },
//                 s4: {
//                     label: '4. Bedframe, Mattress, Comforter Set & Pillow',
//                     q1: { label: 'Bed Frame sturdy not shaky', value: '', remark: '' },
//                     q2: { label: 'Bed Frame LED Stripe working properly', value: '', remark: '' },
//                     q3: { label: 'Bed Frame switches work properly', value: '', remark: '' },
//                     q4: { label: 'Bed Frame drawer can open and close smoothly', value: '', remark: '' },
//                     q5: { label: 'Mattress', value: '', remark: '' },
//                     q6: { label: 'Pillows & Bed Linens', value: '', remark: '' },
//                     q7: { label: 'Comforter with cover', value: '', remark: '' },
//                     q8: { label: 'General Cleanliness', value: '', remark: '' },
//                 },
//                 s5: {
//                     label: '5. Wardrobe (open & close) & Table',
//                     q1: { label: 'Wardrobe with installed Mirror', value: '', remark: '' },
//                     q2: { label: 'Wardrobe sturdy not shaky', value: '', remark: '' },
//                     q3: { label: 'Wardrobe plugpoints (fridge and upper) working properly', value: '', remark: '' },
//                     q4: { label: 'All doors and drawers can open and close smoothly', value: '', remark: '' },
//                     q5: { label: 'LED stripe working properly', value: '', remark: '' },
//                     q6: { label: 'Fridge can properly placed into the designated compartment', value: '', remark: '' },
//                     q7: { label: 'Silicon sealed properly', value: '', remark: '' },
//                     q8: { label: 'Study Table & Chair sturdy not shaky', value: '', remark: '' },
//                     q9: { label: 'Plugpoint working properly', value: '', remark: '' },
//                     q10: { label: 'Upper shelve unit installed securely', value: '', remark: '' },
//                     q11: { label: 'Extended LED strips at Upper shelves work properly', value: '', remark: '' },
//                     q12: { label: 'General Cleanliness', value: '', remark: '' },
//                 },
//                 s6: {
//                     label: '6. Loose furniture & items',
//                     q1: { label: 'Curtain & Hook', value: '', remark: '' },
//                     q2: { label: 'Mini Fridge is functioning', value: '', remark: '' },
//                     q3: { label: 'Writing chair', value: '', remark: '' },
//                     q4: { label: 'Decoration Display', value: '', remark: '' },
//                     q5: { label: 'Door stopper', value: '', remark: '' },
//                     q6: { label: 'General Cleanliness', value: '', remark: '' },
//                 },
//                 s7: {
//                     label: '7. Others',
//                     other: { label: 'Bed in good condition', value: '', remark: '' },
//                 }
//             }
//         },
//         bathrooms: {
//             bathroom1: {
//                 s1: {
//                     label: '1. Ceiling, walls & floor',
//                     q1: { label: 'Ceiling no holes', value: '', remark: '' },
//                     q2: { label: 'No paint stain', value: '', remark: '' },
//                     q3: { label: 'No scratch', value: '', remark: '' },
//                     q4: { label: 'No holes', value: '', remark: '' },
//                     q5: { label: 'Painting line & corner smooth', value: '', remark: '' },
//                     q6: { label: 'General Cleanliness', value: '', remark: '' },
//                 },
//                 s2: {
//                     label: '2. Light, Switches & Water Heater',
//                     q1: { label: 'Lighting & Switches are functioning', value: '', remark: '' },
//                     q2: { label: 'Water heater hot water', value: '', remark: '' },
//                     q3: { label: 'Water heater water pressure', value: '', remark: '' },
//                     q4: { label: 'Water heater spray no leaking', value: '', remark: '' },
//                     q5: { label: 'Water heater correct outlet', value: '', remark: '' },
//                     q6: { label: 'General cleaning', value: '', remark: '' },
//                 },
//                 s3: {
//                     label: '3. Bathroom item',
//                     q1: { label: 'Mirror', value: '', remark: '' },
//                     q2: { label: 'Towel Hanger', value: '', remark: '' },
//                     q3: { label: 'Water outflow fast', value: '', remark: '' },
//                     q4: { label: 'General cleaning', value: '', remark: '' },
//                 },
//                 s4: {
//                     label: '4. Tap, Basin, Toilet bowl, bidet',
//                     q1: { label: 'Water tap water pressure is good', value: '', remark: '' },
//                     q2: { label: 'Water tap is installed properly', value: '', remark: '' },
//                     q3: { label: 'No crack and defect on basin', value: '', remark: '' },
//                     q4: { label: 'Pipping no leaking', value: '', remark: '' },
//                     q5: { label: 'Toilet flush strong', value: '', remark: '' },
//                     q6: { label: 'Toilet bowl no crack or stain', value: '', remark: '' },
//                     q7: { label: 'Bidet water pressure is strong', value: '', remark: '' },
//                     q8: { label: 'Bidet no leaking', value: '', remark: '' },
//                     q9: { label: 'Bidet installed properly', value: '', remark: '' },
//                     q10: { label: 'General cleaning', value: '', remark: '' },
//                 },
//                 s5: {
//                     label: '5. Others',
//                     other: { label: 'Bed in good condition', value: '', remark: '' },
//                 }
//             }
//         }
//     }
// }

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

function OwnerInspectionReport() {
    // const navigate = useNavigate();
    // const { id } = useParams<{ id: string }>();
    // const renoProgressId = id ? parseInt(id, 10) : null;

    // const [properties, setProperties] = useState<Property[] | null>(null);
    // const [userDetail, setUserDetail] = useState<User>(null);
    // const [formData, setFormData] = useState<QCForm>(initQCForm);
    // const [errors, setErrors] = useState<FormErrors>({});

    // const [loading, setLoading] = useState<boolean>(true); // Loading state

    // const [successSubmit, setSuccessSubmit] = useState<boolean>(false);

    // const notify = (type: 'success' | 'error', message: string) => {
    //     (toast[type] as (message: string, options?: object) => void)(message, {
    //         position: "top-center",
    //         autoClose: 3000,
    //         hideProgressBar: true,
    //         closeOnClick: true,
    //         pauseOnHover: true,
    //         draggable: true,
    //         theme: localStorage.getItem('theme'),
    //         transition: Slide,
    //     });
    // };

    // const handleBackClick = () => {
    //     navigate('/owner/reno/progress/' + renoProgressId); // Go back to the previous route
    // };

    // useEffect(() => {
    //     document.title = "Owner Inspection Form | RenoXpert";

    //     const initFunctions = async () => {
    //         await KTComponents.init();
    //         await getUser();
    //         if (renoProgressId !== null) {
    //             await handleSearchRenoProgress(renoProgressId);
    //         }
    //         await setLoading(false);
    //         await new Promise(resolve => setTimeout(resolve, 1));
    //         KTStepper.init();
    //         KTTabs.init();
    //     };

    //     initFunctions();
    // }, []);

    // const handleSearchRenoProgress = async (renoProgressId: number) => {
    //     setLoading(true); // Start loading immediately

    //     try {
    //         const response = await fetchRenoProgressDetail(Number(renoProgressId)); // Fetch reno progress data

    //         if (response?.success) {
    //             console.log(response);
    //             setFormData((prevData) => ({
    //                 ...prevData,
    //                 reno_progress_id: renoProgressId,
    //                 property: {
    //                     ...prevData.property,
    //                     property_name: response.data.property.name,
    //                     block: response.data.block,
    //                     level: response.data.level,
    //                     unit: response.data.unit,
    //                 },
    //                 bedroom_count: response.data.bedroom_count?.toString(),
    //                 bathroom_count: response.data.bathroom_count.toString(),
    //             }));

    //             handleDynamicBedroom(null, response.data.bedroom_count);
    //             handleDynamicBathroom(null, response.data.bathroom_count);
    //         }

    //     } catch (error) {
    //         console.error('Error fetching reno progress or sale data:', error);
    //     } finally {
    //         // Ensure loading is set to false only after all the async operations are completed
    //         setLoading(false);
    //     }
    // };

    // const getUser = async () => {
    //     try {
    //         const response = await user();

    //         setUserDetail(response);

    //     } catch (error) {
    //         console.log(error);

    //     }
    // }

    // // const getProperties = async () => {
    // //     try {
    // //         const response = await fetchProperties();
    // //         console.log(response);

    // //         if (response?.success) {
    // //             setProperties(response.data);
    // //         } else {
    // //             console.log(response?.message);
    // //         }

    // //     } catch (error) {
    // //         console.log(error);

    // //     }
    // // };

    // const handleGoTo = (step: number) => {
    //     const stepperEl = document.querySelector('#my_stepper') as HTMLElement;
    //     const stepper = KTStepper.getInstance(stepperEl);

    //     window.scrollTo(0, 0);
    //     stepper.go(step);
    // }

    // const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    //     const { name, value } = e.target;

    //     if (name.startsWith('property.')) {
    //         const key = name.split('.')[1];

    //         // Update form data
    //         setFormData((prevData) => ({
    //             ...prevData,
    //             property: {
    //                 ...prevData.property,
    //                 [key]: value,
    //             },
    //         }));

    //         // Clear error for the specific property field
    //         setErrors((prevErrors) => ({
    //             ...prevErrors,
    //             property: {
    //                 ...(prevErrors.property || {}),
    //                 [key]: ''
    //             }
    //         }));

    //     } else if (name.startsWith('area.')) {
    //         const [a, cat] = name.split('.');

    //         if (cat === 'bedrooms' || cat === 'bathrooms') {
    //             const [a, cat, rooms, section, question, val] = name.split('.');

    //             // Update form data
    //             setFormData((prevData) => ({
    //                 ...prevData,
    //                 area: {
    //                     ...prevData.area,
    //                     [cat]: {
    //                         ...prevData.area?.[cat],
    //                         [rooms]: {
    //                             ...prevData.area?.[cat]?.[rooms],
    //                             [section]: {
    //                                 ...prevData.area?.[cat]?.[rooms]?.[section],
    //                                 [question]: {
    //                                     ...prevData.area?.[cat]?.[rooms]?.[section]?.[question],
    //                                     [val]: value,
    //                                 }
    //                             }
    //                         }
    //                     },
    //                 },
    //             }));

    //             // Clear error for the specific bedroom/bathroom question
    //             setErrors((prevErrors) => ({
    //                 ...prevErrors,
    //                 area: {
    //                     ...(prevErrors.area || {}),
    //                     [cat]: {
    //                         ...(prevErrors.area?.[cat] || {}),
    //                         [rooms]: {
    //                             ...(prevErrors.area?.[cat]?.[rooms] || {}),
    //                             [question]: {
    //                                 ...(prevErrors.area?.[cat]?.[rooms]?.[question] || {}),
    //                                 value: ''
    //                             }
    //                         }
    //                     }
    //                 }
    //             }));

    //         } else {
    //             const [a, cat, section, question, val] = name.split('.');

    //             // Update form data
    //             setFormData((prevData) => ({
    //                 ...prevData,
    //                 area: {
    //                     ...prevData.area,
    //                     [cat]: {
    //                         ...prevData.area?.[cat],
    //                         [section]: {
    //                             ...prevData.area?.[cat]?.[section],
    //                             [question]: {
    //                                 ...prevData.area?.[cat]?.[section]?.[question],
    //                                 [val]: value,
    //                             }
    //                         }
    //                     },
    //                 },
    //             }));

    //             // Clear error for the specific area question
    //             setErrors((prevErrors) => ({
    //                 ...prevErrors,
    //                 area: {
    //                     ...(prevErrors.area || {}),
    //                     [cat]: {
    //                         ...(prevErrors.area?.[cat] || {}),
    //                         [question]: {
    //                             ...(prevErrors.area?.[cat]?.[question] || {}),
    //                             value: ''
    //                         }
    //                     }
    //                 }
    //             }));
    //         }
    //     } else if (name.startsWith('include_commune_living')) {
    //         const includeCommune = value === '1';

    //         setFormData((prevData) => ({
    //             ...prevData,
    //             include_commune_living: includeCommune,
    //             area: {
    //                 ...prevData.area,
    //                 commune: includeCommune
    //                     ? {
    //                         s1: {
    //                             label: '1. Ceiling, walls & floor',
    //                             q1: { label: 'Ceiling no holes', value: '', remark: '' },
    //                             q2: { label: 'No paint stain', value: '', remark: '' },
    //                             q3: { label: 'No scratch', value: '', remark: '' },
    //                             q4: { label: 'No holes', value: '', remark: '' },
    //                             q5: { label: 'Painting line & corner smooth', value: '', remark: '' },
    //                             q6: { label: 'General cleanliness', value: '', remark: '' },
    //                         },
    //                         s2: {
    //                             label: '2. Light, fan & switches',
    //                             q1: { label: 'All light & fan points are installed', value: '', remark: '' },
    //                             q2: { label: 'Light & fan is functioning', value: '', remark: '' },
    //                             q3: { label: 'Fan installed properly', value: '', remark: '' },
    //                             q4: { label: 'Switches are functioning', value: '', remark: '' },
    //                             q5: { label: 'Switches are installed properly', value: '', remark: '' },
    //                             q6: { label: 'AC is working & cold', value: '', remark: '' },
    //                             q7: { label: 'Remote control with batteries & functioning', value: '', remark: '' },
    //                             q8: { label: 'Remote control is mounted on wall', value: '', remark: '' },
    //                         },
    //                         s3: {
    //                             label: '3. Carpentry work',
    //                             q1: { label: 'Furnitures are sturdy not shaky', value: '', remark: '' },
    //                             q2: { label: 'No scratch', value: '', remark: '' },
    //                             q3: { label: 'No hole', value: '', remark: '' },
    //                             q4: { label: 'No peel off', value: '', remark: '' },
    //                             q5: { label: 'All doors and drawers can open and close smoothly', value: '', remark: '' },
    //                         },
    //                         s4: {
    //                             label: '4. Loose furniture & items (Chair, pillow, rug, decoration, curtain)',
    //                             q1: { label: 'Chair in good condition', value: '', remark: '' },
    //                             q2: { label: 'Curtain & Hook', value: '', remark: '' },
    //                             q3: { label: 'Decoration display', value: '', remark: '' },
    //                             q4: { label: 'Rug is displyed', value: '', remark: '' },
    //                             q5: { label: 'General cleanliness', value: '', remark: '' },
    //                         },
    //                         s5: {
    //                             label: '5. Others',
    //                             other: { value: '', remark: '' },
    //                         }
    //                     }
    //                     : null,
    //             },
    //         }));
    //     } else {
    //         // Update form data
    //         setFormData((prevData) => ({
    //             ...prevData,
    //             [name]: value,
    //         }));

    //         // Clear error for the specific field
    //         setErrors((prevErrors) => ({
    //             ...prevErrors,
    //             [name]: ''
    //         }));
    //     }
    // };

    // const handleDynamicBedroom = async (e?: React.ChangeEvent<HTMLSelectElement>, bedroomsCount?: number) => {

    //     let bedroomCount: number;

    //     if (e) {
    //         const { value } = e.target;
    //         bedroomCount = parseInt(value);
    //     } else if (bedroomsCount) {
    //         bedroomCount = bedroomsCount;
    //     }

    //     setErrors({});

    //     // Update the bathroom count and dynamically add/remove bedrooms in the form data
    //     await setFormData((prevFormData) => {
    //         const updatedBedrooms = { ...prevFormData.area?.bedrooms };

    //         // Add or remove bathroom fields based on the new count
    //         for (let i = 1; i <= bedroomCount; i++) {
    //             if (!updatedBedrooms[`bedroom${i}`]) {
    //                 updatedBedrooms[`bedroom${i}`] = {
    //                     s1: {
    //                         label: '1. Door & lock (2 sides)',
    //                         q1: { label: 'Painting', value: '', remark: '' },
    //                         q2: { label: 'Door open & close smoothly', value: '', remark: '' },
    //                         q3: { label: 'Door no crack line', value: '', remark: '' },
    //                         q4: { label: 'Smart door lock install properly', value: '', remark: '' },
    //                         q5: { label: 'Smart door lock with battery & functioning', value: '', remark: '' },
    //                     },
    //                     s2: {
    //                         label: '2. Light, fan, AC, switches & remote control',
    //                         q1: { label: 'All light & fan points are installed', value: '', remark: '' },
    //                         q2: { label: 'Light & fan is functioning', value: '', remark: '' },
    //                         q3: { label: 'Fan installed properly', value: '', remark: '' },
    //                         q4: { label: 'Switches are functioning', value: '', remark: '' },
    //                         q5: { label: 'Switches are installed properly', value: '', remark: '' },
    //                         q6: { label: 'AC is working & cold', value: '', remark: '' },
    //                         q7: { label: '2 Remote control with batteries & functioning', value: '', remark: '' },
    //                         q8: { label: '2 Remote control is mounted on wall', value: '', remark: '' },
    //                     },
    //                     s3: {
    //                         label: '3. Ceiling, walls & floor',
    //                         q1: { label: 'Ceiling no holes', value: '', remark: '' },
    //                         q2: { label: 'No paint stain', value: '', remark: '' },
    //                         q3: { label: 'No scratch', value: '', remark: '' },
    //                         q4: { label: 'No holes', value: '', remark: '' },
    //                         q5: { label: 'Painting line & corner smooth', value: '', remark: '' },
    //                         q6: { label: 'General Cleanliness', value: '', remark: '' },
    //                     },
    //                     s4: {
    //                         label: '4. Bedframe, Mattress, Comforter Set & Pillow',
    //                         q1: { label: 'Bed Frame sturdy not shaky', value: '', remark: '' },
    //                         q2: { label: 'Bed Frame LED Stripe working properly', value: '', remark: '' },
    //                         q3: { label: 'Bed Frame switches work properly', value: '', remark: '' },
    //                         q4: { label: 'Bed Frame drawer can open and close smoothly', value: '', remark: '' },
    //                         q5: { label: 'Mattress', value: '', remark: '' },
    //                         q6: { label: 'Pillows & Bed Linens', value: '', remark: '' },
    //                         q7: { label: 'Comforter with cover', value: '', remark: '' },
    //                         q8: { label: 'General Cleanliness', value: '', remark: '' },
    //                     },
    //                     s5: {
    //                         label: '5. Wardrobe (open & close) & Table',
    //                         q1: { label: 'Wardrobe with installed Mirror', value: '', remark: '' },
    //                         q2: { label: 'Wardrobe sturdy not shaky', value: '', remark: '' },
    //                         q3: { label: 'Wardrobe plugpoints (fridge and upper) working properly', value: '', remark: '' },
    //                         q4: { label: 'All doors and drawers can open and close smoothly', value: '', remark: '' },
    //                         q5: { label: 'LED stripe working properly', value: '', remark: '' },
    //                         q6: { label: 'Fridge can properly placed into the designated compartment', value: '', remark: '' },
    //                         q7: { label: 'Silicon sealed properly', value: '', remark: '' },
    //                         q8: { label: 'Study Table & Chair sturdy not shaky', value: '', remark: '' },
    //                         q9: { label: 'Plugpoint working properly', value: '', remark: '' },
    //                         q10: { label: 'Upper shelve unit installed securely', value: '', remark: '' },
    //                         q11: { label: 'Extended LED strips at Upper shelves work properly', value: '', remark: '' },
    //                         q12: { label: 'General Cleanliness', value: '', remark: '' },
    //                     },
    //                     s6: {
    //                         label: '6. Loose furniture & items',
    //                         q1: { label: 'Curtain & Hook', value: '', remark: '' },
    //                         q2: { label: 'Mini Fridge is functioning', value: '', remark: '' },
    //                         q3: { label: 'Writing chair', value: '', remark: '' },
    //                         q4: { label: 'Decoration Display', value: '', remark: '' },
    //                         q5: { label: 'Door stopper', value: '', remark: '' },
    //                         q6: { label: 'General Cleanliness', value: '', remark: '' },
    //                     },
    //                     s7: {
    //                         label: '7. Others',
    //                         other: { label: 'Bed in good condition', value: '', remark: '' },
    //                     }
    //                 }
    //             }
    //         }

    //         // Remove bedrooms if the number is decreased
    //         Object.keys(updatedBedrooms).forEach((key) => {
    //             const bedroomNumber = parseInt(key.replace('bedroom', ''));
    //             if (bedroomNumber > bedroomCount) {
    //                 delete updatedBedrooms[key];
    //             }
    //         });

    //         // Return the updated formData
    //         return {
    //             ...prevFormData,
    //             area: {
    //                 ...prevFormData.area,
    //                 bedrooms: updatedBedrooms
    //             }
    //         };
    //     });

    //     await KTTabs.init();
    // }

    // const handleDynamicBathroom = (e?: React.ChangeEvent<HTMLSelectElement>, bathroomsCount?: number) => {

    //     let bathroomCount: number;

    //     if (e) {
    //         const { value } = e.target;
    //         bathroomCount = parseInt(value);
    //     } else if (bathroomsCount) {
    //         bathroomCount = bathroomsCount;
    //     }

    //     setErrors({});

    //     // Update the bathroom count and dynamically add/remove bathrooms in the form data
    //     setFormData((prevFormData) => {
    //         const updatedBathrooms = { ...prevFormData.area?.bathrooms };

    //         // Add or remove bathroom fields based on the new count
    //         for (let i = 1; i <= bathroomCount; i++) {
    //             if (!updatedBathrooms[`bathroom${i}`]) {
    //                 updatedBathrooms[`bathroom${i}`] = {
    //                     s1: {
    //                         label: '1. Ceiling, walls & floor',
    //                         q1: { label: 'Ceiling no holes', value: '', remark: '' },
    //                         q2: { label: 'No paint stain', value: '', remark: '' },
    //                         q3: { label: 'No scratch', value: '', remark: '' },
    //                         q4: { label: 'No holes', value: '', remark: '' },
    //                         q5: { label: 'Painting line & corner smooth', value: '', remark: '' },
    //                         q6: { label: 'General Cleanliness', value: '', remark: '' },
    //                     },
    //                     s2: {
    //                         label: '2. Light, Switches & Water Heater',
    //                         q1: { label: 'Lighting & Switches are functioning', value: '', remark: '' },
    //                         q2: { label: 'Water heater hot water', value: '', remark: '' },
    //                         q3: { label: 'Water heater water pressure', value: '', remark: '' },
    //                         q4: { label: 'Water heater spray no leaking', value: '', remark: '' },
    //                         q5: { label: 'Water heater correct outlet', value: '', remark: '' },
    //                         q6: { label: 'General cleaning', value: '', remark: '' },
    //                     },
    //                     s3: {
    //                         label: '3. Bathroom item',
    //                         q1: { label: 'Mirror', value: '', remark: '' },
    //                         q2: { label: 'Towel Hanger', value: '', remark: '' },
    //                         q3: { label: 'Water outflow fast', value: '', remark: '' },
    //                         q4: { label: 'General cleaning', value: '', remark: '' },
    //                     },
    //                     s4: {
    //                         label: '4. Tap, Basin, Toilet bowl, bidet',
    //                         q1: { label: 'Water tap water pressure is good', value: '', remark: '' },
    //                         q2: { label: 'Water tap is installed properly', value: '', remark: '' },
    //                         q3: { label: 'No crack and defect on basin', value: '', remark: '' },
    //                         q4: { label: 'Pipping no leaking', value: '', remark: '' },
    //                         q5: { label: 'Toilet flush strong', value: '', remark: '' },
    //                         q6: { label: 'Toilet bowl no crack or stain', value: '', remark: '' },
    //                         q7: { label: 'Bidet water pressure is strong', value: '', remark: '' },
    //                         q8: { label: 'Bidet no leaking', value: '', remark: '' },
    //                         q9: { label: 'Bidet installed properly', value: '', remark: '' },
    //                         q10: { label: 'General cleaning', value: '', remark: '' },
    //                     },
    //                     s5: {
    //                         label: '5. Others',
    //                         other: { label: 'Bed in good condition', value: '', remark: '' },
    //                     }
    //                 }
    //             }
    //         }

    //         // Remove bathrooms if the number is decreased
    //         Object.keys(updatedBathrooms).forEach((key) => {
    //             const bathroomNumber = parseInt(key.replace('bathroom', ''));
    //             if (bathroomNumber > bathroomCount) {
    //                 delete updatedBathrooms[key];
    //             }
    //         });

    //         // Return the updated formData
    //         return {
    //             ...prevFormData,
    //             area: {
    //                 ...prevFormData.area,
    //                 bathrooms: updatedBathrooms
    //             }
    //         };
    //     });

    //     KTTabs.init();
    // }

    // const validate = (): FormErrors => {
    //     const newErrors: FormErrors = {
    //         property: {},
    //         area: {}
    //     };

    //     // Top level fields
    //     if (!formData.bedroom_count) newErrors.bedroom_count = "Please select bedroom count";
    //     if (!formData.bathroom_count) newErrors.bathroom_count = "Please select bathroom count";

    //     // Property related fields
    //     if (!formData.property.property_name) {
    //         (newErrors.property as FormErrors).property_name = "Please select an option";
    //     }
    //     if (!formData.property.block) {
    //         (newErrors.property as FormErrors).block = "Block is required";
    //     }
    //     if (!formData.property.level) {
    //         (newErrors.property as FormErrors).level = "Level is required";
    //     }
    //     if (!formData.property.unit) {
    //         (newErrors.property as FormErrors).unit = "Unit is required";
    //     }
    //     if (formData.property.property_name === 'other' && !formData.property.other_property_name) {
    //         (newErrors.property as FormErrors).other_property_name = "Please fill the other property name";
    //     }

    //     // Area related fields
    //     const validateArea = (areaKey: string) => {
    //         const area = formData.area[areaKey];
    //         if (!area) return;

    //         const areaErrors: { [key: string]: any } = {};

    //         if (areaKey === 'bedrooms' || areaKey === 'bathrooms') {
    //             const count = areaKey === 'bedrooms'
    //                 ? parseInt(String(formData.bedroom_count))
    //                 : parseInt(String(formData.bathroom_count));

    //             for (let i = 1; i <= count; i++) {
    //                 const roomKey = `${areaKey.slice(0, -1)}${i}`;
    //                 const room = area[roomKey];

    //                 if (room) {
    //                     const roomErrors: { [key: string]: any } = {};

    //                     Object.entries(room).forEach(([sectionKey, section]) => {
    //                         if (sectionKey === 'label') return;
    //                         if (sectionKey === 'other') return;
    //                         if (sectionKey === 'attachments') return;

    //                         const sectionErrors: { [key: string]: any } = {};

    //                         Object.entries(section).forEach(([questionKey, question]) => {
    //                             if (questionKey === 'label') return;
    //                             if (questionKey === 'other') return;
    //                             if (questionKey === 'attachments') return;

    //                             if (!question.value) {
    //                                 sectionErrors[questionKey] = {
    //                                     value: "This field is required"
    //                                 };
    //                             }
    //                         });

    //                         if (Object.keys(sectionErrors).length > 0) {
    //                             roomErrors[sectionKey] = sectionErrors;
    //                         }
    //                     });

    //                     if (Object.keys(roomErrors).length > 0) {
    //                         areaErrors[roomKey] = roomErrors;
    //                     }
    //                 }
    //             }
    //         } else {
    //             Object.entries(area).forEach(([sectionKey, section]) => {
    //                 if (sectionKey === 'label') return;
    //                 if (sectionKey === 'other') return;
    //                 if (sectionKey === 'attachments') return;

    //                 const sectionErrors: { [key: string]: any } = {};

    //                 Object.entries(section).forEach(([questionKey, question]) => {
    //                     if (questionKey === 'label') return;
    //                     if (questionKey === 'other') return;
    //                     if (questionKey === 'attachments') return;

    //                     if (!question.value) {
    //                         sectionErrors[questionKey] = {
    //                             value: "This field is required"
    //                         };
    //                     }
    //                 });

    //                 if (Object.keys(sectionErrors).length > 0) {
    //                     areaErrors[sectionKey] = sectionErrors;
    //                 }
    //             });
    //         }

    //         if (Object.keys(areaErrors).length > 0) {
    //             newErrors.area[areaKey] = areaErrors;
    //         }
    //     };

    //     // Validate all areas
    //     validateArea('bedrooms');
    //     validateArea('bathrooms');
    //     validateArea('foyer');
    //     validateArea('kitchen');
    //     validateArea('laundry');
    //     validateArea('dining');
    //     validateArea('commune');

    //     if (newErrors['property'] && Object.keys(newErrors['property']).length === 0) {
    //         delete newErrors['property'];
    //     }

    //     if (newErrors['area'] && Object.keys(newErrors['area']).length === 0) {
    //         delete newErrors['area'];
    //     }

    //     return newErrors;
    // };

    // const handleSubmit = async () => {
    //     const validationErrors = validate();

    //     if (renoProgressId) {
    //         setFormData((prevData) => ({
    //             ...prevData,
    //             reno_progress_id: renoProgressId,
    //         }));
    //     }

    //     console.log(validationErrors);
    //     console.log(formData);


    //     // if (Object.keys(validationErrors).length > 0) {
    //     //     setErrors(validationErrors);
    //     //     notify('error', 'Please check your form error.');
    //     //     return;
    //     // } else {
    //     //     try {
    //     //         const response = await submitQCForm(formData);

    //     //         console.log(response);
    //     //         notify('success', 'Form successfully submitted.');

    //     //     } catch (error) {
    //     //         console.log(error);
    //     //     }
    //     // }
    // }

    // // Get Owner Auth
    // // Get selected Reno Progress
    // // Check if the Reno Progress is allow owner to be inspected
    // // TRUE
    // // Display Inspection Report

    // // FALSE
    // // Display Invalid Operation

    // if (loading) return <Loading />;

    return (
        // <>
        //     <div className="card w-full" data-stepper="true" id="my_stepper">
        //         <div className="card-header py-2">
        //             <h2 className="text-slate-900 text-lg font-semibold">Owner Inspection Form</h2>
        //         </div>
        //         <div className="card-group">
        //             <div className="flex flex-wrap justify-center items-center gap-4">
        //                 <div className="badge badge-xs active flex gap-2.5 items-center cursor-pointer" data-stepper-item="#stepper_1">
        //                     <div className="flex flex-col gap-0.5">
        //                         <h4 className="text-sm font-medium text-gray-900 stepper-item-completed:text-gray-600 stepper-item-active:text-primary" onClick={() => handleGoTo(1)}>
        //                             General
        //                         </h4>
        //                     </div>
        //                 </div>
        //                 <div className={`badge badge-xs flex gap-2.5 items-center cursor-pointer`} data-stepper-item="#stepper_2">
        //                     <div className="flex flex-col gap-0.5">
        //                         <h4 className="text-sm font-medium text-gray-900 stepper-item-completed:text-gray-600 stepper-item-active:text-primary" onClick={() => handleGoTo(2)}>
        //                             Foyer & Entrance
        //                         </h4>
        //                     </div>
        //                 </div>
        //                 <div className={`badge badge-xs flex gap-2.5 items-center cursor-pointer`} data-stepper-item="#stepper_3">
        //                     <div className="flex flex-col gap-0.5">
        //                         <h4 className="text-sm font-medium text-gray-900 stepper-item-completed:text-gray-600 stepper-item-active:text-primary" onClick={() => handleGoTo(3)}>
        //                             Kitchen
        //                         </h4>
        //                     </div>
        //                 </div>
        //                 <div className={`badge badge-xs flex gap-2.5 items-center cursor-pointer`} data-stepper-item="#stepper_4">
        //                     <div className="flex flex-col gap-0.5">
        //                         <h4 className="text-sm font-medium text-gray-900 stepper-item-completed:text-gray-600 stepper-item-active:text-primary" onClick={() => handleGoTo(4)}>
        //                             Laundry Yard
        //                         </h4>
        //                     </div>
        //                 </div>
        //                 <div className={`badge badge-xs flex gap-2.5 items-center cursor-pointer`} data-stepper-item="#stepper_5">
        //                     <div className="flex flex-col gap-0.5">
        //                         <h4 className="text-sm font-medium text-gray-900 stepper-item-completed:text-gray-600 stepper-item-active:text-primary" onClick={() => handleGoTo(5)}>
        //                             Dining
        //                         </h4>
        //                     </div>
        //                 </div>
        //                 <div className={`badge badge-xs flex gap-2.5 items-center cursor-pointer`} data-stepper-item="#stepper_6">
        //                     <div className="flex flex-col gap-0.5">
        //                         <h4 className="text-sm font-medium text-gray-900 stepper-item-completed:text-gray-600 stepper-item-active:text-primary" onClick={() => handleGoTo(6)}>
        //                             Commune Living
        //                         </h4>
        //                     </div>
        //                 </div>
        //                 <div className={`badge badge-xs flex gap-2.5 items-center cursor-pointer`} data-stepper-item="#stepper_7">
        //                     <div className="flex flex-col gap-0.5">
        //                         <h4 className="text-sm font-medium text-gray-900 stepper-item-completed:text-gray-600 stepper-item-active:text-primary" onClick={() => handleGoTo(7)}>
        //                             Bedrooms
        //                         </h4>
        //                     </div>
        //                 </div>
        //                 <div className={`badge badge-xs flex gap-2.5 items-center cursor-pointer`} data-stepper-item="#stepper_8">
        //                     <div className="flex flex-col gap-0.5">
        //                         <h4 className="text-sm font-medium text-gray-900 stepper-item-completed:text-gray-600 stepper-item-active:text-primary" onClick={() => handleGoTo(8)}>
        //                             Bathrooms
        //                         </h4>
        //                     </div>
        //                 </div>
        //             </div>
        //         </div>
        //         <div className="card-body">
        //             <div className="" id="stepper_1">
        //                 <div className="flex flex-col">
        //                     <div className="flex flex-col mb-8">
        //                         <label className="text-slate-900 mb-2 font-medium" htmlFor="date">Date & Time</label>
        //                         <div className="flex gap-6">
        //                             <div className="badge badge-lg">{formData.date}</div>
        //                             <div className="badge badge-lg">{formData.time}</div>
        //                         </div>
        //                     </div>

        //                     <div className="flex flex-col mb-8">
        //                         <label className="text-slate-900 mb-2 font-medium" htmlFor="date">Inspector</label>
        //                         <div className="flex gap-6">
        //                             <div className="badge badge-lg badge-outline badge-dark">{userDetail.name}</div>
        //                         </div>
        //                     </div>

        //                     <div className="flex flex-col mb-8">
        //                         <label className="text-slate-900 mb-2 font-medium" htmlFor="date">Property</label>
        //                         <div className="flex gap-6">
        //                             <div className="badge badge-lg badge-outline badge-dark">{formData.property.property_name}</div>
        //                         </div>
        //                     </div>

        //                     <div className="flex flex-col mb-8">
        //                         <label className="text-slate-900 mb-2 font-medium" htmlFor="date">Unit</label>
        //                         <div className="flex gap-6">
        //                             <div className="badge badge-lg badge-outline badge-dark">{formData.property.block}-{formData.property.level}-{formData.property.unit}</div>
        //                         </div>
        //                     </div>

        //                     <div className="flex flex-col mb-8">
        //                         <label className="text-slate-900 mb-2 font-medium" htmlFor="date">Total Bedrooms</label>
        //                         <div className="flex gap-6">
        //                             <div className="text-md font-semibold">{formData.bedroom_count}</div>
        //                         </div>
        //                     </div>

        //                     <div className="flex flex-col mb-8">
        //                         <label className="text-slate-900 mb-2 font-medium" htmlFor="date">Total Bedrooms</label>
        //                         <div className="flex gap-6">
        //                             <div className="text-md font-semibold">{formData.bedroom_count}</div>
        //                         </div>
        //                     </div>

        //                     <div className="flex flex-col mb-8">
        //                         <label className="text-slate-900 mb-2 font-medium" htmlFor="date">Include Commune Living</label>
        //                         <div className="flex gap-6">
        //                             <div className="text-md font-semibold">{formData.include_commune_living ? 'Yes' : 'No'}</div>
        //                         </div>
        //                     </div>

        //                     <div className="flex flex-col mb-8">
        //                         <img src="/media/form/1.jpeg" alt="" />
        //                     </div>

        //                     <div className="flex flex-col mb-12">
        //                         <span className="text-sm text-gray-900 text-justify mb-6">
        //                             ** Image above is an example for room numbering. This is our method to determine the arrangement of rooms for each layout type. Kindly refer and don't hesitate to ask our sales team for assistance!
        //                         </span>

        //                         <span className="text-sm text-gray-900 text-justify">
        //                             ** Room numbering is based on clockwise rotating basis
        //                         </span>
        //                     </div>
        //                 </div>
        //             </div>
        //             <div className="hidden" id="stepper_2">
        //                 {Object.entries(formData.area.foyer).map(([key, section]) => (
        //                     <div className="card rounded-md mb-8" key={key}>
        //                         <div className="card-header px-4 rounded-t-md bg-gray-300 text-gray-900 font-bold">
        //                             <h2 className="">{section.label}</h2>
        //                         </div>
        //                         <div className="card-body text-sm px-4">
        //                             <div className="card w-auto mb-6">
        //                                 <div className="card-body">
        //                                     {/* <div className="badge">Add Attachments</div> */}

        //                                     <input
        //                                         className="file-input file-input-sm badge mb-2"
        //                                         multiple={true}
        //                                         type="file"
        //                                         name={`area.foyer.${key}.attachments`}
        //                                         onChange={(e) => handleFileUpload(e, 'foyer', key)}
        //                                     />

        //                                     <div className="flex flex-col mb-4">
        //                                         {formData.area.foyer[key].attachments && Object.entries(formData.area.foyer[key].attachments).map(([attachmentKey, uploadedFile]) => (
        //                                             <div key={attachmentKey} className="flex items-center space-x-4 mb-4">
        //                                                 <div className="flex-1 flex flex-col">
        //                                                     <a
        //                                                         href={uploadedFile.file_url}
        //                                                         className="text-slate-700"
        //                                                         target="_blank"
        //                                                         rel="noopener noreferrer"
        //                                                     >
        //                                                         {uploadedFile.original_name}
        //                                                     </a>
        //                                                     <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
        //                                                         <span>{uploadedFile.file ? formatFileSize(uploadedFile.file.size) : '-'}</span>
        //                                                     </div>
        //                                                 </div>
        //                                                 <button
        //                                                     className="px-2 py-2 rounded"
        //                                                     onClick={() => handleDelete(attachmentKey, 'foyer', key)}
        //                                                 >
        //                                                     <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
        //                                                 </button>
        //                                             </div>
        //                                         ))}

        //                                     </div>
        //                                 </div>
        //                             </div>
        //                             <div className="w-full">
        //                                 <div className="grid grid-cols-4 gap-4">
        //                                     {/* Header Row */}
        //                                     <div className="col-start-3 text-xs text-center text-gray-900 font-semibold">Acceptable</div>
        //                                     <div className="col-start-4 text-xs text-center text-gray-900 font-semibold">Not Acceptable</div>
        //                                     {/* <div className="col-start-4 text-xs text-center text-gray-900 font-semibold">Remark</div> */}

        //                                     {Object.entries(section).map(([sectionKey, question]) => (
        //                                         sectionKey.startsWith('q') && (
        //                                             <React.Fragment key={sectionKey}>
        //                                                 <div className="col-span-2 flex items-center text-gray-900 font-semibold">{question.label}</div>

        //                                                 {/* Acceptable Radio */}
        //                                                 <div className="flex justify-center items-center">
        //                                                     <input
        //                                                         type="radio"
        //                                                         name={`area.foyer.${key}.${sectionKey}.value`}
        //                                                         value="acceptable"
        //                                                         checked={formData.area.foyer[key][sectionKey].value === 'acceptable'}
        //                                                         className="radio radio-lg h-4 w-4 text-blue-600"
        //                                                         onChange={handleChange}
        //                                                     />
        //                                                 </div>

        //                                                 {/* Not Acceptable Radio */}
        //                                                 <div className="flex justify-center items-center">
        //                                                     <input
        //                                                         type="radio"
        //                                                         name={`area.foyer.${key}.${sectionKey}.value`}
        //                                                         value="not_acceptable"
        //                                                         checked={formData.area.foyer[key][sectionKey].value === 'not_acceptable'}
        //                                                         className="radio radio-lg h-4 w-4 text-blue-600"
        //                                                         onChange={handleChange}
        //                                                     />
        //                                                 </div>

        //                                                 {/* Remark Input - move to next line on md screens */}
        //                                                 <div className="col-span-4 flex items-center mt-2">
        //                                                     <input
        //                                                         type="input"
        //                                                         name={`area.foyer.${key}.${sectionKey}.remark`}
        //                                                         value={formData.area.foyer[key][sectionKey].remark}
        //                                                         className="input w-full"
        //                                                         onChange={handleChange}
        //                                                     />
        //                                                 </div>
        //                                             </React.Fragment>
        //                                         )
        //                                     ))}
        //                                 </div>
        //                             </div>
        //                         </div>
        //                     </div>
        //                 ))}
        //             </div>
        //             <div className="hidden" id="stepper_3">
        //                 {Object.entries(formData.area.kitchen).map(([key, section]) => (
        //                     <div className="card rounded-md mb-8" key={key}>
        //                         <div className="card-header px-4 rounded-t-md bg-gray-300 text-gray-900 font-bold">
        //                             <h2 className="">{section.label}</h2>
        //                         </div>
        //                         <div className="card-body text-sm px-4">
        //                             <div className="card w-auto mb-6">
        //                                 <div className="card-body">
        //                                     <input
        //                                         className="file-input file-input-sm badge mb-2"
        //                                         multiple={true}
        //                                         type="file"
        //                                         name={`area.kitchen.${key}.attachments`}
        //                                         onChange={(e) => handleFileUpload(e, 'kitchen', key)}
        //                                     />
        //                                     <div className="flex flex-col mb-4">
        //                                         {formData.area.kitchen[key].attachments && Object.entries(formData.area.kitchen[key].attachments).map(([attachmentKey, uploadedFile]) => (
        //                                             <div key={attachmentKey} className="flex items-center space-x-4 mb-4">
        //                                                 <div className="flex-1 flex flex-col">
        //                                                     <a
        //                                                         href={uploadedFile.file_url}
        //                                                         className="text-slate-700"
        //                                                         target="_blank"
        //                                                         rel="noopener noreferrer"
        //                                                     >
        //                                                         {uploadedFile.original_name}
        //                                                     </a>
        //                                                     <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
        //                                                         <span>{uploadedFile.file ? formatFileSize(uploadedFile.file.size) : '-'}</span>
        //                                                     </div>
        //                                                 </div>
        //                                                 <button
        //                                                     className="px-2 py-2 rounded"
        //                                                     onClick={() => handleDelete(attachmentKey, 'kitchen', key)}
        //                                                 >
        //                                                     <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
        //                                                 </button>
        //                                             </div>
        //                                         ))}
        //                                     </div>
        //                                 </div>
        //                             </div>
        //                             <div className="w-full">
        //                                 <div className="grid grid-cols-4 gap-4">
        //                                     <div className="col-start-3 text-xs text-center text-gray-900 font-semibold">Acceptable</div>
        //                                     <div className="col-start-4 text-xs text-center text-gray-900 font-semibold">Not Acceptable</div>
        //                                     {Object.entries(section).map(([sectionKey, question]) => (
        //                                         sectionKey.startsWith('q') && (
        //                                             <React.Fragment key={sectionKey}>
        //                                                 <div className="col-span-2 flex items-center text-gray-900 font-semibold">{question.label}</div>
        //                                                 <div className="flex justify-center items-center">
        //                                                     <input
        //                                                         type="radio"
        //                                                         name={`area.kitchen.${key}.${sectionKey}.value`}
        //                                                         value="acceptable"
        //                                                         checked={question.value === 'acceptable'}
        //                                                         className="radio radio-lg h-4 w-4 text-blue-600"
        //                                                         onChange={handleChange}
        //                                                     />
        //                                                 </div>
        //                                                 <div className="flex justify-center items-center">
        //                                                     <input
        //                                                         type="radio"
        //                                                         name={`area.kitchen.${key}.${sectionKey}.value`}
        //                                                         value="not_acceptable"
        //                                                         checked={question.value === 'not_acceptable'}
        //                                                         className="radio radio-lg h-4 w-4 text-blue-600"
        //                                                         onChange={handleChange}
        //                                                     />
        //                                                 </div>
        //                                                 <div className="col-span-4 flex items-center mt-2">
        //                                                     <input
        //                                                         type="input"
        //                                                         name={`area.kitchen.${key}.${sectionKey}.remark`}
        //                                                         value={question.remark}
        //                                                         className="input w-full"
        //                                                         onChange={handleChange}
        //                                                     />
        //                                                 </div>
        //                                             </React.Fragment>
        //                                         )
        //                                     ))}
        //                                 </div>
        //                             </div>
        //                         </div>
        //                     </div>
        //                 ))}
        //             </div>
        //             <div className="hidden" id="stepper_4">
        //                 {Object.entries(formData.area.laundry).map(([key, section]) => (
        //                     <div className="card rounded-md mb-8" key={key}>
        //                         <div className="card-header px-4 rounded-t-md bg-gray-300 text-gray-900 font-bold">
        //                             <h2 className="">{section.label}</h2>
        //                         </div>
        //                         <div className="card-body text-sm px-4">
        //                             <div className="card w-auto mb-6">
        //                                 <div className="card-body">
        //                                     {/* <div className="badge">Add Attachments</div> */}

        //                                     <input
        //                                         className="file-input file-input-sm badge mb-2"
        //                                         multiple={true}
        //                                         type="file"
        //                                         name={`area.laundry.${key}.attachments`}
        //                                         onChange={(e) => handleFileUpload(e, 'laundry', key)}
        //                                     />

        //                                     <div className="flex flex-col mb-4">
        //                                         {formData.area.laundry[key].attachments && Object.entries(formData.area.laundry[key].attachments).map(([attachmentKey, uploadedFile]) => (
        //                                             <div key={attachmentKey} className="flex items-center space-x-4 mb-4">
        //                                                 <div className="flex-1 flex flex-col">
        //                                                     <a
        //                                                         href={uploadedFile.file_url}
        //                                                         className="text-slate-700"
        //                                                         target="_blank"
        //                                                         rel="noopener noreferrer"
        //                                                     >
        //                                                         {uploadedFile.original_name}
        //                                                     </a>
        //                                                     <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
        //                                                         <span>{uploadedFile.file ? formatFileSize(uploadedFile.file.size) : '-'}</span>
        //                                                     </div>
        //                                                 </div>
        //                                                 <button
        //                                                     className="px-2 py-2 rounded"
        //                                                     onClick={() => handleDelete(attachmentKey, 'laundry', key)}
        //                                                 >
        //                                                     <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
        //                                                 </button>
        //                                             </div>
        //                                         ))}

        //                                     </div>
        //                                 </div>
        //                             </div>
        //                             <div className="w-full">
        //                                 <div className="grid grid-cols-4 gap-4">
        //                                     {/* Header Row */}
        //                                     <div className="col-start-3 text-xs text-center text-gray-900 font-semibold">Acceptable</div>
        //                                     <div className="col-start-4 text-xs text-center text-gray-900 font-semibold">Not Acceptable</div>
        //                                     {/* <div className="col-start-4 text-xs text-center text-gray-900 font-semibold">Remark</div> */}

        //                                     {Object.entries(section).map(([sectionKey, question]) => (
        //                                         sectionKey.startsWith('q') && (
        //                                             <React.Fragment key={sectionKey}>
        //                                                 <div className="col-span-2 flex items-center text-gray-900 font-semibold">{question.label}</div>

        //                                                 {/* Acceptable Radio */}
        //                                                 <div className="flex justify-center items-center">
        //                                                     <input
        //                                                         type="radio"
        //                                                         name={`area.laundry.${key}.${sectionKey}.value`}
        //                                                         value="acceptable"
        //                                                         checked={formData.area.laundry[key][sectionKey].value === 'acceptable'}
        //                                                         className="radio radio-lg h-4 w-4 text-blue-600"
        //                                                         onChange={handleChange}
        //                                                     />
        //                                                 </div>

        //                                                 {/* Not Acceptable Radio */}
        //                                                 <div className="flex justify-center items-center">
        //                                                     <input
        //                                                         type="radio"
        //                                                         name={`area.laundry.${key}.${sectionKey}.value`}
        //                                                         value="not_acceptable"
        //                                                         checked={formData.area.laundry[key][sectionKey].value === 'not_acceptable'}
        //                                                         className="radio radio-lg h-4 w-4 text-blue-600"
        //                                                         onChange={handleChange}
        //                                                     />
        //                                                 </div>

        //                                                 {/* Remark Input - move to next line on md screens */}
        //                                                 <div className="col-span-4 flex items-center mt-2">
        //                                                     <input
        //                                                         type="input"
        //                                                         name={`area.laundry.${key}.${sectionKey}.remark`}
        //                                                         value={formData.area.laundry[key][sectionKey].remark}
        //                                                         className="input w-full"
        //                                                         onChange={handleChange}
        //                                                     />
        //                                                 </div>
        //                                             </React.Fragment>
        //                                         )
        //                                     ))}
        //                                 </div>
        //                             </div>
        //                         </div>
        //                     </div>
        //                 ))}
        //             </div>
        //             <div className="hidden" id="stepper_5">
        //                 {Object.entries(formData.area.dining).map(([key, section]) => (
        //                     <div className="card rounded-md mb-8" key={key}>
        //                         <div className="card-header px-4 rounded-t-md bg-gray-300 text-gray-900 font-bold">
        //                             <h2 className="">{section.label}</h2>
        //                         </div>
        //                         <div className="card-body text-sm px-4">
        //                             <div className="card w-auto mb-6">
        //                                 <div className="card-body">
        //                                     {/* <div className="badge">Add Attachments</div> */}

        //                                     <input
        //                                         className="file-input file-input-sm badge mb-2"
        //                                         multiple={true}
        //                                         type="file"
        //                                         name={`area.dining.${key}.attachments`}
        //                                         onChange={(e) => handleFileUpload(e, 'dining', key)}
        //                                     />

        //                                     <div className="flex flex-col mb-4">
        //                                         {formData.area.dining[key].attachments && Object.entries(formData.area.dining[key].attachments).map(([attachmentKey, uploadedFile]) => (
        //                                             <div key={attachmentKey} className="flex items-center space-x-4 mb-4">
        //                                                 <div className="flex-1 flex flex-col">
        //                                                     <a
        //                                                         href={uploadedFile.file_url}
        //                                                         className="text-slate-700"
        //                                                         target="_blank"
        //                                                         rel="noopener noreferrer"
        //                                                     >
        //                                                         {uploadedFile.original_name}
        //                                                     </a>
        //                                                     <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
        //                                                         <span>{uploadedFile.file ? formatFileSize(uploadedFile.file.size) : '-'}</span>
        //                                                     </div>
        //                                                 </div>
        //                                                 <button
        //                                                     className="px-2 py-2 rounded"
        //                                                     onClick={() => handleDelete(attachmentKey, 'dining', key)}
        //                                                 >
        //                                                     <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
        //                                                 </button>
        //                                             </div>
        //                                         ))}

        //                                     </div>
        //                                 </div>
        //                             </div>
        //                             {'other' in section ? (
        //                                 <>
        //                                     <span className="text-lg font-medium">Remark</span>
        //                                     <input
        //                                         type="input"
        //                                         name={`area.dining.${key}.other.remark`}
        //                                         value={formData.area.dining[key].other.remark}
        //                                         className="input w-full"
        //                                         onChange={handleChange}
        //                                     />
        //                                 </>
        //                             ) : (
        //                                 <div className="w-full">
        //                                     <div className="grid grid-cols-4 gap-4">
        //                                         {/* Header Row */}
        //                                         <div className="col-start-3 text-xs text-center text-gray-900 font-semibold">Acceptable</div>
        //                                         <div className="col-start-4 text-xs text-center text-gray-900 font-semibold">Not Acceptable</div>
        //                                         {/* <div className="col-start-4 text-xs text-center text-gray-900 font-semibold">Remark</div> */}

        //                                         {Object.entries(section).map(([sectionKey, question]) => (
        //                                             sectionKey.startsWith('q') && (
        //                                                 <React.Fragment key={sectionKey}>
        //                                                     <div className="col-span-2 flex items-center text-gray-900 font-semibold">{question.label}</div>

        //                                                     {/* Acceptable Radio */}
        //                                                     <div className="flex justify-center items-center">
        //                                                         <input
        //                                                             type="radio"
        //                                                             name={`area.dining.${key}.${sectionKey}.value`}
        //                                                             value="acceptable"
        //                                                             checked={formData.area.dining[key][sectionKey].value === 'acceptable'}
        //                                                             className="radio radio-lg h-4 w-4 text-blue-600"
        //                                                             onChange={handleChange}
        //                                                         />
        //                                                     </div>

        //                                                     {/* Not Acceptable Radio */}
        //                                                     <div className="flex justify-center items-center">
        //                                                         <input
        //                                                             type="radio"
        //                                                             name={`area.dining.${key}.${sectionKey}.value`}
        //                                                             value="not_acceptable"
        //                                                             checked={formData.area.dining[key][sectionKey].value === 'not_acceptable'}
        //                                                             className="radio radio-lg h-4 w-4 text-blue-600"
        //                                                             onChange={handleChange}
        //                                                         />
        //                                                     </div>

        //                                                     {/* Remark Input - move to next line on md screens */}
        //                                                     <div className="col-span-4 flex items-center mt-2">
        //                                                         <input
        //                                                             type="input"
        //                                                             name={`area.dining.${key}.${sectionKey}.remark`}
        //                                                             value={formData.area.dining[key][sectionKey].remark}
        //                                                             className="input w-full"
        //                                                             onChange={handleChange}
        //                                                         />
        //                                                     </div>
        //                                                 </React.Fragment>
        //                                             )
        //                                         ))}
        //                                     </div>
        //                                 </div>
        //                             )}
        //                         </div>
        //                     </div>
        //                 ))}
        //             </div>
        //             <div className="hidden" id="stepper_6">
        //                 {formData.include_commune_living ?
        //                     Object.entries(formData.area.commune).map(([key, section]) => (
        //                         <div className="card rounded-md mb-8" key={key}>
        //                             <div className="card-header px-4 rounded-t-md bg-gray-300 text-gray-900 font-bold">
        //                                 <h2 className="">{section.label}</h2>
        //                             </div>
        //                             <div className="card-body text-sm px-4">
        //                                 <div className="card w-auto mb-6">
        //                                     <div className="card-body">
        //                                         {/* <div className="badge">Add Attachments</div> */}

        //                                         <input
        //                                             className="file-input file-input-sm badge mb-2"
        //                                             multiple={true}
        //                                             type="file"
        //                                             name={`area.commune.${key}.attachments`}
        //                                             onChange={(e) => handleFileUpload(e, 'commune', key)}
        //                                         />

        //                                         <div className="flex flex-col mb-4">
        //                                             {formData.area.commune[key].attachments && Object.entries(formData.area.commune[key].attachments).map(([attachmentKey, uploadedFile]) => (
        //                                                 <div key={attachmentKey} className="flex items-center space-x-4 mb-4">
        //                                                     <div className="flex-1 flex flex-col">
        //                                                         <a
        //                                                             href={uploadedFile.file_url}
        //                                                             className="text-slate-700"
        //                                                             target="_blank"
        //                                                             rel="noopener noreferrer"
        //                                                         >
        //                                                             {uploadedFile.original_name}
        //                                                         </a>
        //                                                         <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
        //                                                             <span>{uploadedFile.file ? formatFileSize(uploadedFile.file.size) : '-'}</span>
        //                                                         </div>
        //                                                     </div>
        //                                                     <button
        //                                                         className="px-2 py-2 rounded"
        //                                                         onClick={() => handleDelete(attachmentKey, 'commune', key)}
        //                                                     >
        //                                                         <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
        //                                                     </button>
        //                                                 </div>
        //                                             ))}

        //                                         </div>
        //                                     </div>
        //                                 </div>
        //                                 {'other' in section ? (
        //                                     <>
        //                                         <span className="text-lg font-medium">Remark</span>
        //                                         <input
        //                                             type="input"
        //                                             name={`area.commune.${key}.other.remark`}
        //                                             value={formData.area.commune[key].other.remark}
        //                                             className="input w-full"
        //                                             onChange={handleChange}
        //                                         />
        //                                     </>
        //                                 ) : (
        //                                     <div className="w-full">
        //                                         <div className="grid grid-cols-4 gap-4">
        //                                             {/* Header Row */}
        //                                             <div className="col-start-3 text-xs text-center text-gray-900 font-semibold">Acceptable</div>
        //                                             <div className="col-start-4 text-xs text-center text-gray-900 font-semibold">Not Acceptable</div>
        //                                             {/* <div className="col-start-4 text-xs text-center text-gray-900 font-semibold">Remark</div> */}

        //                                             {Object.entries(section).map(([sectionKey, question]) => (
        //                                                 sectionKey.startsWith('q') && (
        //                                                     <React.Fragment key={sectionKey}>
        //                                                         <div className="col-span-2 flex items-center text-gray-900 font-semibold">{question.label}</div>

        //                                                         {/* Acceptable Radio */}
        //                                                         <div className="flex justify-center items-center">
        //                                                             <input
        //                                                                 type="radio"
        //                                                                 name={`area.commune.${key}.${sectionKey}.value`}
        //                                                                 value="acceptable"
        //                                                                 checked={formData.area.commune[key][sectionKey].value === 'acceptable'}
        //                                                                 className="radio radio-lg h-4 w-4 text-blue-600"
        //                                                                 onChange={handleChange}
        //                                                             />
        //                                                         </div>

        //                                                         {/* Not Acceptable Radio */}
        //                                                         <div className="flex justify-center items-center">
        //                                                             <input
        //                                                                 type="radio"
        //                                                                 name={`area.commune.${key}.${sectionKey}.value`}
        //                                                                 value="not_acceptable"
        //                                                                 checked={formData.area.commune[key][sectionKey].value === 'not_acceptable'}
        //                                                                 className="radio radio-lg h-4 w-4 text-blue-600"
        //                                                                 onChange={handleChange}
        //                                                             />
        //                                                         </div>

        //                                                         {/* Remark Input - move to next line on md screens */}
        //                                                         <div className="col-span-4 flex items-center mt-2">
        //                                                             <input
        //                                                                 type="input"
        //                                                                 name={`area.commune.${key}.${sectionKey}.remark`}
        //                                                                 value={formData.area.commune[key][sectionKey].remark}
        //                                                                 className="input w-full"
        //                                                                 onChange={handleChange}
        //                                                             />
        //                                                         </div>
        //                                                     </React.Fragment>
        //                                                 )
        //                                             ))}
        //                                         </div>
        //                                     </div>
        //                                 )}
        //                             </div>
        //                         </div>
        //                     ))
        //                     :
        //                     <div className="text-lg font-semibold text-center">The Commune Living is not included. To include the Commune Living, navigate to the General tab and select option 'Yes' under Commune Living Selection</div>
        //                 }
        //             </div>
        //             <div className="hidden" id="stepper_7">
        //                 {/* <div className="flex mb-4 flex-wrap justify-start gap-2">
        //                     {Object.entries(formData.area.bedrooms).map(([key, bedroom]) => (
        //                         <button className="btn btn-sm btn-dark" key={key} data-scrollto={`#scrollto_${key}`} data-scrollto-parent="#scrollable">{key}</button>
        //                     ))}
        //                 </div> */}

        //                 {Object.entries(formData.area.bedrooms).map(([key, bedroom]) => (
        //                     <div key={key} id={`scrollto_${key}`}>
        //                         <h2 className="text-xl font-semibold capitalize mb-2">{key}</h2>
        //                         {Object.entries(bedroom).map(([bedroomKey, section]) => (
        //                             <div className="card rounded-md mb-8" key={bedroomKey}>
        //                                 <div className="card-header px-4 rounded-t-md bg-gray-300 text-gray-900 font-bold">
        //                                     <h2 className="">{section.label}</h2>
        //                                 </div>
        //                                 <div className="card-body text-sm px-4">
        //                                     <div className="card w-auto mb-6">
        //                                         <div className="card-body">
        //                                             {/* <div className="badge">Add Attachments</div> */}

        //                                             <input
        //                                                 className="file-input file-input-sm badge mb-2"
        //                                                 multiple={true}
        //                                                 type="file"
        //                                                 name={`area.bedrooms.${key}.${bedroomKey}.attachments`}
        //                                                 onChange={(e) => handleFileUpload(e, 'bedrooms', bedroomKey, key)}
        //                                             />

        //                                             <div className="flex flex-col mb-4">
        //                                                 {formData.area.bedrooms[key][bedroomKey].attachments && Object.entries(formData.area.bedrooms[key][bedroomKey].attachments).map(([attachmentKey, uploadedFile]) => (
        //                                                     <div key={attachmentKey} className="flex items-center space-x-4 mb-4">
        //                                                         <div className="flex-1 flex flex-col">
        //                                                             <a
        //                                                                 href={uploadedFile.file_url}
        //                                                                 className="text-slate-700"
        //                                                                 target="_blank"
        //                                                                 rel="noopener noreferrer"
        //                                                             >
        //                                                                 {uploadedFile.original_name}
        //                                                             </a>
        //                                                             <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
        //                                                                 <span>{uploadedFile.file ? formatFileSize(uploadedFile.file.size) : '-'}</span>
        //                                                             </div>
        //                                                         </div>
        //                                                         <button
        //                                                             className="px-2 py-2 rounded"
        //                                                             onClick={() => handleDelete(attachmentKey, 'bedrooms', bedroomKey, key)}
        //                                                         >
        //                                                             <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
        //                                                         </button>
        //                                                     </div>
        //                                                 ))}

        //                                             </div>
        //                                         </div>
        //                                     </div>
        //                                     {'other' in section ? (
        //                                         <>
        //                                             <span className="text-lg font-medium">Remark</span>
        //                                             <input
        //                                                 type="input"
        //                                                 name={`area.bedrooms.${key}.${bedroomKey}.other.remark`}
        //                                                 value={formData.area.bedrooms[key][bedroomKey].other.remark}
        //                                                 className="input w-full"
        //                                                 onChange={handleChange}
        //                                             />
        //                                         </>
        //                                     ) : (
        //                                         <div className="w-full">
        //                                             <div className="grid grid-cols-4 gap-4">
        //                                                 {/* Header Row */}
        //                                                 <div className="col-start-3 text-xs text-center text-gray-900 font-semibold">Acceptable</div>
        //                                                 <div className="col-start-4 text-xs text-center text-gray-900 font-semibold">Not Acceptable</div>
        //                                                 {/* <div className="col-start-4 text-xs text-center text-gray-900 font-semibold">Remark</div> */}

        //                                                 {Object.entries(section).map(([sectionKey, question]) => (
        //                                                     sectionKey.startsWith('q') && (
        //                                                         <React.Fragment key={sectionKey}>
        //                                                             <div className="col-span-2 flex items-center text-gray-900 font-semibold">{question.label}</div>

        //                                                             {/* Acceptable Radio */}
        //                                                             <div className="flex justify-center items-center">
        //                                                                 <input
        //                                                                     type="radio"
        //                                                                     name={`area.bedrooms.${key}.${bedroomKey}.${sectionKey}.value`}
        //                                                                     value="acceptable"
        //                                                                     checked={formData.area.bedrooms[key][bedroomKey][sectionKey].value === 'acceptable'}
        //                                                                     className="radio radio-lg h-4 w-4 text-blue-600"
        //                                                                     onChange={handleChange}
        //                                                                 />
        //                                                             </div>

        //                                                             {/* Not Acceptable Radio */}
        //                                                             <div className="flex justify-center items-center">
        //                                                                 <input
        //                                                                     type="radio"
        //                                                                     name={`area.bedrooms.${key}.${bedroomKey}.${sectionKey}.value`}
        //                                                                     value="not_acceptable"
        //                                                                     checked={formData.area.bedrooms[key][bedroomKey][sectionKey].value === 'not_acceptable'}
        //                                                                     className="radio radio-lg h-4 w-4 text-blue-600"
        //                                                                     onChange={handleChange}
        //                                                                 />
        //                                                             </div>

        //                                                             {/* Remark Input - move to next line on md screens */}
        //                                                             <div className="col-span-4 flex items-center mt-2">
        //                                                                 <input
        //                                                                     type="input"
        //                                                                     name={`area.bedrooms.${key}.${bedroomKey}.${sectionKey}.remark`}
        //                                                                     value={formData.area.bedrooms[key][bedroomKey][sectionKey].remark}
        //                                                                     className="input w-full"
        //                                                                     onChange={handleChange}
        //                                                                 />
        //                                                             </div>
        //                                                         </React.Fragment>
        //                                                     )
        //                                                 ))}
        //                                             </div>
        //                                         </div>
        //                                     )}
        //                                 </div>
        //                             </div>
        //                         ))}
        //                     </div>
        //                 ))}

        //             </div>
        //             <div className="hidden" id="stepper_8">
        //                 {Object.entries(formData.area.bathrooms).map(([key, bathroom]) => (
        //                     <div key={key}>
        //                         <h2 className="text-xl font-semibold capitalize mb-2">{key}</h2>
        //                         {Object.entries(bathroom).map(([bathroomKey, section]) => (
        //                             <div className="card rounded-md mb-8" key={bathroomKey}>
        //                                 <div className="card-header px-4 rounded-t-md bg-gray-300 text-gray-900 font-bold">
        //                                     <h2 className="">{section.label}</h2>
        //                                 </div>
        //                                 <div className="card-body text-sm px-4">
        //                                     <div className="card w-auto mb-6">
        //                                         <div className="card-body">
        //                                             {/* <div className="badge">Add Attachments</div> */}

        //                                             <input
        //                                                 className="file-input file-input-sm badge mb-2"
        //                                                 multiple={true}
        //                                                 type="file"
        //                                                 name={`area.bathrooms.${key}.${bathroomKey}.attachments`}
        //                                                 onChange={(e) => handleFileUpload(e, 'bathrooms', bathroomKey, key)}
        //                                             />

        //                                             <div className="flex flex-col mb-4">
        //                                                 {formData.area.bathrooms[key][bathroomKey].attachments && Object.entries(formData.area.bathrooms[key][bathroomKey].attachments).map(([attachmentKey, uploadedFile]) => (
        //                                                     <div key={attachmentKey} className="flex items-center space-x-4 mb-4">
        //                                                         <div className="flex-1 flex flex-col">
        //                                                             <a
        //                                                                 href={uploadedFile.file_url}
        //                                                                 className="text-slate-700"
        //                                                                 target="_blank"
        //                                                                 rel="noopener noreferrer"
        //                                                             >
        //                                                                 {uploadedFile.original_name}
        //                                                             </a>
        //                                                             <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
        //                                                                 <span>{uploadedFile.file ? formatFileSize(uploadedFile.file.size) : '-'}</span>
        //                                                             </div>
        //                                                         </div>
        //                                                         <button
        //                                                             className="px-2 py-2 rounded"
        //                                                             onClick={() => handleDelete(attachmentKey, 'bathrooms', bathroomKey, key)}
        //                                                         >
        //                                                             <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
        //                                                         </button>
        //                                                     </div>
        //                                                 ))}

        //                                             </div>
        //                                         </div>
        //                                     </div>
        //                                     {'other' in section ? (
        //                                         <>
        //                                             <span className="text-lg font-medium">Remark</span>
        //                                             <input
        //                                                 type="input"
        //                                                 name={`area.bathrooms.${key}.${bathroomKey}.other.remark`}
        //                                                 value={formData.area.bathrooms[key][bathroomKey].other.remark}
        //                                                 className="input w-full"
        //                                                 onChange={handleChange}
        //                                             />
        //                                         </>
        //                                     ) : (
        //                                         <div className="w-full">
        //                                             <div className="grid grid-cols-4 gap-4">
        //                                                 {/* Header Row */}
        //                                                 <div className="col-start-3 text-xs text-center text-gray-900 font-semibold">Acceptable</div>
        //                                                 <div className="col-start-4 text-xs text-center text-gray-900 font-semibold">Not Acceptable</div>
        //                                                 {/* <div className="col-start-4 text-xs text-center text-gray-900 font-semibold">Remark</div> */}

        //                                                 {Object.entries(section).map(([sectionKey, question]) => (
        //                                                     sectionKey.startsWith('q') && (
        //                                                         <React.Fragment key={sectionKey}>
        //                                                             <div className="col-span-2 flex items-center text-gray-900 font-semibold">{question.label}</div>

        //                                                             {/* Acceptable Radio */}
        //                                                             <div className="flex justify-center items-center">
        //                                                                 <input
        //                                                                     type="radio"
        //                                                                     name={`area.bathrooms.${key}.${bathroomKey}.${sectionKey}.value`}
        //                                                                     value="acceptable"
        //                                                                     checked={formData.area.bathrooms[key][bathroomKey][sectionKey].value === 'acceptable'}
        //                                                                     className="radio radio-lg h-4 w-4 text-blue-600"
        //                                                                     onChange={handleChange}
        //                                                                 />
        //                                                             </div>

        //                                                             {/* Not Acceptable Radio */}
        //                                                             <div className="flex justify-center items-center">
        //                                                                 <input
        //                                                                     type="radio"
        //                                                                     name={`area.bathrooms.${key}.${bathroomKey}.${sectionKey}.value`}
        //                                                                     value="not_acceptable"
        //                                                                     checked={formData.area.bathrooms[key][bathroomKey][sectionKey].value === 'not_acceptable'}
        //                                                                     className="radio radio-lg h-4 w-4 text-blue-600"
        //                                                                     onChange={handleChange}
        //                                                                 />
        //                                                             </div>

        //                                                             {/* Remark Input - move to next line on md screens */}
        //                                                             <div className="col-span-4 flex items-center mt-2">
        //                                                                 <input
        //                                                                     type="input"
        //                                                                     name={`area.bathrooms.${key}.${bathroomKey}.${sectionKey}.remark`}
        //                                                                     value={formData.area.bathrooms[key][bathroomKey][sectionKey].remark}
        //                                                                     className="input w-full"
        //                                                                     onChange={handleChange}
        //                                                                 />
        //                                                             </div>
        //                                                         </React.Fragment>
        //                                                     )
        //                                                 ))}
        //                                             </div>
        //                                         </div>
        //                                     )}
        //                                 </div>
        //                             </div>
        //                         ))}
        //                     </div>
        //                 ))}
        //             </div>
        //         </div>
        //         <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2">
        //             <button
        //                 className="btn btn-lg btn-secondary rounded-3xl shadow-lg mr-4 stepper-first:hidden"
        //                 data-stepper-back="true"
        //             >
        //                 Back
        //             </button>

        //             <button
        //                 className="btn btn-lg btn-primary rounded-3xl shadow-lg stepper-last:hidden"
        //                 data-stepper-next="true"
        //                 onClick={() => window.scrollTo(0, 0)}
        //             >
        //                 Next
        //             </button>
        //             <button
        //                 className="btn btn-lg btn-primary rounded-3xl shadow-lg hidden stepper-last:inline-flex"
        //                 onClick={handleSubmit}
        //             >
        //                 Submit
        //             </button>
        //         </div>
        //     </div>

        //     <div className="h-20">
                
        //     </div>
        // </>
        <></>
    )
}

export default OwnerInspectionReport;