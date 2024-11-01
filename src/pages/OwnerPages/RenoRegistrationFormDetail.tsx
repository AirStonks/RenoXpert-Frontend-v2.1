import { useParams } from "react-router-dom";
import useFetchOwnerRegistrationForm from "../../hook/useFetchOwnerRegistrationForm";
import Loading from "../../components/Loading";
import { Link } from "react-router-dom";



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

function RenoRegistrationFormDetail() {
    // const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const formId = id ? parseInt(id, 10) : null;

    const { form, loading, error } = useFetchOwnerRegistrationForm(formId);

    if (loading) return <Loading />;
    if (error) return <div>{error}</div>;
    if (!form) return <div>An unexpected error occured</div>;

    console.log(form);


    return (
        <div className="card w-full">
            <div className="card-header flex justify-between">
                <div className="flex gap-4 justify-center">
                    <Link
                        to={'/owner/home'}
                        className="ki-solid ki-arrow-left items-center">
                    </Link>
                    <span className="text-lg font-semibold">[Reno] Registration Form</span>
                </div>
                <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0">
                    <i className="ki-filled ki-printer"></i>
                </button>
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
                    <span className="font-semibold">{form.user.name_preferred}</span>
                </div>

                <div className="flex flex-col mb-8">
                    <div className="flex gap-2 flex-wrap">
                        <div className="flex flex-col flex-auto mb-6 md:mb-0">
                            <span className="text-slate-400 font-medium">Email</span>
                            <span className="font-semibold">{form.user.email}</span>
                        </div>
                        <div className="flex flex-col flex-auto">
                            <span className="text-slate-400 font-medium">Phone Number</span>
                            <span className="font-semibold">+60 {form.user.phone_no}</span>
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
                    <span className="font-semibold">{form.questions.quest_1}</span>
                </div>

                <div className="flex flex-col mb-8">
                    <span className="text-slate-400 font-medium">What's the number of bathroom?</span>
                    <span className="font-semibold">{form.questions.quest_2}</span>
                </div>

                <div className="flex flex-col mb-8">
                    <span className="text-slate-400 font-medium">Already Vacant Possessions (VP)?</span>
                    <span className="font-semibold">{form.questions.quest_3}</span>
                </div>

                <div className="flex flex-col mb-8">
                    <span className="text-slate-400 font-medium">Already collect key?</span>
                    <span className="font-semibold">{form.questions.quest_4}</span>
                </div>

                <div className="flex flex-col mb-8">
                    <span className="text-slate-400 font-medium">Already done defect inspection?</span>
                    <span className="font-semibold">{form.questions.quest_5}</span>
                </div>

                <div className="flex flex-col mb-8">
                    <span className="text-slate-400 font-medium">Already submit defect submission to MO?</span>
                    <span className="font-semibold">{form.questions.quest_6}</span>
                </div>

                <div className="flex flex-col mb-8">
                    <span className="text-slate-400 font-medium">MO has completed that defect rectification?</span>
                    <span className="font-semibold">{form.questions.quest_7}</span>
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
                                        <input
                                            type="radio"
                                            name="furnishing.foyer_entrance.grille_door"
                                            value="furnished"
                                            checked={form.furnishing.foyer_entrance.grille_door === 'furnished'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>
                                    <div className="flex justify-center items-center">
                                        <input
                                            type="radio"
                                            name="furnishing.foyer_entrance.grille_door"
                                            value="not-furnish"
                                            checked={form.furnishing.foyer_entrance.grille_door === 'not-furnish'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>

                                    {/* Digital Lock */}
                                    <div className="flex items-center text-gray-900 font-semibold">Digital lock</div>
                                    <div className="flex justify-center items-center">
                                        <input
                                            type="radio"
                                            name="furnishing.foyer_entrance.digital_lock"
                                            value="furnished"
                                            checked={form.furnishing.foyer_entrance.digital_lock === 'furnished'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>
                                    <div className="flex justify-center items-center">
                                        <input
                                            type="radio"
                                            name="furnishing.foyer_entrance.digital_lock"
                                            value="not-furnish"
                                            checked={form.furnishing.foyer_entrance.digital_lock === 'not-furnish'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>

                                    {/* Shoe Cabinet */}
                                    <div className="flex items-center text-gray-900 font-semibold">Shoe cabinet</div>
                                    <div className="flex justify-center items-center">
                                        <input
                                            type="radio"
                                            name="furnishing.foyer_entrance.shoe_cabinet"
                                            value="furnished"
                                            checked={form.furnishing.foyer_entrance.shoe_cabinet === 'furnished'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>
                                    <div className="flex justify-center items-center">
                                        <input
                                            type="radio"
                                            name="furnishing.foyer_entrance.shoe_cabinet"
                                            value="not-furnish"
                                            checked={form.furnishing.foyer_entrance.shoe_cabinet === 'not-furnish'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>

                                    {/* Lights */}
                                    <div className="flex items-center text-gray-900 font-semibold">Lights</div>
                                    <div className="flex justify-center items-center">
                                        <input
                                            type="radio"
                                            name="furnishing.foyer_entrance.lights"
                                            value="furnished"
                                            checked={form.furnishing.foyer_entrance.lights === 'furnished'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>
                                    <div className="flex justify-center items-center">
                                        <input
                                            type="radio"
                                            name="furnishing.foyer_entrance.lights"
                                            value="not_furnish"
                                            checked={form.furnishing.foyer_entrance.lights === 'not_furnish'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col mb-8">
                        <span className="text-slate-900 mb-2 font-medium">Others</span>
                        <span className="textarea text-slate-900 mb-2 font-medium">{form.furnishing.foyer_entrance.other}</span>
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
                                            checked={form.furnishing.kitchen.kitchen_cabinet === 'furnished'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>
                                    <div className="flex justify-center items-center">
                                        <input
                                            type="radio"
                                            name="furnishing.kitchen.kitchen_cabinet"
                                            value="not_furnish"
                                            checked={form.furnishing.kitchen.kitchen_cabinet === 'not_furnish'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>

                                    {/* Kitchen Island */}
                                    <div className="flex items-center text-gray-900 font-semibold">Kitchen island</div>
                                    <div className="flex justify-center items-center">
                                        <input
                                            type="radio"
                                            name="furnishing.kitchen.kitchen_island"
                                            value="furnished"
                                            checked={form.furnishing.kitchen.kitchen_island === 'furnished'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>
                                    <div className="flex justify-center items-center">
                                        <input
                                            type="radio"
                                            name="furnishing.kitchen.kitchen_island"
                                            value="not_furnish"
                                            checked={form.furnishing.kitchen.kitchen_island === 'not_furnish'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>

                                    {/* Sink & Tap */}
                                    <div className="flex items-center text-gray-900 font-semibold">Sink & tap</div>
                                    <div className="flex justify-center items-center">
                                        <input
                                            type="radio"
                                            name="furnishing.kitchen.sink_tap"
                                            value="furnished"
                                            checked={form.furnishing.kitchen.sink_tap === 'furnished'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>
                                    <div className="flex justify-center items-center">
                                        <input
                                            type="radio"
                                            name="furnishing.kitchen.sink_tap"
                                            value="not_furnish"
                                            checked={form.furnishing.kitchen.sink_tap === 'not_furnish'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>

                                    {/* Hood and Hob */}
                                    <div className="flex items-center text-gray-900 font-semibold">Hood and hob</div>
                                    <div className="flex justify-center items-center">
                                        <input
                                            type="radio"
                                            name="furnishing.kitchen.hood_hob"
                                            value="furnished"
                                            checked={form.furnishing.kitchen.hood_hob === 'furnished'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>
                                    <div className="flex justify-center items-center">
                                        <input
                                            type="radio"
                                            name="furnishing.kitchen.hood_hob"
                                            value="not_furnish"
                                            checked={form.furnishing.kitchen.hood_hob === 'not_furnish'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>

                                    {/* Microwave */}
                                    <div className="flex items-center text-gray-900 font-semibold">Microwave</div>
                                    <div className="flex justify-center items-center">
                                        <input
                                            type="radio"
                                            name="furnishing.kitchen.microwave"
                                            value="furnished"
                                            checked={form.furnishing.kitchen.microwave === 'furnished'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>
                                    <div className="flex justify-center items-center">
                                        <input
                                            type="radio"
                                            name="furnishing.kitchen.microwave"
                                            value="not_furnish"
                                            checked={form.furnishing.kitchen.microwave === 'not_furnish'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>

                                    {/* Oven */}
                                    <div className="flex items-center text-gray-900 font-semibold">Oven</div>
                                    <div className="flex justify-center items-center">
                                        <input
                                            type="radio"
                                            name="furnishing.kitchen.oven"
                                            value="furnished"
                                            checked={form.furnishing.kitchen.oven === 'furnished'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>
                                    <div className="flex justify-center items-center">
                                        <input
                                            type="radio"
                                            name="furnishing.kitchen.oven"
                                            value="not_furnish"
                                            checked={form.furnishing.kitchen.oven === 'not_furnish'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>

                                    {/* Water Dispenser / Water Purifier */}
                                    <div className="flex items-center text-gray-900 font-semibold">Water dispenser / water purifier</div>
                                    <div className="flex justify-center items-center">
                                        <input
                                            type="radio"
                                            name="furnishing.kitchen.water_dispenser"
                                            value="furnished"
                                            checked={form.furnishing.kitchen.water_dispenser === 'furnished'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>
                                    <div className="flex justify-center items-center">
                                        <input
                                            type="radio"
                                            name="furnishing.kitchen.water_dispenser"
                                            value="not_furnish"
                                            checked={form.furnishing.kitchen.water_dispenser === 'not_furnish'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>

                                    {/* Fridge */}
                                    <div className="flex items-center text-gray-900 font-semibold">Fridge</div>
                                    <div className="flex justify-center items-center">
                                        <input
                                            type="radio"
                                            name="furnishing.kitchen.fridge"
                                            value="furnished"
                                            checked={form.furnishing.kitchen.fridge === 'furnished'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>
                                    <div className="flex justify-center items-center">
                                        <input
                                            type="radio"
                                            name="furnishing.kitchen.fridge"
                                            value="not_furnish"
                                            checked={form.furnishing.kitchen.fridge === 'not_furnish'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>

                                    {/* Lights */}
                                    <div className="flex items-center text-gray-900 font-semibold">Lights</div>
                                    <div className="flex justify-center items-center">
                                        <input
                                            type="radio"
                                            name="furnishing.kitchen.lights"
                                            value="furnished"
                                            checked={form.furnishing.kitchen.lights === 'furnished'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>
                                    <div className="flex justify-center items-center">
                                        <input
                                            type="radio"
                                            name="furnishing.kitchen.lights"
                                            value="not_furnish"
                                            checked={form.furnishing.kitchen.lights === 'not_furnish'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col mb-8">
                        <span className="text-slate-900 mb-2 font-medium">Others</span>
                        <span className="textarea text-slate-900 mb-2 font-medium">{form.furnishing.kitchen.other}</span>
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
                                            checked={form.furnishing.yard.washer === 'furnished'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>
                                    <div className="flex justify-center items-center">
                                        <input
                                            type="radio"
                                            name="furnishing.yard.washer"
                                            value="not_furnish"
                                            checked={form.furnishing.yard.washer === 'not_furnish'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>

                                    {/* Dryer */}
                                    <div className="flex items-center text-gray-900 font-semibold">Dryer</div>
                                    <div className="flex justify-center items-center">
                                        <input
                                            type="radio"
                                            name="furnishing.yard.dryer"
                                            value="furnished"
                                            checked={form.furnishing.yard.dryer === 'furnished'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>
                                    <div className="flex justify-center items-center">
                                        <input
                                            type="radio"
                                            name="furnishing.yard.dryer"
                                            value="not_furnish"
                                            checked={form.furnishing.yard.dryer === 'not_furnish'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>

                                    {/* Lights */}
                                    <div className="flex items-center text-gray-900 font-semibold">Lights</div>
                                    <div className="flex justify-center items-center">
                                        <input
                                            type="radio"
                                            name="furnishing.yard.lights"
                                            value="furnished"
                                            checked={form.furnishing.yard.lights === 'furnished'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>
                                    <div className="flex justify-center items-center">
                                        <input
                                            type="radio"
                                            name="furnishing.yard.lights"
                                            value="not_furnish"
                                            checked={form.furnishing.yard.lights === 'not_furnish'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col mb-8">
                        <span className="text-slate-900 mb-2 font-medium">Others</span>
                        <span className="textarea text-slate-900 mb-2 font-medium">{form.furnishing.yard.other}</span>
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
                                            checked={form.furnishing.dining.dining_table_chairs === 'furnished'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>
                                    <div className="flex justify-center items-center">
                                        <input
                                            type="radio"
                                            name="furnishing.dining.dining_table_chairs"
                                            value="not_furnish"
                                            checked={form.furnishing.dining.dining_table_chairs === 'not_furnish'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>

                                    {/* Lights */}
                                    <div className="flex items-center text-gray-900 font-semibold">Lights</div>
                                    <div className="flex justify-center items-center">
                                        <input
                                            type="radio"
                                            name="furnishing.dining.lights"
                                            value="furnished"
                                            checked={form.furnishing.dining.lights === 'furnished'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>
                                    <div className="flex justify-center items-center">
                                        <input
                                            type="radio"
                                            name="furnishing.dining.lights"
                                            value="not_furnish"
                                            checked={form.furnishing.dining.lights === 'not_furnish'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>

                                    {/* Fan */}
                                    <div className="flex items-center text-gray-900 font-semibold">Fan</div>
                                    <div className="flex justify-center items-center">
                                        <input
                                            type="radio"
                                            name="furnishing.dining.fan"
                                            value="furnished"
                                            checked={form.furnishing.dining.fan === 'furnished'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>
                                    <div className="flex justify-center items-center">
                                        <input
                                            type="radio"
                                            name="furnishing.dining.fan"
                                            value="not_furnish"
                                            checked={form.furnishing.dining.fan === 'not_furnish'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col mb-8">
                        <span className="text-slate-900 mb-2 font-medium">Others</span>
                        <span className="textarea text-slate-900 mb-2 font-medium">{form.furnishing.dining.other}</span>
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
                                            checked={form.furnishing.living.sofa === 'furnished'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>
                                    <div className="flex justify-center items-center">
                                        <input
                                            type="radio"
                                            name="furnishing.living.sofa"
                                            value="not_furnish"
                                            checked={form.furnishing.living.sofa === 'not_furnish'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>

                                    {/* Coffee Table */}
                                    <div className="flex items-center text-gray-900 font-semibold">Coffee table</div>
                                    <div className="flex justify-center items-center">
                                        <input
                                            type="radio"
                                            name="furnishing.living.coffee_table"
                                            value="furnished"
                                            checked={form.furnishing.living.coffee_table === 'furnished'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>
                                    <div className="flex justify-center items-center">
                                        <input
                                            type="radio"
                                            name="furnishing.living.coffee_table"
                                            value="not_furnish"
                                            checked={form.furnishing.living.coffee_table === 'not_furnish'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>

                                    {/* TV */}
                                    <div className="flex items-center text-gray-900 font-semibold">TV</div>
                                    <div className="flex justify-center items-center">
                                        <input
                                            type="radio"
                                            name="furnishing.living.tv"
                                            value="furnished"
                                            checked={form.furnishing.living.tv === 'furnished'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>
                                    <div className="flex justify-center items-center">
                                        <input
                                            type="radio"
                                            name="furnishing.living.tv"
                                            value="not_furnish"
                                            checked={form.furnishing.living.tv === 'not_furnish'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>

                                    {/* TV Cabinet */}
                                    <div className="flex items-center text-gray-900 font-semibold">TV cabinet</div>
                                    <div className="flex justify-center items-center">
                                        <input
                                            type="radio"
                                            name="furnishing.living.tv_cabinet"
                                            value="furnished"
                                            checked={form.furnishing.living.tv_cabinet === 'furnished'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>
                                    <div className="flex justify-center items-center">
                                        <input
                                            type="radio"
                                            name="furnishing.living.tv_cabinet"
                                            value="not_furnish"
                                            checked={form.furnishing.living.tv_cabinet === 'not_furnish'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>

                                    {/* Fan */}
                                    <div className="flex items-center text-gray-900 font-semibold">Fan</div>
                                    <div className="flex justify-center items-center">
                                        <input
                                            type="radio"
                                            name="furnishing.living.fan"
                                            value="furnished"
                                            checked={form.furnishing.living.fan === 'furnished'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>
                                    <div className="flex justify-center items-center">
                                        <input
                                            type="radio"
                                            name="furnishing.living.fan"
                                            value="not_furnish"
                                            checked={form.furnishing.living.fan === 'not_furnish'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>

                                    {/* Lights */}
                                    <div className="flex items-center text-gray-900 font-semibold">Lights</div>
                                    <div className="flex justify-center items-center">
                                        <input
                                            type="radio"
                                            name="furnishing.living.lights"
                                            value="furnished"
                                            checked={form.furnishing.living.lights === 'furnished'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>
                                    <div className="flex justify-center items-center">
                                        <input
                                            type="radio"
                                            name="furnishing.living.lights"
                                            value="not_furnish"
                                            checked={form.furnishing.living.lights === 'not_furnish'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>

                                    {/* AC */}
                                    <div className="flex items-center text-gray-900 font-semibold">AC</div>
                                    <div className="flex justify-center items-center">
                                        <input
                                            type="radio"
                                            name="furnishing.living.ac"
                                            value="furnished"
                                            checked={form.furnishing.living.ac === 'furnished'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>
                                    <div className="flex justify-center items-center">
                                        <input
                                            type="radio"
                                            name="furnishing.living.ac"
                                            value="not_furnish"
                                            checked={form.furnishing.living.ac === 'not_furnish'}
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            readOnly={true}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col mb-8">
                        <span className="text-slate-900 mb-2 font-medium">Others</span>
                        <span className="textarea text-slate-900 mb-2 font-medium">{form.furnishing.dining.other}</span>
                    </div>

                    <hr />
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
                                            <a href={'https://api.renoxpert.my' + attachment.file_url} target="_blank" rel="noopener noreferrer" className="badge badge-lg mb-2">
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