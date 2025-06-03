import React from 'react';
import useFetchOwnerRenoProgresses from '../../../../hook/useFetchOwnerRenoProgresses';
import { Link } from 'react-router-dom';
import { RenoProgress } from '../../../../types';
import { HotelIcon } from 'lucide-react';

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/owner/' : '/';

const MEDIA_URL =
    import.meta.env.VITE_APP_ENV === "local"
        ? '/public/media/'
        : '/media/';

const getStatusColor = (status: string) => {
    switch (status) {
        case "completed":
            return "bg-green-100 text-green-800 hover:bg-green-200";
        case "in-progress":
            return "bg-blue-100 text-blue-800 hover:bg-blue-200";
        case "pending-installation":
            return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
        case "not-applicable":
            return "bg-gray-100 text-gray-800 hover:bg-gray-200";
        case "not-available":
            return "bg-slate-100 text-slate-800 hover:bg-slate-200";
        case "procurement-done":
            return "bg-purple-100 text-purple-800 hover:bg-purple-200";
        case "pending-stocks":
            return "bg-orange-100 text-orange-800 hover:bg-orange-200";
        case "delivered":
            return "bg-teal-100 text-teal-800 hover:bg-teal-200";
        case "to-rectified":
            return "bg-indigo-100 text-indigo-800 hover:bg-indigo-200";
        case "rejected":
            return "bg-red-100 text-red-800 hover:bg-red-200";
        default:
            return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
};

const getStatusTextColor = (status: string) => {
    switch (status) {
        case "completed":
            return "text-green-800";
        case "in-progress":
            return "text-blue-800";
        case "pending-installation":
            return "text-yellow-800";
        case "not-applicable":
            return "text-gray-800";
        case "not-available":
            return "text-slate-800";
        case "procurement-done":
            return "text-purple-800";
        case "pending-stocks":
            return "text-orange-800";
        case "delivered":
            return "text-teal-800";
        case "to-rectified":
            return "text-indigo-800";
        case "rejected":
            return "text-red-800";
        default:
            return "text-gray-800";
    }
};

const getStatusIcon = (status: string) => {
    switch (status) {
        case "completed":
            return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
        case "in-progress":
            return <ClockIcon className="h-4 w-4 text-blue-600" />;
        case "pending-installation":
            return <ClockIcon className="h-4 w-4 text-yellow-600" />;
        case "not-applicable":
            return <HelpCircleIcon className="h-4 w-4 text-gray-600" />;
        case "not-available":
            return <XCircleIcon className="h-4 w-4 text-slate-600" />;
        case "procurement-done":
            return <CheckCircleIcon className="h-4 w-4 text-purple-600" />;
        case "pending-stocks":
            return <AlertCircleIcon className="h-4 w-4 text-orange-600" />;
        case "delivered":
            return <CheckCircleIcon className="h-4 w-4 text-teal-600" />;
        case "to-rectified":
            return <AlertCircleIcon className="h-4 w-4 text-indigo-600" />;
        case "rejected":
            return <XCircleIcon className="h-4 w-4 text-red-600" />;
        default:
            return null;
    }
};

const getStatusKey = (status: string | undefined) => {
    if (!status) return 'Not Available';
    switch (status.toLowerCase()) {
        case 'not-applicable':
            return 'Not Applicable';
        case 'procurement-done':
            return 'Procurement Done';
        case 'pending-stocks':
            return 'Pending Stocks';
        case 'delivered':
            return 'Delivered';
        case 'pending-installation':
            return 'Pending Installation';
        case 'in-progress':
            return 'In Progress';
        case 'completed':
            return 'Completed';
        case 'to-rectified':
            return 'To Rectified';
        case 'rejected':
            return 'Rejected';
        default:
            return 'Not Available';
    }
};

function SkeletonLoader() {
    return (
        <div className="flex flex-wrap gap-4">
            {Array(5).fill(0).map((_, index) => (
                <div key={index} className="card w-full sm:w-[calc(50%-0.5rem)] animate-pulse mx-4">
                    <div className="card-body flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="relative size-[50px] shrink-0 bg-gray-200 rounded-full"></div>
                            <div className="flex flex-col gap-1 w-full">
                                <div className="h-4 bg-gray-200 rounded w-24"></div>
                                <div className="h-4 bg-gray-200 rounded w-32"></div>
                            </div>
                        </div>
                        <div className="status">
                            <div className="h-6 bg-gray-200 rounded-full w-24"></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function RenoProgressContent({ renoProgresses, abort }: { renoProgresses: RenoProgress[], abort: () => void }) {
    return (
        renoProgresses.length === 0 ? (
            <div className="flex flex-col items-center">
                <img alt="image" className="dark:hidden max-h-[160px] mb-12" src={`${MEDIA_URL}illustrations/3.svg`} />
                <img alt="image" className="light:hidden max-h-[160px] mb-12" src={`${MEDIA_URL}illustrations/3-dark.svg`} />
                <h2 className="text-xl font-semibold text-gray-900">There is no Reno Progress here</h2>
            </div>
        ) : (
            <div className="flex flex-wrap gap-4">
                {renoProgresses.map((progress, index) => (
                    <Link
                        to={LOCAL_PATH_PREFIX + 'reno/progress/' + progress.id}
                        state={{ fromUrl: LOCAL_PATH_PREFIX + 'reno-progress' }}
                        className="card w-full sm:w-[calc(50%-0.5rem)] cursor-pointer mx-4"
                        key={index}
                        onClick={abort}
                    >
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
                                        <HotelIcon className="w-6 h-6 text-info" />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <h3 className="text-gray-900 text-sm font-medium">
                                        {progress.property.block}-{progress.property.floor}-{progress.property.unit_no}
                                    </h3>
                                    <div className="flex">
                                        <span>{progress.property.name}</span>
                                    </div>
                                </div>
                            </div>
                            <div className={`${getStatusColor(progress.status)} badge badge-xs badge-pill space-x-1`}>
                                <span>{getStatusIcon(progress.status)}</span>
                                <span>{getStatusKey(progress.status)}</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        )
    );
}

export default function RenoProgressPage() {
    const { renoProgresses, loading, error, abort } = useFetchOwnerRenoProgresses();

    if (error) return <div>{error}</div>;

    return (
        <div className="flex flex-col w-full">
            <div className="flex justify-center items-center mb-4">
                <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">Reno Progress</h1>
            </div>

            {loading ? <SkeletonLoader /> : <RenoProgressContent renoProgresses={renoProgresses || []} abort={abort} />}
        </div>
    );
}