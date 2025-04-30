// import React, { useEffect, useState } from "react";
// import KTComponents from "../../metronic/core";
// import { useNavigate, useParams } from "react-router-dom";
// import { fetchQCForm } from "../../services/operationApi";
// import { QCForm } from "../../types";

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

function QCFormDetail() {
    // const navigate = useNavigate();
    // const { id } = useParams<{ id: string }>();
    // const qcFormId = id ? parseInt(id, 10) : null;
    // const [formData, setFormData] = useState<QCForm>(initQCForm);

    // useEffect(() => {
    //     document.title = "OC Form Detail | RenoXpert";

    //     const initFunctions = async () => {
    //         await getQCForm();
    //         await KTComponents.init();
    //     };

    //     initFunctions();
    // }, []);

    // const handleBackClick = () => {
    //     navigate(-1);
    // }

    // const mergeFormData = (formData: QCForm, responseData: any): QCForm => {
    //     // Recursive function to merge the formData and responseData
    //     const deepMerge = (data1: any, data2: any) => {
    //         // If both are objects, recursively merge them
    //         if (typeof data1 === 'object' && data1 !== null && typeof data2 === 'object' && data2 !== null) {
    //             const result = { ...data1 };

    //             // Iterate over the keys in responseData
    //             Object.keys(data2).forEach((key) => {
    //                 // Do not overwrite 'label' fields
    //                 if (key === 'label') return;

    //                 // If the key exists in both formData and responseData, and it's an object, merge them recursively
    //                 if (data1[key] && typeof data1[key] === 'object' && data2[key] && typeof data2[key] === 'object') {
    //                     result[key] = deepMerge(data1[key], data2[key]);
    //                 } else {
    //                     // Otherwise, just overwrite with responseData
    //                     result[key] = data2[key];
    //                 }
    //             });

    //             return result;
    //         }

    //         // If it's not an object, just return the second data (responseData)
    //         return data2;
    //     };

    //     return deepMerge(formData, responseData);
    // };

    // // Usage in your async function
    // const getQCForm = async () => {
    //     try {
    //         const response = await fetchQCForm(Number(qcFormId));

    //         if (response?.success) {
    //             const mergedData = mergeFormData(formData, response.data);
    //             setFormData(mergedData); // Update state with merged data
    //         } else {
    //             console.log(response?.message);
    //         }
    //     } catch (error) {
    //         console.log(error);
    //     }
    // };

    return (
        // <div className="card w-full" data-tabs="true">
        //     <div className="card-header py-2">
        //         <div className="flex gap-4 items-center">
        //             <button className='text-gray-800 dark:text-gray-400' onClick={handleBackClick}>
        //                 <i className="ki-solid ki-arrow-left"></i>
        //             </button>
        //             <h2 className="text-slate-900 text-lg font-semibold">QC Form Detail</h2>
        //         </div>
        //     </div>
        //     <div className="card-group">
        //         <div className="flex flex-wrap justify-center items-center gap-4">
        //             <button className="badge badge-xs active flex gap-2.5 items-center cursor-pointer" data-tab-toggle="#tab_1">
        //                 <div className="flex flex-col gap-0.5">
        //                     <h4 className="text-sm font-medium text-gray-900 tab-active:text-primary">
        //                         General
        //                     </h4>
        //                 </div>
        //             </button>
        //             <button className={`badge badge-xs flex gap-2.5 items-center cursor-pointer`} data-tab-toggle="#tab_2">
        //                 <div className="flex flex-col gap-0.5">
        //                     <h4 className="text-sm font-medium text-gray-900 tab-active:text-primary">
        //                         Foyer & Entrance
        //                     </h4>
        //                 </div>
        //             </button>
        //             <button className={`badge badge-xs flex gap-2.5 items-center cursor-pointer`} data-tab-toggle="#tab_3">
        //                 <div className="flex flex-col gap-0.5">
        //                     <h4 className="text-sm font-medium text-gray-900 tab-active:text-primary">
        //                         Kitchen
        //                     </h4>
        //                 </div>
        //             </button>
        //             <button className={`badge badge-xs flex gap-2.5 items-center cursor-pointer`} data-tab-toggle="#tab_4">
        //                 <div className="flex flex-col gap-0.5">
        //                     <h4 className="text-sm font-medium text-gray-900 tab-active:text-primary">
        //                         Laundry Yard
        //                     </h4>
        //                 </div>
        //             </button>
        //             <button className={`badge badge-xs flex gap-2.5 items-center cursor-pointer`} data-tab-toggle="#tab_5">
        //                 <div className="flex flex-col gap-0.5">
        //                     <h4 className="text-sm font-medium text-gray-900 tab-active:text-primary">
        //                         Dining
        //                     </h4>
        //                 </div>
        //             </button>
        //             <button className={`badge badge-xs flex gap-2.5 items-center cursor-pointer`} data-tab-toggle="#tab_6">
        //                 <div className="flex flex-col gap-0.5">
        //                     <h4 className="text-sm font-medium text-gray-900 tab-active:text-primary" >
        //                         Commune Living
        //                     </h4>
        //                 </div>
        //             </button>
        //             <button className={`badge badge-xs flex gap-2.5 items-center cursor-pointer`} data-tab-toggle="#tab_7">
        //                 <div className="flex flex-col gap-0.5">
        //                     <h4 className="text-sm font-medium text-gray-900 tab-active:text-primary">
        //                         Bedrooms
        //                     </h4>
        //                 </div>
        //             </button>
        //             <button className={`badge badge-xs flex gap-2.5 items-center cursor-pointer`} data-tab-toggle="#tab_8">
        //                 <div className="flex flex-col gap-0.5">
        //                     <h4 className="text-sm font-medium text-gray-900 tab-active:text-primary">
        //                         Bathrooms
        //                     </h4>
        //                 </div>
        //             </button>
        //         </div>
        //     </div>
        //     <div className="card-body">
        //         <div className="" id="tab_1">
        //             <div className="flex flex-col">
        //                 <div className="flex flex-col mb-8">
        //                     <span className="text-slate-900 mb-2 font-medium">Date & Time</span>
        //                     <div className="flex gap-6">
        //                         <div className="badge badge-lg">{formData.date}</div>
        //                         <div className="badge badge-lg">{formData.time}</div>
        //                     </div>
        //                 </div>
        //                 <div className="flex flex-col mb-8">
        //                     <span className="text-slate-900 mb-2 font-medium">Inspector</span>
        //                     <div className="flex gap-6">
        //                         <div className="badge badge-lg badge-outline badge-dark">{formData.inspector_first_name} {formData.inspector_last_name}</div>
        //                     </div>
        //                 </div>
        //                 <div className="flex flex-col mb-8">
        //                     <span className="text-slate-900 mb-2 font-medium">Property</span>
        //                     <div className="flex gap-6">
        //                         <div className="text-md font-semibold">{formData.property.property_name} ({formData.property.block}-{formData.property.level}-{formData.property.unit})</div>
        //                     </div>
        //                 </div>
        //                 <div className="flex flex-col mb-8">
        //                     <span className="text-slate-900 mb-2 font-medium">Total Bedrooms</span>
        //                     <div className="flex gap-6">
        //                         <div className="text-md font-semibold">{formData.bedroom_count}</div>
        //                     </div>
        //                 </div>
        //                 <div className="flex flex-col mb-8">
        //                     <span className="text-slate-900 mb-2 font-medium">Total Bathrooms</span>
        //                     <div className="flex gap-6">
        //                         <div className="text-md font-semibold">{formData.bathroom_count}</div>
        //                     </div>
        //                 </div>
        //                 <div className="flex flex-col mb-8">
        //                     <span className="text-slate-900 mb-2 font-medium">Include Commune Living?</span>
        //                     <div className="flex gap-6">
        //                         <div className="text-md font-semibold">{formData.include_commune_living ? 'Yes' : 'No'}</div>
        //                     </div>
        //                 </div>

        //                 <div className="flex flex-col mb-8">
        //                     <img src="/media/form/1.jpeg" alt="" />
        //                 </div>

        //                 <div className="flex flex-col mb-12">
        //                     <span className="text-sm text-gray-900 text-justify mb-6">
        //                         ** Image above is an example for room numbering. This is our method to determine the arrangement of rooms for each layout type. Kindly refer and don't hesitate to ask our sales team for assistance!
        //                     </span>

        //                     <span className="text-sm text-gray-900 text-justify">
        //                         ** Room numbering is based on clockwise rotating basis
        //                     </span>
        //                 </div>
        //             </div>
        //         </div>
        //         <div className="hidden" id="tab_2">
        //             {Object.entries(formData.area.foyer).map(([key, section]) => (
        //                 <div className="card rounded-md mb-8" key={key}>
        //                     <div className="card-header px-4 rounded-t-md bg-gray-300 text-gray-900 font-bold">
        //                         <h2 className="">{section.label}</h2>
        //                     </div>
        //                     <div className="card-body text-sm px-4">
        //                         <div className="card w-auto mb-6">
        //                             <div className="card-body">
        //                                 {/* <div className="badge">Add Attachments</div> */}
        //                                 <div className="flex flex-col mb-4">
        //                                     {formData.area.foyer[key].attachments && Object.entries(formData.area.foyer[key].attachments).map(([attachmentKey, uploadedFile]) => (
        //                                         <div key={attachmentKey} className="flex items-center space-x-4 mb-4">
        //                                             <div className="flex-1 flex flex-col">
        //                                                 <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
        //                                                     <span>{uploadedFile.file ? formatFileSize(uploadedFile.file.size) : '-'}</span>
        //                                                 </div>
        //                                             </div>
        //                                             <button
        //                                                 className="px-2 py-2 rounded"
        //                                             // onClick={() => handleDelete(attachmentKey, 'foyer', key)}
        //                                             >
        //                                                 <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
        //                                             </button>
        //                                         </div>
        //                                     ))}

        //                                 </div>
        //                             </div>
        //                         </div>
        //                         <div className="w-full">
        //                             <div className="grid grid-cols-4 gap-4">
        //                                 {/* Header Row */}
        //                                 <div className="col-start-3 text-xs text-center text-gray-900 font-semibold">Acceptable</div>
        //                                 <div className="col-start-4 text-xs text-center text-gray-900 font-semibold">Not Acceptable</div>
        //                                 {/* <div className="col-start-4 text-xs text-center text-gray-900 font-semibold">Remark</div> */}

        //                                 {Object.entries(section).map(([sectionKey, question]) => (
        //                                     sectionKey.startsWith('q') && (
        //                                         <React.Fragment key={sectionKey}>
        //                                             <div className="col-span-2 flex items-center text-gray-900 font-semibold">{question.label}</div>

        //                                             {/* Acceptable Radio */}
        //                                             <div className="flex justify-center items-center">
        //                                                 <input
        //                                                     type="radio"
        //                                                     name={`area.foyer.${key}.${sectionKey}.value`}
        //                                                     value="acceptable"
        //                                                     checked={formData.area.foyer[key][sectionKey].value === 'acceptable'}
        //                                                     className="radio radio-lg h-4 w-4 text-blue-600"
        //                                                     readOnly
        //                                                 />
        //                                             </div>

        //                                             {/* Not Acceptable Radio */}
        //                                             <div className="flex justify-center items-center">
        //                                                 <input
        //                                                     type="radio"
        //                                                     name={`area.foyer.${key}.${sectionKey}.value`}
        //                                                     value="not_acceptable"
        //                                                     checked={formData.area.foyer[key][sectionKey].value === 'not_acceptable'}
        //                                                     className="radio radio-lg h-4 w-4 text-blue-600"
        //                                                     readOnly
        //                                                 />
        //                                             </div>

        //                                             {/* Remark Input - move to next line on md screens */}
        //                                             <div className="col-span-4 flex items-center mt-2">
        //                                                 <div className="flex flex-col w-full">
        //                                                     <span className="text-xs text-gray-900 font-semibold">Remark:</span>
        //                                                     <span className="text-xs border border-gray-300 rounded-md p-2">{formData.area.foyer[key][sectionKey].remark ? formData.area.foyer[key][sectionKey].remark : '-'}</span>
        //                                                 </div>
        //                                             </div>
        //                                         </React.Fragment>
        //                                     )
        //                                 ))}
        //                             </div>
        //                         </div>
        //                     </div>
        //                 </div>
        //             ))}
        //         </div>
        //         <div className="hidden" id="tab_3">
        //             {Object.entries(formData.area.kitchen).map(([key, section]) => (
        //                 <div className="card rounded-md mb-8" key={key}>
        //                     <div className="card-header px-4 rounded-t-md bg-gray-300 text-gray-900 font-bold">
        //                         <h2 className="">{section.label}</h2>
        //                     </div>
        //                     <div className="card-body text-sm px-4">
        //                         <div className="card w-auto mb-6">
        //                             <div className="card-body">
        //                                 {/* <div className="badge">Add Attachments</div> */}
        //                                 <div className="flex flex-col mb-4">
        //                                     {formData.area.kitchen[key].attachments && Object.entries(formData.area.kitchen[key].attachments).map(([attachmentKey, uploadedFile]) => (
        //                                         <div key={attachmentKey} className="flex items-center space-x-4 mb-4">
        //                                             <div className="flex-1 flex flex-col">
        //                                                 <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
        //                                                     <span>{uploadedFile.file ? formatFileSize(uploadedFile.file.size) : '-'}</span>
        //                                                 </div>
        //                                             </div>
        //                                             <button
        //                                                 className="px-2 py-2 rounded"
        //                                             // onClick={() => handleDelete(attachmentKey, 'kitchen', key)}
        //                                             >
        //                                                 <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
        //                                             </button>
        //                                         </div>
        //                                     ))}

        //                                 </div>
        //                             </div>
        //                         </div>
        //                         <div className="w-full">
        //                             <div className="grid grid-cols-4 gap-4">
        //                                 {/* Header Row */}
        //                                 <div className="col-start-3 text-xs text-center text-gray-900 font-semibold">Acceptable</div>
        //                                 <div className="col-start-4 text-xs text-center text-gray-900 font-semibold">Not Acceptable</div>
        //                                 {/* <div className="col-start-4 text-xs text-center text-gray-900 font-semibold">Remark</div> */}

        //                                 {Object.entries(section).map(([sectionKey, question]) => (
        //                                     sectionKey.startsWith('q') && (
        //                                         <React.Fragment key={sectionKey}>
        //                                             <div className="col-span-2 flex items-center text-gray-900 font-semibold">{question.label}</div>

        //                                             {/* Acceptable Radio */}
        //                                             <div className="flex justify-center items-center">
        //                                                 <input
        //                                                     type="radio"
        //                                                     name={`area.kitchen.${key}.${sectionKey}.value`}
        //                                                     value="acceptable"
        //                                                     checked={formData.area.kitchen[key][sectionKey].value === 'acceptable'}
        //                                                     className="radio radio-lg h-4 w-4 text-blue-600"
        //                                                     readOnly
        //                                                 />
        //                                             </div>

        //                                             {/* Not Acceptable Radio */}
        //                                             <div className="flex justify-center items-center">
        //                                                 <input
        //                                                     type="radio"
        //                                                     name={`area.kitchen.${key}.${sectionKey}.value`}
        //                                                     value="not_acceptable"
        //                                                     checked={formData.area.kitchen[key][sectionKey].value === 'not_acceptable'}
        //                                                     className="radio radio-lg h-4 w-4 text-blue-600"
        //                                                     readOnly
        //                                                 />
        //                                             </div>

        //                                             {/* Remark Input - move to next line on md screens */}
        //                                             <div className="col-span-4 flex items-center mt-2">
        //                                                 <div className="flex flex-col w-full">
        //                                                     <span className="text-xs text-gray-900 font-semibold">Remark:</span>
        //                                                     <span className="text-xs border border-gray-300 rounded-md p-2">{formData.area.kitchen[key][sectionKey].remark ? formData.area.kitchen[key][sectionKey].remark : '-'}</span>
        //                                                 </div>
        //                                             </div>
        //                                         </React.Fragment>
        //                                     )
        //                                 ))}
        //                             </div>
        //                         </div>
        //                     </div>
        //                 </div>
        //             ))}
        //         </div>
        //         <div className="hidden" id="tab_4">
        //             {Object.entries(formData.area.laundry).map(([key, section]) => (
        //                 <div className="card rounded-md mb-8" key={key}>
        //                     <div className="card-header px-4 rounded-t-md bg-gray-300 text-gray-900 font-bold">
        //                         <h2 className="">{section.label}</h2>
        //                     </div>
        //                     <div className="card-body text-sm px-4">
        //                         <div className="card w-auto mb-6">
        //                             <div className="card-body">
        //                                 {/* <div className="badge">Add Attachments</div> */}
        //                                 <div className="flex flex-col mb-4">
        //                                     {formData.area.laundry[key].attachments && Object.entries(formData.area.laundry[key].attachments).map(([attachmentKey, uploadedFile]) => (
        //                                         <div key={attachmentKey} className="flex items-center space-x-4 mb-4">
        //                                             <div className="flex-1 flex flex-col">
        //                                                 <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
        //                                                     <span>{uploadedFile.file ? formatFileSize(uploadedFile.file.size) : '-'}</span>
        //                                                 </div>
        //                                             </div>
        //                                             <button
        //                                                 className="px-2 py-2 rounded"
        //                                             // onClick={() => handleDelete(attachmentKey, 'laundry', key)}
        //                                             >
        //                                                 <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
        //                                             </button>
        //                                         </div>
        //                                     ))}

        //                                 </div>
        //                             </div>
        //                         </div>
        //                         <div className="w-full">
        //                             <div className="grid grid-cols-4 gap-4">
        //                                 {/* Header Row */}
        //                                 <div className="col-start-3 text-xs text-center text-gray-900 font-semibold">Acceptable</div>
        //                                 <div className="col-start-4 text-xs text-center text-gray-900 font-semibold">Not Acceptable</div>
        //                                 {/* <div className="col-start-4 text-xs text-center text-gray-900 font-semibold">Remark</div> */}

        //                                 {Object.entries(section).map(([sectionKey, question]) => (
        //                                     sectionKey.startsWith('q') && (
        //                                         <React.Fragment key={sectionKey}>
        //                                             <div className="col-span-2 flex items-center text-gray-900 font-semibold">{question.label}</div>

        //                                             {/* Acceptable Radio */}
        //                                             <div className="flex justify-center items-center">
        //                                                 <input
        //                                                     type="radio"
        //                                                     name={`area.laundry.${key}.${sectionKey}.value`}
        //                                                     value="acceptable"
        //                                                     checked={formData.area.laundry[key][sectionKey].value === 'acceptable'}
        //                                                     className="radio radio-lg h-4 w-4 text-blue-600"
        //                                                     readOnly
        //                                                 />
        //                                             </div>

        //                                             {/* Not Acceptable Radio */}
        //                                             <div className="flex justify-center items-center">
        //                                                 <input
        //                                                     type="radio"
        //                                                     name={`area.laundry.${key}.${sectionKey}.value`}
        //                                                     value="not_acceptable"
        //                                                     checked={formData.area.laundry[key][sectionKey].value === 'not_acceptable'}
        //                                                     className="radio radio-lg h-4 w-4 text-blue-600"
        //                                                     readOnly
        //                                                 />
        //                                             </div>

        //                                             {/* Remark Input - move to next line on md screens */}
        //                                             <div className="col-span-4 flex items-center mt-2">
        //                                                 <div className="flex flex-col w-full">
        //                                                     <span className="text-xs text-gray-900 font-semibold">Remark:</span>
        //                                                     <span className="text-xs border border-gray-300 rounded-md p-2">{formData.area.laundry[key][sectionKey].remark ? formData.area.laundry[key][sectionKey].remark : '-'}</span>
        //                                                 </div>
        //                                             </div>
        //                                         </React.Fragment>
        //                                     )
        //                                 ))}
        //                             </div>
        //                         </div>
        //                     </div>
        //                 </div>
        //             ))}
        //         </div>
        //         <div className="hidden" id="tab_5">
        //             {Object.entries(formData.area.dining).map(([key, section]) => (
        //                 <div className="card rounded-md mb-8" key={key}>
        //                     <div className="card-header px-4 rounded-t-md bg-gray-300 text-gray-900 font-bold">
        //                         <h2 className="">{section.label}</h2>
        //                     </div>
        //                     <div className="card-body text-sm px-4">
        //                         <div className="card w-auto mb-6">
        //                             <div className="card-body">
        //                                 {/* <div className="badge">Add Attachments</div> */}
        //                                 <div className="flex flex-col mb-4">
        //                                     {formData.area.dining[key].attachments && Object.entries(formData.area.dining[key].attachments).map(([attachmentKey, uploadedFile]) => (
        //                                         <div key={attachmentKey} className="flex items-center space-x-4 mb-4">
        //                                             <div className="flex-1 flex flex-col">
        //                                                 <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
        //                                                     <span>{uploadedFile.file ? formatFileSize(uploadedFile.file.size) : '-'}</span>
        //                                                 </div>
        //                                             </div>
        //                                             <button
        //                                                 className="px-2 py-2 rounded"
        //                                             // onClick={() => handleDelete(attachmentKey, 'dining', key)}
        //                                             >
        //                                                 <i className="ki-solid ki-trash-square text-4xl text-red-500 "></i>
        //                                             </button>
        //                                         </div>
        //                                     ))}

        //                                 </div>
        //                             </div>
        //                         </div>
        //                         {'other' in section ? (
        //                             <>
        //                                 <div className="col-span-4 flex items-center mt-2">
        //                                     <div className="flex flex-col w-full">
        //                                         <span className="text-xs text-gray-900 font-semibold">Remark:</span>
        //                                         <span className="text-xs border border-gray-300 rounded-md p-2">{formData.area.dining[key].other.remark ? formData.area.dining[key].other.remark : '-'}</span>
        //                                     </div>
        //                                 </div>
        //                             </>
        //                         ) :
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
        //                                                         name={`area.dining.${key}.${sectionKey}.value`}
        //                                                         value="acceptable"
        //                                                         checked={formData.area.dining[key][sectionKey].value === 'acceptable'}
        //                                                         className="radio radio-lg h-4 w-4 text-blue-600"
        //                                                         readOnly
        //                                                     />
        //                                                 </div>

        //                                                 {/* Not Acceptable Radio */}
        //                                                 <div className="flex justify-center items-center">
        //                                                     <input
        //                                                         type="radio"
        //                                                         name={`area.dining.${key}.${sectionKey}.value`}
        //                                                         value="not_acceptable"
        //                                                         checked={formData.area.dining[key][sectionKey].value === 'not_acceptable'}
        //                                                         className="radio radio-lg h-4 w-4 text-blue-600"
        //                                                         readOnly
        //                                                     />
        //                                                 </div>

        //                                                 {/* Remark Input - move to next line on md screens */}
        //                                                 <div className="col-span-4 flex items-center mt-2">
        //                                                     <div className="flex flex-col w-full">
        //                                                         <span className="text-xs text-gray-900 font-semibold">Remark:</span>
        //                                                         <span className="text-xs border border-gray-300 rounded-md p-2">{formData.area.dining[key][sectionKey].remark ? formData.area.dining[key][sectionKey].remark : '-'}</span>
        //                                                     </div>
        //                                                 </div>
        //                                             </React.Fragment>
        //                                         )
        //                                     ))}
        //                                 </div>
        //                             </div>
        //                         }
        //                     </div>
        //                 </div>
        //             ))}
        //         </div>
        //         <div className="hidden" id="tab_6">
        //             {formData.include_commune_living ?
        //                 Object.entries(formData.area.commune).map(([key, section]) => (
        //                     <div className="card rounded-md mb-8" key={key}>
        //                         <div className="card-header px-4 rounded-t-md bg-gray-300 text-gray-900 font-bold">
        //                             <h2 className="">{section.label}</h2>
        //                         </div>
        //                         <div className="card-body text-sm px-4">
        //                             <div className="card w-auto mb-6">
        //                                 <div className="card-body">
        //                                     {/* <div className="badge">Add Attachments</div> */}
        //                                     <div className="flex flex-col mb-4">
        //                                         {formData.area.commune[key].attachments && Object.entries(formData.area.commune[key].attachments).map(([attachmentKey, uploadedFile]) => (
        //                                             <div key={attachmentKey} className="flex items-center space-x-4 mb-4">
        //                                                 <div className="flex-1 flex flex-col">
        //                                                     <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
        //                                                         <span>{uploadedFile.file ? formatFileSize(uploadedFile.file.size) : '-'}</span>
        //                                                     </div>
        //                                                 </div>
        //                                                 <button
        //                                                     className="px-2 py-2 rounded"
        //                                                 // onClick={() => handleDelete(attachmentKey, 'commune', key)}
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
        //                                     <div className="col-span-4 flex items-center mt-2">
        //                                         <div className="flex flex-col w-full">
        //                                             <span className="text-xs text-gray-900 font-semibold">Remark:</span>
        //                                             <span className="text-xs border border-gray-300 rounded-md p-2">{formData.area.commune[key].other.remark ? formData.area.commune[key].other.remark : '-'}</span>
        //                                         </div>
        //                                     </div>
        //                                 </>
        //                             ) :
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
        //                                                             name={`area.commune.${key}.${sectionKey}.value`}
        //                                                             value="acceptable"
        //                                                             checked={formData.area.commune[key][sectionKey].value === 'acceptable'}
        //                                                             className="radio radio-lg h-4 w-4 text-blue-600"
        //                                                             readOnly
        //                                                         />
        //                                                     </div>

        //                                                     {/* Not Acceptable Radio */}
        //                                                     <div className="flex justify-center items-center">
        //                                                         <input
        //                                                             type="radio"
        //                                                             name={`area.commune.${key}.${sectionKey}.value`}
        //                                                             value="not_acceptable"
        //                                                             checked={formData.area.commune[key][sectionKey].value === 'not_acceptable'}
        //                                                             className="radio radio-lg h-4 w-4 text-blue-600"
        //                                                             readOnly
        //                                                         />
        //                                                     </div>

        //                                                     {/* Remark Input - move to next line on md screens */}
        //                                                     <div className="col-span-4 flex items-center mt-2">
        //                                                         <div className="flex flex-col w-full">
        //                                                             <span className="text-xs text-gray-900 font-semibold">Remark:</span>
        //                                                             <span className="text-xs border border-gray-300 rounded-md p-2">{formData.area.commune[key][sectionKey].remark ? formData.area.commune[key][sectionKey].remark : '-'}</span>
        //                                                         </div>
        //                                                     </div>
        //                                                 </React.Fragment>
        //                                             )
        //                                         ))}
        //                                     </div>
        //                                 </div>
        //                             }
        //                         </div>
        //                     </div>
        //                 ))
        //                 :
        //                 <div className="text-lg font-semibold text-center">The Commune Living is not included.</div>
        //             }
        //         </div>
        //         <div className="hidden" id="tab_7">
        //             {Object.entries(formData.area.bedrooms).map(([key, bedroom]) => (
        //                 <div key={key}>
        //                     <h2 className="text-xl font-semibold capitalize mb-2">{key}</h2>
        //                     {Object.entries(bedroom).map(([bedroomKey, section]) => (
        //                         <div className="card rounded-md mb-8" key={bedroomKey}>
        //                             <div className="card-header px-4 rounded-t-md bg-gray-300 text-gray-900 font-bold">
        //                                 <h2 className="">{section.label}</h2>
        //                             </div>
        //                             <div className="card-body text-sm px-4">
        //                                 <div className="card w-auto mb-6">
        //                                     <div className="card-body">
        //                                         {/* <div className="badge">Add Attachments</div> */}
        //                                         <div className="flex flex-col mb-4">
        //                                             {formData.area.bedrooms[key][bedroomKey].attachments && Object.entries(formData.area.bedrooms[key][bedroomKey].attachments).map(([attachmentKey, uploadedFile]) => (
        //                                                 <div key={attachmentKey} className="flex items-center space-x-4 mb-4">
        //                                                     <div className="flex-1 flex flex-col">
        //                                                         <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
        //                                                             <span>{uploadedFile.file ? formatFileSize(uploadedFile.file.size) : '-'}</span>
        //                                                         </div>
        //                                                     </div>
        //                                                     <button
        //                                                         className="px-2 py-2 rounded"
        //                                                     // onClick={() => handleDelete(attachmentKey, 'bedrooms', key)}
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
        //                                         <div className="col-span-4 flex items-center mt-2">
        //                                             <div className="flex flex-col w-full">
        //                                                 <span className="text-xs text-gray-900 font-semibold">Remark:</span>
        //                                                 <span className="text-xs border border-gray-300 rounded-md p-2">{formData.area.bedrooms[key][bedroomKey].other.remark ? formData.area.bedrooms[key][bedroomKey].other.remark : '-'}</span>
        //                                             </div>
        //                                         </div>
        //                                     </>
        //                                 ) :
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
        //                                                                 name={`area.bedrooms.${key}.${bedroomKey}.${sectionKey}.value`}
        //                                                                 value="acceptable"
        //                                                                 checked={formData.area.bedrooms[key][bedroomKey][sectionKey].value === 'acceptable'}
        //                                                                 className="radio radio-lg h-4 w-4 text-blue-600"
        //                                                                 readOnly
        //                                                             />
        //                                                         </div>

        //                                                         {/* Not Acceptable Radio */}
        //                                                         <div className="flex justify-center items-center">
        //                                                             <input
        //                                                                 type="radio"
        //                                                                 name={`area.bedrooms.${key}.${sectionKey}.value`}
        //                                                                 value="not_acceptable"
        //                                                                 checked={formData.area.bedrooms[key][bedroomKey][sectionKey].value === 'not_acceptable'}
        //                                                                 className="radio radio-lg h-4 w-4 text-blue-600"
        //                                                                 readOnly
        //                                                             />
        //                                                         </div>

        //                                                         {/* Remark Input - move to next line on md screens */}
        //                                                         <div className="col-span-4 flex items-center mt-2">
        //                                                             <div className="flex flex-col w-full">
        //                                                                 <span className="text-xs text-gray-900 font-semibold">Remark:</span>
        //                                                                 <span className="text-xs border border-gray-300 rounded-md p-2">{formData.area.bedrooms[key][bedroomKey][sectionKey].remark ? formData.area.bedrooms[key][bedroomKey][sectionKey].remark : '-'}</span>
        //                                                             </div>
        //                                                         </div>
        //                                                     </React.Fragment>
        //                                                 )
        //                                             ))}
        //                                         </div>
        //                                     </div>
        //                                 }
        //                             </div>
        //                         </div>
        //                     ))}
        //                 </div>
        //             ))}
        //         </div>
        //         <div className="hidden" id="tab_8">
        //             {Object.entries(formData.area.bathrooms).map(([key, bathroom]) => (
        //                 <div key={key}>
        //                     <h2 className="text-xl font-semibold capitalize mb-2">{key}</h2>
        //                     {Object.entries(bathroom).map(([bathroomKey, section]) => (
        //                         <div className="card rounded-md mb-8" key={bathroomKey}>
        //                             <div className="card-header px-4 rounded-t-md bg-gray-300 text-gray-900 font-bold">
        //                                 <h2 className="">{section.label}</h2>
        //                             </div>
        //                             <div className="card-body text-sm px-4">
        //                                 <div className="card w-auto mb-6">
        //                                     <div className="card-body">
        //                                         {/* <div className="badge">Add Attachments</div> */}
        //                                         <div className="flex flex-col mb-4">
        //                                             {formData.area.bathrooms[key][bathroomKey].attachments && Object.entries(formData.area.bathrooms[key][bathroomKey].attachments).map(([attachmentKey, uploadedFile]) => (
        //                                                 <div key={attachmentKey} className="flex items-center space-x-4 mb-4">
        //                                                     <div className="flex-1 flex flex-col">
        //                                                         <div className="badge badge-sm flex w-fit text-slate-500 text-sm">
        //                                                             <span>{uploadedFile.file ? formatFileSize(uploadedFile.file.size) : '-'}</span>
        //                                                         </div>
        //                                                     </div>
        //                                                     <button
        //                                                         className="px-2 py-2 rounded"
        //                                                     // onClick={() => handleDelete(attachmentKey, 'bathrooms', key)}
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
        //                                         <div className="col-span-4 flex items-center mt-2">
        //                                             <div className="flex flex-col w-full">
        //                                                 <span className="text-xs text-gray-900 font-semibold">Remark:</span>
        //                                                 <span className="text-xs border border-gray-300 rounded-md p-2">{formData.area.bathrooms[key][bathroomKey].other.remark ? formData.area.bathrooms[key][bathroomKey].other.remark : '-'}</span>
        //                                             </div>
        //                                         </div>
        //                                     </>
        //                                 ) :
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
        //                                                                 name={`area.bathrooms.${key}.${bathroomKey}.${sectionKey}.value`}
        //                                                                 value="acceptable"
        //                                                                 checked={formData.area.bathrooms[key][bathroomKey][sectionKey].value === 'acceptable'}
        //                                                                 className="radio radio-lg h-4 w-4 text-blue-600"
        //                                                                 readOnly
        //                                                             />
        //                                                         </div>

        //                                                         {/* Not Acceptable Radio */}
        //                                                         <div className="flex justify-center items-center">
        //                                                             <input
        //                                                                 type="radio"
        //                                                                 name={`area.bathrooms.${key}.${sectionKey}.value`}
        //                                                                 value="not_acceptable"
        //                                                                 checked={formData.area.bathrooms[key][bathroomKey][sectionKey].value === 'not_acceptable'}
        //                                                                 className="radio radio-lg h-4 w-4 text-blue-600"
        //                                                                 readOnly
        //                                                             />
        //                                                         </div>

        //                                                         {/* Remark Input - move to next line on md screens */}
        //                                                         <div className="col-span-4 flex items-center mt-2">
        //                                                             <div className="flex flex-col w-full">
        //                                                                 <span className="text-xs text-gray-900 font-semibold">Remark:</span>
        //                                                                 <span className="text-xs border border-gray-300 rounded-md p-2">{formData.area.bathrooms[key][bathroomKey][sectionKey].remark ? formData.area.bathrooms[key][bathroomKey][sectionKey].remark : '-'}</span>
        //                                                             </div>
        //                                                         </div>
        //                                                     </React.Fragment>
        //                                                 )
        //                                             ))}
        //                                         </div>
        //                                     </div>
        //                                 }
        //                             </div>
        //                         </div>
        //                     ))}
        //                 </div>
        //             ))}
        //         </div>
        //     </div>
        //     <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2">
        //     </div>
        // </div>

        <></>
    )
}

export default QCFormDetail;