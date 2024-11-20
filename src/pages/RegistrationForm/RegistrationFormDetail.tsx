import { useNavigate, useParams } from "react-router-dom";
import useFetchRegistrationForm from "../../hook/useFetchRegistrationForm";
import Loading from "../../components/Loading";
import { Link } from "react-router-dom";

function RegistrationFormDetail() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const formId = id ? parseInt(id, 10) : null;

    const { formDetail, loading, error } = useFetchRegistrationForm(formId);

    const handleBackClick = () => {
        navigate('/registration-forms');
    };

    if (loading) return <Loading />;
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
                        Registration Form Detail
                    </span>
                </div>
                {formDetail.status === 'pending' && (
                    <Link
                        to={'/registration-forms/edit/' + formId}
                        className="btn btn-sm btn-info"
                    >
                        Edit Form
                    </Link>
                )}
            </div>

            <div className="flex flex-wrap justify-between">
                <div className="flex flex-col gap-4 w-full md:w-1/3">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Property Information</h3>
                        </div>
                        <div className="card-body flex flex-col gap-6 text-gray-900">
                            <div className="flex flex-col">
                                {formDetail.other_property &&
                                    <div className="badge badge-dark mb-2">
                                        <i className="ki-solid ki-information-3 pr-2 text-base text-warning"></i>
                                        <span className="text-sm">This Property may not in the database</span>
                                    </div>
                                }
                                <span className="font-normal">Property to be renovated:</span>
                                <span className="font-semibold">{formDetail.property ? formDetail.property.property_name : "(Other) " + formDetail.other_property.property_name}</span>
                            </div>

                            <div className="flex flex-col">
                                <span className="font-normal">Unit:</span>
                                <span className="font-semibold">
                                    {formDetail.property ?
                                        `${formDetail.property.block}-${formDetail.property.level}-${formDetail.property.unit}` :
                                        `${formDetail.other_property.block}-${formDetail.other_property.level}-${formDetail.other_property.unit}`
                                    }
                                </span>
                            </div>

                            <div className="flex flex-col">
                                <span className="font-normal">Layout Type:</span>
                                <span className="font-semibold">
                                    {formDetail.property ?
                                        `${formDetail.property.layout_type}` :
                                        `${formDetail.other_property.layout_type}`
                                    }
                                </span>
                            </div>

                            <div className="flex flex-col">
                                <span className="font-normal">Sqft:</span>
                                <span className="font-semibold">
                                    {formDetail.property ?
                                        `${formDetail.property.sqft}` :
                                        `${formDetail.other_property.sqft}`
                                    }
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Owner Information</h3>
                        </div>
                        <div className="card-body flex flex-col gap-6 text-gray-900">
                            <div className="flex flex-col">
                                <span className="font-normal">Salutations:</span>
                                <span className="font-semibold">{formDetail.user.salutations}</span>
                            </div>

                            <div className="flex flex-col">
                                <span className="font-normal">Name:</span>
                                <span className="font-semibold">{formDetail.user.name_first} {formDetail.user.name_last}</span>
                            </div>

                            <div className="flex flex-col">
                                <span className="font-normal">Preferred Name:</span>
                                <span className="font-semibold">{formDetail.user.name_preferred}</span>
                            </div>

                            <div className="flex flex-col">
                                <span className="font-normal">Email:</span>
                                <span className="font-semibold">{formDetail.user.email}</span>
                            </div>

                            <div className="flex flex-col">
                                <span className="font-normal">Phone Number:</span>
                                <span className="font-semibold">{formDetail.user.country_code}{formDetail.user.phone_no}</span>
                            </div>

                            <div className="flex flex-col">
                                <span className="font-normal">Current residence address:</span>
                                <span className="font-semibold">{formDetail.address.address_1}, {formDetail.address.address_2}, {formDetail.address.postcode}, {formDetail.address.city}, {formDetail.address.state}</span>
                            </div>

                            <div className="flex flex-col">
                                <span className="font-normal">IC / ID number:</span>
                                <span className="font-semibold">{formDetail.user.ic}</span>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Property Information (Detail)</h3>
                        </div>
                        <div className="card-body flex flex-col gap-6 text-gray-900">
                            <div className="flex flex-col">
                                <span className="font-normal">What's your original number of rooms?</span>
                                <span className="font-semibold">
                                    {formDetail.questions.quest_1
                                        .replace(/_/g, ' ')
                                        .split(' ')
                                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                        .join(' ')
                                    }
                                </span>
                            </div>

                            <div className="flex flex-col">
                                <span className="font-normal">What's the number of bathroom?</span>
                                <span className="font-semibold">
                                    {formDetail.questions.quest_2
                                        .replace(/_/g, ' ')
                                        .split(' ')
                                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                        .join(' ')
                                    }
                                </span>
                            </div>

                            <div className="flex flex-col">
                                <span className="font-normal">Already Vacant Possessions (VP)?</span>
                                <span className="font-semibold">
                                    {formDetail.questions.quest_3
                                        .replace(/_/g, ' ')
                                        .split(' ')
                                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                        .join(' ')
                                    }
                                </span>
                            </div>

                            <div className="flex flex-col">
                                <span className="font-normal">Already collect key?</span>
                                <span className="font-semibold">
                                    {formDetail.questions.quest_4
                                        .replace(/_/g, ' ')
                                        .split(' ')
                                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                        .join(' ')
                                    }
                                </span>
                            </div>

                            <div className="flex flex-col">
                                <span className="font-normal">Already done defect inspection?</span>
                                <span className="font-semibold">
                                    {formDetail.questions.quest_5
                                        .replace(/_/g, ' ')
                                        .split(' ')
                                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                        .join(' ')
                                    }
                                </span>
                            </div>

                            <div className="flex flex-col">
                                <span className="font-normal">Already submit defect submission to MO?</span>
                                <span className="font-semibold">
                                    {formDetail.questions.quest_6
                                        .replace(/_/g, ' ')
                                        .split(' ')
                                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                        .join(' ')
                                    }
                                </span>
                            </div>

                            <div className="flex flex-col">
                                <span className="font-normal">MO has completed that defect rectification?</span>
                                <span className="font-semibold">
                                    {formDetail.questions.quest_7
                                        .replace(/_/g, ' ')
                                        .split(' ')
                                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                        .join(' ')
                                    }
                                </span>
                            </div>

                            <div className="flex flex-col">
                                <span className="font-normal">Do you want to add partition room to your unit?</span>
                                <span className="font-semibold">
                                    {formDetail.questions.quest_8
                                        .replace(/_/g, ' ')
                                        .split(' ')
                                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                        .join(' ')
                                    }
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4 w-full md:w-1/3">
                    <div className="flex flex-col flex-wrap mb-8">
                        <div className="card rounded-md mb-4">
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
                                                checked={formDetail.furnishing.foyer_entrance.grille_door === 'furnished'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly
                                            />
                                        </div>
                                        <div className="flex justify-center items-center">
                                            <input
                                                type="radio"
                                                name="furnishing.foyer_entrance.grille_door"
                                                value="not-furnish"
                                                checked={formDetail.furnishing.foyer_entrance.grille_door === 'not-furnish'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly
                                            />
                                        </div>

                                        {/* Digital Lock */}
                                        <div className="flex items-center text-gray-900 font-semibold">Digital lock</div>
                                        <div className="flex justify-center items-center">
                                            <input
                                                type="radio"
                                                name="furnishing.foyer_entrance.digital_lock"
                                                value="furnished"
                                                checked={formDetail.furnishing.foyer_entrance.digital_lock === 'furnished'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly
                                            />
                                        </div>
                                        <div className="flex justify-center items-center">
                                            <input
                                                type="radio"
                                                name="furnishing.foyer_entrance.digital_lock"
                                                value="not-furnish"
                                                checked={formDetail.furnishing.foyer_entrance.digital_lock === 'not-furnish'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly

                                            />
                                        </div>

                                        {/* Shoe Cabinet */}
                                        <div className="flex items-center text-gray-900 font-semibold">Shoe cabinet</div>
                                        <div className="flex justify-center items-center">
                                            <input
                                                type="radio"
                                                name="furnishing.foyer_entrance.shoe_cabinet"
                                                value="furnished"
                                                checked={formDetail.furnishing.foyer_entrance.shoe_cabinet === 'furnished'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly

                                            />
                                        </div>
                                        <div className="flex justify-center items-center">
                                            <input
                                                type="radio"
                                                name="furnishing.foyer_entrance.shoe_cabinet"
                                                value="not-furnish"
                                                checked={formDetail.furnishing.foyer_entrance.shoe_cabinet === 'not-furnish'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly

                                            />
                                        </div>

                                        {/* Lights */}
                                        <div className="flex items-center text-gray-900 font-semibold">Lights</div>
                                        <div className="flex justify-center items-center">
                                            <input
                                                type="radio"
                                                name="furnishing.foyer_entrance.lights"
                                                value="furnished"
                                                checked={formDetail.furnishing.foyer_entrance.lights === 'furnished'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly

                                            />
                                        </div>
                                        <div className="flex justify-center items-center">
                                            <input
                                                type="radio"
                                                name="furnishing.foyer_entrance.lights"
                                                value="not-furnish"
                                                checked={formDetail.furnishing.foyer_entrance.lights === 'not-furnish'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly

                                            />
                                        </div>
                                    </div>

                                    <hr className="my-4" />

                                    <div className="flex flex-col w-full">
                                        <span className="text-slate-900 mb-2 font-medium">Others</span>
                                        <span className="textarea text-slate-900 mb-2 font-medium">{formDetail.furnishing.foyer_entrance.other}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card rounded-md mb-4">
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
                                                checked={formDetail.furnishing.kitchen.kitchen_cabinet === 'furnished'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly

                                            />
                                        </div>
                                        <div className="flex justify-center items-center">
                                            <input
                                                type="radio"
                                                name="furnishing.kitchen.kitchen_cabinet"
                                                value="not-furnish"
                                                checked={formDetail.furnishing.kitchen.kitchen_cabinet === 'not-furnish'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly

                                            />
                                        </div>

                                        {/* Kitchen Island */}
                                        <div className="flex items-center text-gray-900 font-semibold">Kitchen island</div>
                                        <div className="flex justify-center items-center">
                                            <input
                                                type="radio"
                                                name="furnishing.kitchen.kitchen_island"
                                                value="furnished"
                                                checked={formDetail.furnishing.kitchen.kitchen_island === 'furnished'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly

                                            />
                                        </div>
                                        <div className="flex justify-center items-center">
                                            <input
                                                type="radio"
                                                name="furnishing.kitchen.kitchen_island"
                                                value="not-furnish"
                                                checked={formDetail.furnishing.kitchen.kitchen_island === 'not-furnish'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly

                                            />
                                        </div>

                                        {/* Sink & Tap */}
                                        <div className="flex items-center text-gray-900 font-semibold">Sink & tap</div>
                                        <div className="flex justify-center items-center">
                                            <input
                                                type="radio"
                                                name="furnishing.kitchen.sink_tap"
                                                value="furnished"
                                                checked={formDetail.furnishing.kitchen.sink_tap === 'furnished'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly

                                            />
                                        </div>
                                        <div className="flex justify-center items-center">
                                            <input
                                                type="radio"
                                                name="furnishing.kitchen.sink_tap"
                                                value="not-furnish"
                                                checked={formDetail.furnishing.kitchen.sink_tap === 'not-furnish'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly

                                            />
                                        </div>

                                        {/* Hood and Hob */}
                                        <div className="flex items-center text-gray-900 font-semibold">Hood and hob</div>
                                        <div className="flex justify-center items-center">
                                            <input
                                                type="radio"
                                                name="furnishing.kitchen.hood_hob"
                                                value="furnished"
                                                checked={formDetail.furnishing.kitchen.hood_hob === 'furnished'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly

                                            />
                                        </div>
                                        <div className="flex justify-center items-center">
                                            <input
                                                type="radio"
                                                name="furnishing.kitchen.hood_hob"
                                                value="not-furnish"
                                                checked={formDetail.furnishing.kitchen.hood_hob === 'not-furnish'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly

                                            />
                                        </div>

                                        {/* Microwave */}
                                        <div className="flex items-center text-gray-900 font-semibold">Microwave</div>
                                        <div className="flex justify-center items-center">
                                            <input
                                                type="radio"
                                                name="furnishing.kitchen.microwave"
                                                value="furnished"
                                                checked={formDetail.furnishing.kitchen.microwave === 'furnished'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly

                                            />
                                        </div>
                                        <div className="flex justify-center items-center">
                                            <input
                                                type="radio"
                                                name="furnishing.kitchen.microwave"
                                                value="not-furnish"
                                                checked={formDetail.furnishing.kitchen.microwave === 'not-furnish'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly

                                            />
                                        </div>

                                        {/* Oven */}
                                        <div className="flex items-center text-gray-900 font-semibold">Oven</div>
                                        <div className="flex justify-center items-center">
                                            <input
                                                type="radio"
                                                name="furnishing.kitchen.oven"
                                                value="furnished"
                                                checked={formDetail.furnishing.kitchen.oven === 'furnished'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly

                                            />
                                        </div>
                                        <div className="flex justify-center items-center">
                                            <input
                                                type="radio"
                                                name="furnishing.kitchen.oven"
                                                value="not-furnish"
                                                checked={formDetail.furnishing.kitchen.oven === 'not-furnish'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly

                                            />
                                        </div>

                                        {/* Water Dispenser / Water Purifier */}
                                        <div className="flex items-center text-gray-900 font-semibold">Water dispenser / water purifier</div>
                                        <div className="flex justify-center items-center">
                                            <input
                                                type="radio"
                                                name="furnishing.kitchen.water_dispenser"
                                                value="furnished"
                                                checked={formDetail.furnishing.kitchen.water_dispenser === 'furnished'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly

                                            />
                                        </div>
                                        <div className="flex justify-center items-center">
                                            <input
                                                type="radio"
                                                name="furnishing.kitchen.water_dispenser"
                                                value="not-furnish"
                                                checked={formDetail.furnishing.kitchen.water_dispenser === 'not-furnish'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly

                                            />
                                        </div>

                                        {/* Fridge */}
                                        <div className="flex items-center text-gray-900 font-semibold">Fridge</div>
                                        <div className="flex justify-center items-center">
                                            <input
                                                type="radio"
                                                name="furnishing.kitchen.fridge"
                                                value="furnished"
                                                checked={formDetail.furnishing.kitchen.fridge === 'furnished'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly

                                            />
                                        </div>
                                        <div className="flex justify-center items-center">
                                            <input
                                                type="radio"
                                                name="furnishing.kitchen.fridge"
                                                value="not-furnish"
                                                checked={formDetail.furnishing.kitchen.fridge === 'not-furnish'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly

                                            />
                                        </div>

                                        {/* Lights */}
                                        <div className="flex items-center text-gray-900 font-semibold">Lights</div>
                                        <div className="flex justify-center items-center">
                                            <input
                                                type="radio"
                                                name="furnishing.kitchen.lights"
                                                value="furnished"
                                                checked={formDetail.furnishing.kitchen.lights === 'furnished'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly

                                            />
                                        </div>
                                        <div className="flex justify-center items-center">
                                            <input
                                                type="radio"
                                                name="furnishing.kitchen.lights"
                                                value="not-furnish"
                                                checked={formDetail.furnishing.kitchen.lights === 'not-furnish'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly

                                            />
                                        </div>
                                    </div>

                                    <hr className="my-4" />

                                    <div className="flex flex-col w-full">
                                        <span className="text-slate-900 mb-2 font-medium">Others</span>
                                        <span className="textarea text-slate-900 mb-2 font-medium">{formDetail.furnishing.kitchen.other}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card rounded-md mb-4">
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
                                                checked={formDetail.furnishing.yard.washer === 'furnished'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly

                                            />
                                        </div>
                                        <div className="flex justify-center items-center">
                                            <input
                                                type="radio"
                                                name="furnishing.yard.washer"
                                                value="not-furnish"
                                                checked={formDetail.furnishing.yard.washer === 'not-furnish'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly

                                            />
                                        </div>

                                        {/* Dryer */}
                                        <div className="flex items-center text-gray-900 font-semibold">Dryer</div>
                                        <div className="flex justify-center items-center">
                                            <input
                                                type="radio"
                                                name="furnishing.yard.dryer"
                                                value="furnished"
                                                checked={formDetail.furnishing.yard.dryer === 'furnished'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly

                                            />
                                        </div>
                                        <div className="flex justify-center items-center">
                                            <input
                                                type="radio"
                                                name="furnishing.yard.dryer"
                                                value="not-furnish"
                                                checked={formDetail.furnishing.yard.dryer === 'not-furnish'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly

                                            />
                                        </div>

                                        {/* Lights */}
                                        <div className="flex items-center text-gray-900 font-semibold">Lights</div>
                                        <div className="flex justify-center items-center">
                                            <input
                                                type="radio"
                                                name="furnishing.yard.lights"
                                                value="furnished"
                                                checked={formDetail.furnishing.yard.lights === 'furnished'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly

                                            />
                                        </div>
                                        <div className="flex justify-center items-center">
                                            <input
                                                type="radio"
                                                name="furnishing.yard.lights"
                                                value="not-furnish"
                                                checked={formDetail.furnishing.yard.lights === 'not-furnish'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly

                                            />
                                        </div>
                                    </div>

                                    <hr className="my-4" />

                                    <div className="flex flex-col w-full">
                                        <span className="text-slate-900 mb-2 font-medium">Others</span>
                                        <span className="textarea text-slate-900 mb-2 font-medium">{formDetail.furnishing.yard.other}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card rounded-md mb-4">
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
                                                checked={formDetail.furnishing.dining.dining_table_chairs === 'furnished'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly
                                            />
                                        </div>
                                        <div className="flex justify-center items-center">
                                            <input
                                                type="radio"
                                                name="furnishing.dining.dining_table_chairs"
                                                value="not-furnish"
                                                checked={formDetail.furnishing.dining.dining_table_chairs === 'not-furnish'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly

                                            />
                                        </div>

                                        {/* Lights */}
                                        <div className="flex items-center text-gray-900 font-semibold">Lights</div>
                                        <div className="flex justify-center items-center">
                                            <input
                                                type="radio"
                                                name="furnishing.dining.lights"
                                                value="furnished"
                                                checked={formDetail.furnishing.dining.lights === 'furnished'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly

                                            />
                                        </div>
                                        <div className="flex justify-center items-center">
                                            <input
                                                type="radio"
                                                name="furnishing.dining.lights"
                                                value="not-furnish"
                                                checked={formDetail.furnishing.dining.lights === 'not-furnish'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly

                                            />
                                        </div>

                                        {/* Fan */}
                                        <div className="flex items-center text-gray-900 font-semibold">Fan</div>
                                        <div className="flex justify-center items-center">
                                            <input
                                                type="radio"
                                                name="furnishing.dining.fan"
                                                value="furnished"
                                                checked={formDetail.furnishing.dining.fan === 'furnished'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly

                                            />
                                        </div>
                                        <div className="flex justify-center items-center">
                                            <input
                                                type="radio"
                                                name="furnishing.dining.fan"
                                                value="not-furnish"
                                                checked={formDetail.furnishing.dining.fan === 'not-furnish'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly

                                            />
                                        </div>
                                    </div>

                                    <hr className="my-4" />

                                    <div className="flex flex-col w-full">
                                        <span className="text-slate-900 mb-2 font-medium">Others</span>
                                        <span className="textarea text-slate-900 mb-2 font-medium">{formDetail.furnishing.dining.other}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card rounded-md mb-4">
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
                                                checked={formDetail.furnishing.living.sofa === 'furnished'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly

                                            />
                                        </div>
                                        <div className="flex justify-center items-center">
                                            <input
                                                type="radio"
                                                name="furnishing.living.sofa"
                                                value="not-furnish"
                                                checked={formDetail.furnishing.living.sofa === 'not-furnish'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly

                                            />
                                        </div>

                                        {/* Coffee Table */}
                                        <div className="flex items-center text-gray-900 font-semibold">Coffee table</div>
                                        <div className="flex justify-center items-center">
                                            <input
                                                type="radio"
                                                name="furnishing.living.coffee_table"
                                                value="furnished"
                                                checked={formDetail.furnishing.living.coffee_table === 'furnished'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly

                                            />
                                        </div>
                                        <div className="flex justify-center items-center">
                                            <input
                                                type="radio"
                                                name="furnishing.living.coffee_table"
                                                value="not-furnish"
                                                checked={formDetail.furnishing.living.coffee_table === 'not-furnish'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly

                                            />
                                        </div>

                                        {/* TV */}
                                        <div className="flex items-center text-gray-900 font-semibold">TV</div>
                                        <div className="flex justify-center items-center">
                                            <input
                                                type="radio"
                                                name="furnishing.living.tv"
                                                value="furnished"
                                                checked={formDetail.furnishing.living.tv === 'furnished'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly

                                            />
                                        </div>
                                        <div className="flex justify-center items-center">
                                            <input
                                                type="radio"
                                                name="furnishing.living.tv"
                                                value="not-furnish"
                                                checked={formDetail.furnishing.living.tv === 'not-furnish'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly

                                            />
                                        </div>

                                        {/* TV Cabinet */}
                                        <div className="flex items-center text-gray-900 font-semibold">TV cabinet</div>
                                        <div className="flex justify-center items-center">
                                            <input
                                                type="radio"
                                                name="furnishing.living.tv_cabinet"
                                                value="furnished"
                                                checked={formDetail.furnishing.living.tv_cabinet === 'furnished'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly

                                            />
                                        </div>
                                        <div className="flex justify-center items-center">
                                            <input
                                                type="radio"
                                                name="furnishing.living.tv_cabinet"
                                                value="not-furnish"
                                                checked={formDetail.furnishing.living.tv_cabinet === 'not-furnish'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly

                                            />
                                        </div>

                                        {/* Fan */}
                                        <div className="flex items-center text-gray-900 font-semibold">Fan</div>
                                        <div className="flex justify-center items-center">
                                            <input
                                                type="radio"
                                                name="furnishing.living.fan"
                                                value="furnished"
                                                checked={formDetail.furnishing.living.fan === 'furnished'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly

                                            />
                                        </div>
                                        <div className="flex justify-center items-center">
                                            <input
                                                type="radio"
                                                name="furnishing.living.fan"
                                                value="not-furnish"
                                                checked={formDetail.furnishing.living.fan === 'not-furnish'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly

                                            />
                                        </div>

                                        {/* Lights */}
                                        <div className="flex items-center text-gray-900 font-semibold">Lights</div>
                                        <div className="flex justify-center items-center">
                                            <input
                                                type="radio"
                                                name="furnishing.living.lights"
                                                value="furnished"
                                                checked={formDetail.furnishing.living.lights === 'furnished'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly

                                            />
                                        </div>
                                        <div className="flex justify-center items-center">
                                            <input
                                                type="radio"
                                                name="furnishing.living.lights"
                                                value="not-furnish"
                                                checked={formDetail.furnishing.living.lights === 'not-furnish'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly

                                            />
                                        </div>

                                        {/* AC */}
                                        <div className="flex items-center text-gray-900 font-semibold">AC</div>
                                        <div className="flex justify-center items-center">
                                            <input
                                                type="radio"
                                                name="furnishing.living.ac"
                                                value="furnished"
                                                checked={formDetail.furnishing.living.ac === 'furnished'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly

                                            />
                                        </div>
                                        <div className="flex justify-center items-center">
                                            <input
                                                type="radio"
                                                name="furnishing.living.ac"
                                                value="not-furnish"
                                                checked={formDetail.furnishing.living.ac === 'not-furnish'}
                                                className="radio radio-lg h-4 w-4 text-blue-600"
                                                readOnly

                                            />
                                        </div>
                                    </div>

                                    <hr className="my-4" />

                                    <div className="flex flex-col w-full">
                                        <span className="text-slate-900 mb-2 font-medium">Others</span>
                                        <span className="textarea text-slate-900 mb-2 font-medium">{formDetail.furnishing.dining.other}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4 w-full md:w-1/4">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Attachments</h3>
                        </div>
                        <div className="card-body">
                            <div className="flex flex-col">
                                {formDetail.attachments && Object.keys(formDetail.attachments).length > 0 ? (
                                    <ul>
                                        {Object.keys(formDetail.attachments).map((key) => {
                                            const attachment = formDetail.attachments[key];
                                            return (
                                                <li key={key}>
                                                    {attachment.file_url ? (
                                                        <a href={'https://api.renoxpert.my' + attachment.file_url} target="_blank" rel="noopener noreferrer" className="badge badge-lg mb-2 break-words">
                                                            Attachment {Number(key) + 1}
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
                </div>
            </div>
        </>
    )
}

export default RegistrationFormDetail;