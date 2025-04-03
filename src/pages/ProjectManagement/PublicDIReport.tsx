import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchDIFormWithHashedString } from '../../services/api';
import { Slide, toast } from 'react-toastify';
import Loading from '../../components/Loading';

const AWS_S3_URL =
    import.meta.env.VITE_APP_ENV === "production"
        ? import.meta.env.VITE_AWS_S3_URL
        : import.meta.env.VITE_APP_ENV === "staging" || import.meta.env.VITE_APP_ENV === "local"
            ? import.meta.env.VITE_STAGING_AWS_S3_URL
            : null

function PublicDIReport() {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const hashedString = queryParams.get("id");
    const [isLoading, setIsLoading] = useState(false);
    const [diForm, setDiForm] = useState(null);
    const [activeTab, setActiveTab] = useState('tab_1');
    const [activeSubTab, setActiveSubTab] = useState({});

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
        const handleFetchDIForm = async () => {
            setIsLoading(true);
            try {
                const response = await fetchDIFormWithHashedString(hashedString);
                if (response?.success) {
                    setDiForm(response?.data);
                    // Initialize sub-tabs for dynamic areas
                    const initialSubTabs = {};
                    ['bedrooms', 'bathrooms'].forEach(area => {
                        if (response?.data?.area[area]) {
                            const keys = Object.keys(response.data.area[area]);
                            if (keys.length > 0) initialSubTabs[area] = keys[0];
                        }
                    });
                    setActiveSubTab(initialSubTabs);
                } else {
                    notify('error', 'Failed to fetch DI Form');
                }
            } catch (error) {
                console.log(error);
                notify('error', 'Failed to fetch DI Form');
            } finally {
                setIsLoading(false);
            }
        };

        if (hashedString) {
            handleFetchDIForm();
        }
    }, [hashedString]);

    const tabs = [
        {
            id: 'tab_1', label: 'Foyer & Entrance', area: 'foyer', questions: [
                { label: '1.1 Entrance door (Frame, leaf, handle, lock, accessories)', path: 'q1' },
                { label: '1.2 Floor & skirting', path: 'q2' },
                { label: '1.3 Wall & ceiling', path: 'q3' },
                { label: '1.4 DB box', path: 'q4' },
            ]
        },
        {
            id: 'tab_2', label: 'Kitchen', area: 'kitchen', questions: [
                { label: '2.1 Floor & skirting', path: 'q1' },
                { label: '2.2 Wall & ceiling', path: 'q2' },
                { label: '2.3 Electrical & wiring (plug point, switches, etc)', path: 'q3' },
                { label: '2.4 Piping & water flow (Kitchen sink, etc)', path: 'q4' },
                { label: '2.5 Kitchen cabinet (Kitchen top, drawer, cabinet door, accessories, etc)', path: 'q5' },
                { label: '2.6 Electrical appliances (Fridge, microwave, oven, hood & hob, etc)', path: 'q6' },
                { label: '2.7 Door (Frame, leaf, handle, accessories, etc)', path: 'q7' },
                { label: '2.8 Window (Frame, panel, handle, accessories, etc)', path: 'q8' },
            ]
        },
        {
            id: 'tab_3', label: 'Yard', area: 'yard', questions: [
                { label: '3.1 Floor & skirting (Floor trap)', path: 'q1' },
                { label: '3.2 Wall & ceiling', path: 'q2' },
                { label: '3.3 Electrical & wiring (plug point, switches, etc)', path: 'q3' },
                { label: '3.4 Piping & water flow (Kitchen sink, etc)', path: 'q4' },
                { label: '3.5 Electrical appliances (Washing machine, dryer, etc)', path: 'q5' },
                { label: '3.6 AC ledge (Railing, compressor, etc)', path: 'q6' },
            ]
        },
        {
            id: 'tab_4', label: 'Living & Dining', area: 'living', questions: [
                { label: '4.1 Floor & skirting', path: 'q1' },
                { label: '4.2 Wall', path: 'q2' },
                { label: '4.3 Ceiling', path: 'q3' },
                { label: '4.4 Electrical & wiring (plug point, switches, etc)', path: 'q4' },
                { label: '4.5 Window (Frame, panel, handle, accessories, etc)', path: 'q5' },
                { label: '4.6 Sliding door (Frame, panel, handle, accessories, etc)', path: 'q6' },
                { label: '4.7 Air conditioner', path: 'q7' },
                { label: '4.8 Air conditioner turned on for 2 hours or more', path: 'q8' },
                { label: '4.9 Other', path: 'q9' },
            ]
        },
        {
            id: 'tab_5', label: 'Balcony', area: 'balcony', questions: [
                { label: '5.1 Floor & skirting (Floor trap, evenness, etc)', path: 'q1' },
                { label: '5.2 Wall & ceiling', path: 'q2' },
                { label: '5.3 Railing', path: 'q3' },
                { label: '5.4 AC ledge', path: 'q4' },
            ]
        },
        {
            id: 'tab_6', label: 'Hallway', area: 'hallway', questions: [
                { label: '6.1 Floor & skirting', path: 'q1' },
                { label: '6.2 Wall', path: 'q2' },
                { label: '6.3 Ceiling', path: 'q3' },
                { label: '6.4 Electrical & wiring (plug point, switches, etc)', path: 'q4' },
            ]
        },
        {
            id: 'tab_7', label: 'Bedrooms', area: 'bedrooms', isDynamic: true, questions: [
                { label: '1. Floor & skirting', path: 'q1' },
                { label: '2. Wall', path: 'q2' },
                { label: '3. Ceiling', path: 'q3' },
                { label: '4. Electrical & wiring (plug point, switches, etc)', path: 'q4' },
                { label: '5. Door (Frame, panel, handle, accessories, etc)', path: 'q5' },
                { label: '6. Window (Frame, panel, handle, accessories, etc)', path: 'q6' },
                { label: '7. Air conditioner', path: 'q7' },
                { label: '8. Air conditioner turned on for 2 hours or more', path: 'q8' },
                { label: '9. Other', path: 'q9' },
            ]
        },
        {
            id: 'tab_8', label: 'Bathrooms', area: 'bathrooms', isDynamic: true, questions: [
                { label: '1. Floor (Floor trap, etc)', path: 'q1' },
                { label: '2. Wall & ceiling', path: 'q2' },
                { label: '3. Door (Frame, panel, handle, accessories, etc)', path: 'q3' },
                { label: '4. Window (Frame, panel, handle, accessories, etc)', path: 'q4' },
                { label: '5. Electrical & wiring (plug point, switches, etc)', path: 'q5' },
                { label: '6. Sanitary ware (Basin, bidet, tap, WC, shower, etc)', path: 'q6' },
                { label: '7. Piping & water flow (Basin, bidet, tap, WC, shower, etc)', path: 'q7' },
                { label: '8. Shower screen (Panel, frame, accessories, etc)', path: 'q8' },
                { label: '9. Other', path: 'q9' },
            ]
        },
    ];

    const InspectionItem = ({ label, data }) => {
        return (
            <div className="py-3 border-b border-gray-200 last:border-b-0">
                <div className="flex flex-col md:grid md:grid-cols-12 gap-2 text-xs text-gray-700">
                    <div className="md:col-span-5 font-medium">{label}</div>
                    <div className="flex md:hidden justify-between w-24">
                        {data?.value === 'has-defect' ? (
                            <span className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">✗</span>
                        ) : (
                            <span className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 text-xs">✗</span>
                        )}
                        {(data?.value === 'no-defect' || data?.value === 'yes') ? (
                            <span className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">✓</span>
                        ) : (
                            <span className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 text-xs">✓</span>
                        )}
                        {data?.value === 'not-available' ? (
                            <span className="w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs">—</span>
                        ) : (
                            <span className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 text-xs">—</span>
                        )}
                    </div>
                    <div className="hidden md:flex md:col-span-1 justify-center items-center">
                        {data?.value === 'has-defect' && (
                            <span className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">✗</span>
                        )}
                    </div>
                    <div className="hidden md:flex md:col-span-1 justify-center items-center">
                        {(data?.value === 'no-defect' || data?.value === 'yes') && (
                            <span className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">✓</span>
                        )}
                    </div>
                    <div className="hidden md:flex md:col-span-1 justify-center items-center">
                        {data?.value === 'not-available' && (
                            <span className="w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs">—</span>
                        )}
                    </div>
                    <div className="md:col-span-4 mt-2 md:mt-0">
                        {data?.attachments?.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {data.attachments.map((attachment, index) => (
                                    <a key={index} href={AWS_S3_URL + attachment.file_url} target="_blank" rel="noopener noreferrer" className="block">
                                        <img
                                            src={AWS_S3_URL + attachment.file_url}
                                            alt={attachment.original_name}
                                            className="w-10 h-10 object-cover rounded border border-gray-200 hover:border-blue-500 transition"
                                        />
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <span className="text-gray-500">—</span>
                        )}
                    </div>
                    <div className="mt-2 md:col-span-8 md:mt-0">
                        <p className="text-xs text-gray-600">
                            <span className="font-medium">Remark:</span> {data?.remark || '-'}
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    const AreaCard = ({ title, areaData, questions }) => (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">{title}</h2>
            <div className="hidden md:grid md:grid-cols-12 gap-2 text-xs text-gray-700 font-medium mb-3">
                <div className="col-span-5">Item</div>
                <div className="col-span-1 text-center">Has Defect</div>
                <div className="col-span-1 text-center">No Defect</div>
                <div className="col-span-1 text-center">N/A</div>
                <div className="col-span-4">Attachments</div>
            </div>
            {questions.map(({ label, path }) => (
                <InspectionItem key={path} label={label} data={areaData?.[path]} />
            ))}
        </div>
    );

    if (isLoading) return <Loading />;
    if (!diForm) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <p className="text-gray-500 text-base">No data available</p>
        </div>
    );

    return (
        <main className="grow pt-5 items-center" id="content" role="content">
            <div className="flex flex-col items-center">
                <div className="container relative flex flex-col items-center justify-center py-6 px-4 sm:px-6 lg:px-8" id="content_container">
                    <div className="w-full mx-auto">
                        <div className="mb-6 flex justify-center">
                            <img
                                className="default-logo min-h-[22px] h-[48px] max-w-none"
                                src="/app/RenoExpert_logo-01.svg"
                                alt="RenoExpert Logo"
                            />
                        </div>
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 sm:p-6 rounded-xl shadow-lg mb-8 text-white">
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
                                <div className="text-center sm:text-left">
                                    <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 flex items-center justify-center sm:justify-start gap-1 sm:gap-2">
                                        <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Defect Inspection Report
                                    </h1>
                                    <p className="text-base sm:text-lg font-medium opacity-90">{diForm.property.property_name}</p>
                                    <p className="text-sm sm:text-base opacity-90">{diForm.property.block}-{diForm.property.level}-{diForm.property.unit}</p>
                                    <p className="text-xs sm:text-sm opacity-80">
                                        Block {diForm.property.block}, Level {diForm.property.level}, Unit {diForm.property.unit}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm w-full sm:w-auto">
                                    <div className="bg-white/10 p-2 sm:p-3 rounded-lg">
                                        <p className="font-medium text-xs sm:text-sm">Renovation</p>
                                        <p className="capitalize text-xs sm:text-sm">{diForm.reno_progress.status.replace('_', ' ')}</p>
                                    </div>
                                    <div className="bg-white/10 p-2 sm:p-3 rounded-lg">
                                        <p className="font-medium text-xs sm:text-sm">Rooms</p>
                                        <p className="text-xs sm:text-sm">{diForm.bedroom_count} Bed, {diForm.bathroom_count} Bath</p>
                                    </div>
                                    <div className="bg-white/10 p-2 sm:p-3 rounded-lg col-span-2">
                                        <p className="font-medium text-xs sm:text-sm">Contractor</p>
                                        <p className="text-xs sm:text-sm truncate">{diForm.contractor_name}</p>
                                        <p className="text-[10px] sm:text-xs opacity-80 truncate">{diForm.contractor_email}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Status Badge */}
                            <div className="mt-3 sm:mt-4 flex justify-center sm:justify-end">
                                <span className={`inline-flex items-center px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium ${diForm.status === 'completed' || diForm.status === 'submitted' ? 'bg-green-100 text-green-800' :
                                    diForm.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                    <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mr-1 sm:mr-2 ${diForm.status === 'completed' || diForm.status === 'submitted' ? 'bg-green-500' :
                                        diForm.status === 'in_progress' ? 'bg-yellow-500' :
                                            'bg-gray-500'
                                        }`}></span>
                                    {diForm.status.replace('_', ' ').toUpperCase()}
                                </span>
                            </div>
                        </div>

                        <div className="mb-6">
                            <div className="flex flex-wrap gap-2 border-b border-gray-200">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        className={`px-3 py-1 text-xs font-medium rounded-t-lg transition-colors ${activeTab === tab.id ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                        onClick={() => setActiveTab(tab.id)}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="transition-opacity duration-300">
                            {tabs.map((tab) => (
                                <div key={tab.id} className={activeTab === tab.id ? 'block' : 'hidden'}>
                                    {tab.isDynamic ? (
                                        <>
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {Object.keys(diForm.area[tab.area] || {}).map((key) => (
                                                    <button
                                                        key={key}
                                                        className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${activeSubTab[tab.area] === key ? 'bg-blue-100 text-blue-600 border border-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                                        onClick={() => setActiveSubTab(prev => ({ ...prev, [tab.area]: key }))}
                                                    >
                                                        {key.replace(tab.area.slice(0, -1), tab.label.slice(0, -1) + ' ')}
                                                    </button>
                                                ))}
                                            </div>
                                            {activeSubTab[tab.area] && (
                                                <AreaCard
                                                    title={activeSubTab[tab.area].replace(tab.area.slice(0, -1), tab.label.slice(0, -1) + ' ')}
                                                    areaData={diForm.area[tab.area][activeSubTab[tab.area]]}
                                                    questions={tab.questions}
                                                />
                                            )}
                                        </>
                                    ) : (
                                        <AreaCard title={tab.label} areaData={diForm.area[tab.area]} questions={tab.questions} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default PublicDIReport;