import { useEffect, useState } from "react";
import KTComponent, { KTTabs } from "../../metronic/core";
import useFetchOwnerOrders from "../../hook/useFetchOwnerOrders";
import Loading from "../../components/Loading";
import { user } from "../../services/ownerApi";
import { User } from "../../types";
import { Link } from "react-router-dom";
import { logoutOwner } from "../../services/auth";
import { toSvg } from "jdenticon/standalone";
import useFetchOwnerRegistrationForms from "../../hook/useFetchOwnerRegistrationForms";

function OwnerHome() {
    const { orders, loading: ordersLoading, error: ordersError } = useFetchOwnerOrders();
    const { forms, loading: formsLoading, error: formsError } = useFetchOwnerRegistrationForms();
    const [owner, setOwner] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [userError, setUserError] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState('tab_1_1');

    useEffect(() => {
        KTComponent.init();
        KTTabs.init();
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const response = await user();
            setOwner(response);
        } catch (error) {
            console.error(error);
            setUserError("Failed to load user data.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logoutOwner();
            // Redirect to login page or home page
            window.location.href = '/owner/home'; // Adjust the redirection path as needed
        } catch (error) {
            console.error('Logout failed:', error);
            // Optionally show an error message to the user
        }
    };

    if (ordersLoading || formsLoading || loading) return <Loading />;
    if (ordersError) return <div>Error fetching orders: {ordersError}</div>;
    if (formsError) return <div>Error fetching orders: {ordersError}</div>;
    if (userError) return <div>{userError}</div>;
    if (!orders || !owner || !forms) return <div>An unexpected error occurred</div>;

    const svgString = toSvg(owner.name + owner.phone_no, 60);

    return (
        <div className="flex flex-col w-full px-4">
            <div className="card mb-4 mt-8">
                <div className="card-body">
                    <div className="flex flex-col justify-center items-center">
                        <div
                            dangerouslySetInnerHTML={{ __html: svgString }}
                            className="absolute top-16 flex justify-center items-center size-20 rounded-full border-2 border-success shrink-0 bg-white"
                        />
                        <span className="text-slate-900 text-xl font-bold mt-6">{owner.name}</span>
                        <span className="text-slate-900 text-base">+60 {owner.phone_no}</span>
                        <span className="text-slate-900 text-base mb-3">{owner.email ? owner.email : '-'}</span>
                        <div className="flex gap-4">
                            <button className="btn btn-sm btn-danger" onClick={handleLogout}>Logout</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="btn-tabs mb-4" data-tabs="true">
                <button
                    className={`btn ${activeTab === 'tab_1_1' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tab_1_1')}
                >
                    <i className="ki-outline ki-tablet-text-down">
                    </i>
                    <span>Quotation</span>
                </button>
                <button
                    className={`btn ${activeTab === 'tab_1_2' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tab_1_2')}
                >
                    <i className="ki-outline ki-document">
                    </i>
                    <span>Form</span>
                </button>
                <button
                    className={`btn ${activeTab === 'tab_1_3' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tab_1_3')}
                >
                    <i className="ki-outline ki-calendar-tick">
                    </i>
                    <span>Reno Progress</span>
                </button>
            </div>
            <div className={activeTab === 'tab_1_1' ? '' : 'hidden'} id="tab_1_1">
                <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-lg font-bold text-slate-900">Quotation</span>
                    </div>

                    {orders.length === 0 ? (
                        <div className="flex flex-col items-center">
                            <img alt="image" className="dark:hidden max-h-[160px] mb-12" src="/public/media/illustrations/3.svg" />
                            <img alt="image" className="light:hidden max-h-[160px] mb-12" src="/public/media/illustrations/3-dark.svg" />

                            <h2 className="text-xl font-semibold text-slate-900">There is no Quotation here</h2>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-4">
                            {orders.map((order, index) => (
                                <Link
                                    to={'/owner/order/overview/id/' + order.id}
                                    className="card w-full sm:w-[calc(50%-0.5rem)] cursor-pointer"
                                    key={index}>
                                    <div className="card-body flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="relative size-[50px] shrink-0">
                                                <svg className="w-full h-full stroke-info-clarity fill-info-light" fill="none" height="48" viewBox="0 0 44 48" width="44" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M16 2.4641C19.7128 0.320509 24.2872 0.320508 28 2.4641L37.6506 8.0359C41.3634 10.1795 43.6506 14.141 43.6506 18.4282V29.5718C43.6506 33.859 41.3634 37.8205 37.6506 39.9641L28 45.5359C24.2872 47.6795 19.7128 47.6795 16 45.5359L6.34937 39.9641C2.63655 37.8205 0.349365 33.859 0.349365 29.5718V18.4282C0.349365 14.141 2.63655 10.1795 6.34937 8.0359L16 2.4641Z" fill="#EFF6FF">
                                                    </path>
                                                    <path d="M16.25 2.89711C19.8081 0.842838 24.1919 0.842837 27.75 2.89711L37.4006 8.46891C40.9587 10.5232 43.1506 14.3196 43.1506 18.4282V29.5718C43.1506 33.6804 40.9587 37.4768 37.4006 39.5311L27.75 45.1029C24.1919 47.1572 19.8081 47.1572 16.25 45.1029L6.59937 39.5311C3.04125 37.4768 0.849365 33.6803 0.849365 29.5718V18.4282C0.849365 14.3196 3.04125 10.5232 6.59937 8.46891L16.25 2.89711Z" stroke="#1B84FF" strokeOpacity="0.2">
                                                    </path>
                                                </svg>
                                                <div className="absolute leading-none left-2/4 top-2/4 -translate-y-2/4 -translate-x-2/4">
                                                    <i className="ki-outline ki-tablet-text-down text-1.5xl ps-px text-info"></i>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <h3 className="text-gray-900 text-sm font-medium">
                                                    {order.order_no}
                                                </h3>

                                                <div className="flex flex-col">
                                                    <span className="text-xs text-gray-600">
                                                        Property Name:
                                                    </span>
                                                    <span className="text-sm text-gray-900 font-medium">
                                                        {order.property.name}
                                                    </span>
                                                </div>

                                                <div className="flex flex-col">
                                                    <span className="text-xs text-gray-600">
                                                        Unit:
                                                    </span>
                                                    <span className="text-sm text-gray-900 font-medium">
                                                        {order.block}-{order.floor}-{order.unit_no}
                                                    </span>
                                                </div>

                                                <div className="flex flex-col">
                                                    <span className="text-xs text-gray-600">
                                                        Amount:
                                                    </span>
                                                    <span className="text-sm text-gray-900 font-medium">
                                                        RM {order.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="status">
                                            <span className={`badge badge-pill badge-outline gap-1 items-center ${order.status === 'confirmed' ? 'badge-success' : ''}`}>
                                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className={activeTab === 'tab_1_2' ? '' : 'hidden'} id="tab_1_2">
                <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-lg font-bold text-slate-900">Registration Form</span>
                        <Link
                            to={'/owner/reno-registration-form'}
                            className="btn btn-sm btn-secondary"
                        >
                            Request New Registration
                        </Link>
                    </div>

                    {forms.length === 0 ? (
                        <div className="flex flex-col items-center">
                            <img alt="image" className="dark:hidden max-h-[160px] mb-12" src="/public/media/illustrations/3.svg" />
                            <img alt="image" className="light:hidden max-h-[160px] mb-12" src="/public/media/illustrations/3-dark.svg" />

                            <h2 className="text-xl font-semibold text-slate-900">There is no Reno Registration Forms here</h2>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-4">
                            {forms.map((form, index) => (
                                <Link
                                    to={'/owner/form/reno-registration-forms/' + form.id}
                                    className="card w-full sm:w-[calc(50%-0.5rem)] cursor-pointer"
                                    key={index}>
                                    <div className="card-body flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="relative size-[50px] shrink-0">
                                                <svg className="w-full h-full stroke-info-clarity fill-info-light" fill="none" height="48" viewBox="0 0 44 48" width="44" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M16 2.4641C19.7128 0.320509 24.2872 0.320508 28 2.4641L37.6506 8.0359C41.3634 10.1795 43.6506 14.141 43.6506 18.4282V29.5718C43.6506 33.859 41.3634 37.8205 37.6506 39.9641L28 45.5359C24.2872 47.6795 19.7128 47.6795 16 45.5359L6.34937 39.9641C2.63655 37.8205 0.349365 33.859 0.349365 29.5718V18.4282C0.349365 14.141 2.63655 10.1795 6.34937 8.0359L16 2.4641Z" fill="#EFF6FF">
                                                    </path>
                                                    <path d="M16.25 2.89711C19.8081 0.842838 24.1919 0.842837 27.75 2.89711L37.4006 8.46891C40.9587 10.5232 43.1506 14.3196 43.1506 18.4282V29.5718C43.1506 33.6804 40.9587 37.4768 37.4006 39.5311L27.75 45.1029C24.1919 47.1572 19.8081 47.1572 16.25 45.1029L6.59937 39.5311C3.04125 37.4768 0.849365 33.6803 0.849365 29.5718V18.4282C0.849365 14.3196 3.04125 10.5232 6.59937 8.46891L16.25 2.89711Z" stroke="#1B84FF" strokeOpacity="0.2">
                                                    </path>
                                                </svg>
                                                <div className="absolute leading-none left-2/4 top-2/4 -translate-y-2/4 -translate-x-2/4">
                                                    <i className="ki-outline ki-tablet-text-down text-1.5xl ps-px text-info"></i>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-gray-600">
                                                        Property:
                                                    </span>
                                                    {form.property ?
                                                        <span className="text-sm text-gray-900 font-medium">
                                                            {form.property.property_name} ({form.property.block}-{form.property.level}-{form.property.unit})
                                                        </span>
                                                        :
                                                        <span className="text-sm text-gray-900 font-medium">
                                                            {form.other_property.property_name} ({form.other_property.block}-{form.other_property.level}-{form.other_property.unit})
                                                        </span>
                                                    }
                                                </div>

                                                <div className="flex flex-col">
                                                    <span className="text-xs text-gray-600">
                                                        Submitted At:
                                                    </span>
                                                    <span className="text-sm text-gray-900 font-medium">
                                                        {form.created_at
                                                            ? new Date(form.created_at).toLocaleDateString('en-GB', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric'
                                                            })
                                                            : 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="status">
                                            <span className={`badge badge-pill badge-outline gap-1 items-center 
                                                ${form.status === 'approved' ? 'badge-success' : form.status === 'rejected' ? 'badge-danger' : ''}`}>
                                                {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className={activeTab === 'tab_1_3' ? '' : 'hidden'} id="tab_1_3">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-bold text-slate-900">Reno Progress</span>
                </div>

                <div className="flex flex-col items-center">
                    <img alt="image" className="dark:hidden max-h-[160px] mb-12" src="/public/media/illustrations/9.svg" />
                    <img alt="image" className="light:hidden max-h-[160px] mb-12" src="/public/media/illustrations/9.svg" />

                    <h2 className="text-xl font-semibold text-slate-900">Reno Progress Features Comming Soon</h2>
                </div>
            </div>
        </div>
    )
}

export default OwnerHome;