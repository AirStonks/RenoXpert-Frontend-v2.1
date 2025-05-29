import { useParams } from "react-router-dom";
import useFetchOwnerRegistrationForm from "../../hook/useFetchOwnerRegistrationForm";
import Loading from "../../components/Loading";
import { Link } from "react-router-dom";
import React, { useEffect } from "react";

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/owner/' : '/';

const AWS_S3_URL =
    import.meta.env.VITE_APP_ENV === "production"
        ? import.meta.env.VITE_AWS_S3_URL
        : import.meta.env.VITE_APP_ENV === "staging" || import.meta.env.VITE_APP_ENV === "local"
            ? import.meta.env.VITE_STAGING_AWS_S3_URL
            : null

function RenoRegistrationFormDetail() {
    // const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const formId = id ? parseInt(id, 10) : null;

    const { form, loading, error } = useFetchOwnerRegistrationForm(formId);

    useEffect(() => {
        document.title = "Reno Registration Form Detail | RenoXpert";
    })

    if (loading) return <Loading />;
    if (error) return <div>{error}</div>;
    if (!form) return <div>An unexpected error occured</div>;

    return (
        <div className="card w-full">
            <div className="card-header flex justify-between">
                <div className="flex gap-4 justify-center">
                    <Link
                        to={LOCAL_PATH_PREFIX + 'home'}
                        className="ki-solid ki-arrow-left items-center">
                    </Link>
                    <span className="text-lg font-semibold">[Reno] Registration Form</span>
                </div>
                {/* <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0">
                    <i className="ki-filled ki-printer"></i>
                </button> */}
            </div>
            <div className="card-body">
                <div className="flex flex-col mb-8">
                    <span className="font-medium">Status</span>
                    <span className={`badge badge-outline gap-1 items-center ${form.status ===
                        'approved' ? 'badge-success' : ''}`}>
                        {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                    </span>
                </div>

                <div className="flex flex-col mb-8">
                    <span className="text-slate-400 font-medium">Form No.</span>
                    <span className="font-semibold">{form.form_no}</span>
                </div>

                <div className="flex flex-col mb-8">
                    <span className="text-slate-400 font-medium">Salutations</span>
                    <span className="font-semibold">{form.user.salutations}</span>
                </div>

                <div className="flex flex-col mb-8">
                    <label className="text-slate-900 mb-2 font-medium" htmlFor="name_f">Name</label>
                    <div className="flex gap-2">
                        <div className="flex flex-col w-full">
                            <span className="text-slate-400 font-medium">First Name</span>
                            <span className="font-semibold">{form.user.name_first}</span>
                        </div>
                        <div className="flex flex-col w-full">
                            <span className="text-slate-400 font-medium">Last Name</span>
                            <span className="font-semibold">{form.user.name_last}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col mb-8">
                    <span className="text-slate-400 font-medium">Preferred Name</span>
                    <span className="font-semibold">{form.user.name_preferred === 'null' ? '-' : form.user.name_preferred}</span>
                </div>

                <div className="flex flex-col mb-8">
                    <div className="flex gap-2 flex-wrap">
                        <div className="flex flex-col flex-auto mb-6 md:mb-0">
                            <span className="text-slate-400 font-medium">Email</span>
                            <span className="font-semibold">{form.user.email}</span>
                        </div>
                        <div className="flex flex-col flex-auto">
                            <span className="text-slate-400 font-medium">Phone Number</span>
                            <span className="font-semibold">+{form.user.country_code} {form.user.phone_no}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col mb-8">
                    <label className="text-slate-900 mb-2 font-medium" htmlFor="address_1">Current residence address (information needed for renovation agreement purpose)</label>

                    <div className="flex flex-col mb-8">
                        <span className="text-slate-400 font-medium">Address Line 1</span>
                        <span className="font-semibold">{form.address.address_1}</span>
                    </div>

                    <div className="flex flex-col mb-8">
                        <span className="text-slate-400 font-medium">Address Line 2</span>
                        <span className="font-semibold">{form.address.address_2}</span>
                    </div>

                    <div className="flex flex-col mb-8">
                        <div className="flex gap-2 ">
                            <div className="flex flex-col w-full">
                                <span className="text-slate-400 font-medium">City</span>
                                <span className="font-semibold">{form.address.city}</span>
                            </div>
                            <div className="flex flex-col w-full">
                                <span className="text-slate-400 font-medium">State</span>
                                <span className="font-semibold">{form.address.state}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <span className="text-slate-400 font-medium">Postal / Zip Code</span>
                        <span className="font-semibold">{form.address.postcode}</span>
                    </div>
                </div>

                <div className="flex flex-col mb-8">
                    <span className="text-slate-400 font-medium">IC / ID number</span>
                    <span className="font-semibold">{form.user.ic}</span>
                </div>

                <div className="flex flex-col mb-8">
                    <span className="text-slate-400 font-medium">Property to be renovated</span>
                    <span className="font-semibold">
                        {form.property ? form.property.property_name : "(Other) " + form.other_property.property_name}
                    </span>
                </div>

                <div className="flex flex-col mb-8">
                    <div className="flex flex-col w-full">
                        <span className="text-slate-400 font-medium">Unit</span>
                        <span className="font-semibold">{form.property ?
                            `${form.property.block}-${form.property.level}-${form.property.unit}` :
                            `${form.other_property.block}-${form.other_property.level}-${form.other_property.unit}`
                        }</span>
                    </div>
                </div>

                <div className="flex flex-col mb-8">
                    <span className="text-slate-400 font-medium">Layout Type</span>
                    <span className="font-semibold">
                        {form.property ?
                            `${form.property.layout_type}` :
                            `${form.other_property.layout_type}`
                        }
                    </span>
                </div>

                <div className="flex flex-col mb-8">
                    <span className="text-slate-400 font-medium">Sqft</span>
                    <span className="font-semibold">
                        {form.property ?
                            `${form.property.sqft}` :
                            `${form.other_property.sqft}`
                        }
                    </span>
                </div>

                <div className="flex flex-col mb-8">
                    <span className="text-slate-400 font-medium">What's your original number of rooms?</span>
                    <span className="font-semibold">
                        {typeof form.questions.quest_1 === 'string'
                            ? form.questions.quest_1
                                .replace(/_/g, ' ')
                                .split(' ')
                                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                                .join(' ')
                            : form.questions.quest_1}
                    </span>
                </div>

                <div className="flex flex-col mb-8">
                    <span className="text-slate-400 font-medium">What's the number of bathroom?</span>
                    <span className="font-semibold">
                        {typeof form.questions.quest_2 === 'string'
                            ? form.questions.quest_2
                                .replace(/_/g, ' ')
                                .split(' ')
                                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                                .join(' ')
                            : form.questions.quest_2}
                    </span>
                </div>

                <div className="flex flex-col mb-8">
                    <span className="text-slate-400 font-medium">Already Vacant Possessions (VP)?</span>
                    <span className="font-semibold">
                        {form.questions.quest_3
                            .replace(/_/g, ' ')
                            .split(' ')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ')
                        }
                    </span>
                </div>

                <div className="flex flex-col mb-8">
                    <span className="text-slate-400 font-medium">Already collect key?</span>
                    <span className="font-semibold">
                        {form.questions.quest_4
                            .replace(/_/g, ' ')
                            .split(' ')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ')
                        }
                    </span>
                </div>

                <div className="flex flex-col mb-8">
                    <span className="text-slate-400 font-medium">Already done defect inspection?</span>
                    <span className="font-semibold">
                        {form.questions.quest_5
                            .replace(/_/g, ' ')
                            .split(' ')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ')
                        }
                    </span>
                </div>

                <div className="flex flex-col mb-8">
                    <span className="text-slate-400 font-medium">Already submit defect submission to MO?</span>
                    <span className="font-semibold">
                        {form.questions.quest_6
                            .replace(/_/g, ' ')
                            .split(' ')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ')
                        }
                    </span>
                </div>

                <div className="flex flex-col mb-8">
                    <span className="text-slate-400 font-medium">MO has completed that defect rectification?</span>
                    <span className="font-semibold">
                        {form.questions.quest_7
                            .replace(/_/g, ' ')
                            .split(' ')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ')
                        }
                    </span>
                </div>

                <div className="flex flex-col mb-8">
                    <span className="text-slate-400 font-medium">Do you want to add partition room to your unit?</span>
                    <span className="font-semibold">{form.questions.quest_8}</span>
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
                                        {form.furnishing.foyer_entrance.grille_door === 'furnished' &&
                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                        }
                                    </div>
                                    <div className="flex justify-center items-center">
                                        {form.furnishing.foyer_entrance.grille_door === 'not-furnish' &&
                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                        }
                                    </div>

                                    {/* Digital Lock */}
                                    <div className="flex items-center text-gray-900 font-semibold">Digital lock</div>
                                    <div className="flex justify-center items-center">
                                        {form.furnishing.foyer_entrance.digital_lock === 'furnished' &&
                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                        }
                                    </div>
                                    <div className="flex justify-center items-center">
                                        {form.furnishing.foyer_entrance.digital_lock === 'not-furnish' &&
                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                        }
                                    </div>

                                    {/* Shoe Cabinet */}
                                    <div className="flex items-center text-gray-900 font-semibold">Shoe cabinet</div>
                                    <div className="flex justify-center items-center">
                                        {form.furnishing.foyer_entrance.shoe_cabinet === 'furnished' &&
                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                        }
                                    </div>
                                    <div className="flex justify-center items-center">
                                        {form.furnishing.foyer_entrance.shoe_cabinet === 'not-furnish' &&
                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                        }
                                    </div>

                                    {/* Lights */}
                                    <div className="flex items-center text-gray-900 font-semibold">Lights</div>
                                    <div className="flex justify-center items-center">
                                        {form.furnishing.foyer_entrance.lights === 'furnished' &&
                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                        }
                                    </div>
                                    <div className="flex justify-center items-center">
                                        {form.furnishing.foyer_entrance.lights === 'not-furnish' &&
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
                            {form.furnishing.foyer_entrance.other ? form.furnishing.foyer_entrance.other : '-'}
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
                                        {form.furnishing.kitchen.kitchen_cabinet === 'furnished' &&
                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                        }
                                    </div>
                                    <div className="flex justify-center items-center">
                                        {form.furnishing.kitchen.kitchen_cabinet === 'not-furnish' &&
                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                        }
                                    </div>

                                    {/* Kitchen Island */}
                                    <div className="flex items-center text-gray-900 font-semibold">Kitchen island</div>
                                    <div className="flex justify-center items-center">
                                        {form.furnishing.kitchen.kitchen_island === 'furnished' &&
                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                        }
                                    </div>
                                    <div className="flex justify-center items-center">
                                        {form.furnishing.kitchen.kitchen_island === 'not-furnish' &&
                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                        }
                                    </div>

                                    {/* Sink & Tap */}
                                    <div className="flex items-center text-gray-900 font-semibold">Sink & tap</div>
                                    <div className="flex justify-center items-center">
                                        {form.furnishing.kitchen.sink_tap === 'furnished' &&
                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                        }
                                    </div>
                                    <div className="flex justify-center items-center">
                                        {form.furnishing.kitchen.sink_tap === 'not-furnish' &&
                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                        }
                                    </div>

                                    {/* Hood and Hob */}
                                    <div className="flex items-center text-gray-900 font-semibold">Hood and hob</div>
                                    <div className="flex justify-center items-center">
                                        {form.furnishing.kitchen.hood_hob === 'furnished' &&
                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                        }
                                    </div>
                                    <div className="flex justify-center items-center">
                                        {form.furnishing.kitchen.hood_hob === 'not-furnish' &&
                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                        }
                                    </div>

                                    {/* Microwave */}
                                    <div className="flex items-center text-gray-900 font-semibold">Microwave</div>
                                    <div className="flex justify-center items-center">
                                        {form.furnishing.kitchen.microwave === 'furnished' &&
                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                        }
                                    </div>
                                    <div className="flex justify-center items-center">
                                        {form.furnishing.kitchen.microwave === 'not-furnish' &&
                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                        }
                                    </div>

                                    {/* Oven */}
                                    <div className="flex items-center text-gray-900 font-semibold">Oven</div>
                                    <div className="flex justify-center items-center">
                                        {form.furnishing.kitchen.oven === 'furnished' &&
                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                        }
                                    </div>
                                    <div className="flex justify-center items-center">
                                        {form.furnishing.kitchen.oven === 'not-furnish' &&
                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                        }
                                    </div>

                                    {/* Water Dispenser / Water Purifier */}
                                    <div className="flex items-center text-gray-900 font-semibold">Water dispenser / water purifier</div>
                                    <div className="flex justify-center items-center">
                                        {form.furnishing.kitchen.water_dispenser === 'furnished' &&
                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                        }
                                    </div>
                                    <div className="flex justify-center items-center">
                                        {form.furnishing.kitchen.water_dispenser === 'not-furnish' &&
                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                        }
                                    </div>

                                    {/* Fridge */}
                                    <div className="flex items-center text-gray-900 font-semibold">Fridge</div>
                                    <div className="flex justify-center items-center">
                                        {form.furnishing.kitchen.fridge === 'furnished' &&
                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                        }
                                    </div>
                                    <div className="flex justify-center items-center">
                                        {form.furnishing.kitchen.fridge === 'not-furnish' &&
                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                        }
                                    </div>

                                    {/* Lights */}
                                    <div className="flex items-center text-gray-900 font-semibold">Lights</div>
                                    <div className="flex justify-center items-center">
                                        {form.furnishing.kitchen.lights === 'furnished' &&
                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                        }
                                    </div>
                                    <div className="flex justify-center items-center">
                                        {form.furnishing.kitchen.lights === 'not-furnish' &&
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
                            {form.furnishing.kitchen.other ? form.furnishing.kitchen.other : '-'}
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
                                        {form.furnishing.yard.washer === 'furnished' &&
                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                        }
                                    </div>
                                    <div className="flex justify-center items-center">
                                        {form.furnishing.yard.washer === 'not-furnish' &&
                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                        }
                                    </div>

                                    {/* Dryer */}
                                    <div className="flex items-center text-gray-900 font-semibold">Dryer</div>
                                    <div className="flex justify-center items-center">
                                        {form.furnishing.yard.dryer === 'furnished' &&
                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                        }
                                    </div>
                                    <div className="flex justify-center items-center">
                                        {form.furnishing.yard.dryer === 'not-furnish' &&
                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                        }
                                    </div>

                                    {/* Lights */}
                                    <div className="flex items-center text-gray-900 font-semibold">Lights</div>
                                    <div className="flex justify-center items-center">
                                        {form.furnishing.yard.lights === 'furnished' &&
                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                        }
                                    </div>
                                    <div className="flex justify-center items-center">
                                        {form.furnishing.yard.lights === 'not-furnish' &&
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
                            {form.furnishing.yard.other ? form.furnishing.yard.other : '-'}
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
                                        {form.furnishing.dining.dining_table_chairs === 'furnished' &&
                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                        }
                                    </div>
                                    <div className="flex justify-center items-center">
                                        {form.furnishing.dining.dining_table_chairs === 'not-furnish' &&
                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                        }
                                    </div>

                                    {/* Lights */}
                                    <div className="flex items-center text-gray-900 font-semibold">Lights</div>
                                    <div className="flex justify-center items-center">
                                        {form.furnishing.dining.lights === 'furnished' &&
                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                        }
                                    </div>
                                    <div className="flex justify-center items-center">
                                        {form.furnishing.dining.lights === 'not-furnish' &&
                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                        }
                                    </div>

                                    {/* Fan */}
                                    <div className="flex items-center text-gray-900 font-semibold">Fan</div>
                                    <div className="flex justify-center items-center">
                                        {form.furnishing.dining.fan === 'furnished' &&
                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                        }
                                    </div>
                                    <div className="flex justify-center items-center">
                                        {form.furnishing.dining.fan === 'not-furnish' &&
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
                            {form.furnishing.dining.other ? form.furnishing.dining.other : '-'}
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
                                        {form.furnishing.living.sofa === 'furnished' &&
                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                        }
                                    </div>
                                    <div className="flex justify-center items-center">
                                        {form.furnishing.living.sofa === 'not-furnish' &&
                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                        }
                                    </div>

                                    {/* Coffee Table */}
                                    <div className="flex items-center text-gray-900 font-semibold">Coffee table</div>
                                    <div className="flex justify-center items-center">
                                        {form.furnishing.living.coffee_table === 'furnished' &&
                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                        }
                                    </div>
                                    <div className="flex justify-center items-center">
                                        {form.furnishing.living.coffee_table === 'not-furnish' &&
                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                        }
                                    </div>

                                    {/* TV */}
                                    <div className="flex items-center text-gray-900 font-semibold">TV</div>
                                    <div className="flex justify-center items-center">
                                        {form.furnishing.living.tv === 'furnished' &&
                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                        }
                                    </div>
                                    <div className="flex justify-center items-center">
                                        {form.furnishing.living.tv === 'not-furnish' &&
                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                        }
                                    </div>

                                    {/* TV Cabinet */}
                                    <div className="flex items-center text-gray-900 font-semibold">TV cabinet</div>
                                    <div className="flex justify-center items-center">
                                        {form.furnishing.living.tv_cabinet === 'furnished' &&
                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                        }
                                    </div>
                                    <div className="flex justify-center items-center">
                                        {form.furnishing.living.tv_cabinet === 'not-furnish' &&
                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                        }
                                    </div>

                                    {/* Fan */}
                                    <div className="flex items-center text-gray-900 font-semibold">Fan</div>
                                    <div className="flex justify-center items-center">
                                        {form.furnishing.living.fan === 'furnished' &&
                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                        }
                                    </div>
                                    <div className="flex justify-center items-center">
                                        {form.furnishing.living.fan === 'not-furnish' &&
                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                        }
                                    </div>

                                    {/* Lights */}
                                    <div className="flex items-center text-gray-900 font-semibold">Lights</div>
                                    <div className="flex justify-center items-center">
                                        {form.furnishing.living.lights === 'furnished' &&
                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                        }
                                    </div>
                                    <div className="flex justify-center items-center">
                                        {form.furnishing.living.lights === 'not-furnish' &&
                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                        }
                                    </div>

                                    {/* AC */}
                                    <div className="flex items-center text-gray-900 font-semibold">AC</div>
                                    <div className="flex justify-center items-center">
                                        {form.furnishing.living.ac === 'furnished' &&
                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                        }
                                    </div>
                                    <div className="flex justify-center items-center">
                                        {form.furnishing.living.ac === 'not-furnish' &&
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
                            {form.furnishing.living.other ? form.furnishing.living.other : '-'}
                        </span>
                    </div>

                    {Object.keys(form.furnishing.bedrooms || {}).map((bedroomKey) => {

                        const bedroom = form.furnishing.bedrooms[bedroomKey];

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


                    {Object.keys(form.furnishing.bathrooms || {}).map((bathroomKey) => {

                        const bathroom = form.furnishing.bathrooms[bathroomKey];

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

                <div className="flex flex-col mb-8">
                    <span className="text-slate-400 font-medium">Attachments</span>

                    {form.attachments && Object.keys(form.attachments).length > 0 ? (
                        <ul>
                            {Object.keys(form.attachments).map((key) => {
                                const attachment = form.attachments[key];
                                return (
                                    <li key={key}>
                                        {attachment.file_url ? (
                                            <a href={AWS_S3_URL + (attachment.file_url)} target="_blank" rel="noopener noreferrer" className="badge badge-lg mb-2">
                                                {attachment.original_name}
                                            </a>
                                        ) : (
                                            'No file available'
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <p>No attachments found.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default RenoRegistrationFormDetail;