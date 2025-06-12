import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircleIcon, ClockIcon, HotelIcon } from 'lucide-react';
import { RenoProgress } from '../../../../types';
import useFetchOwnerRenoProgresses from '../../../../hook/useFetchOwnerRenoProgresses';

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/owner/' : '/';

const statusColors = {
    'On Track': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'Completed': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'Handed Over': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
};

const statusIcon = {
    'On Track': ClockIcon,
    'Completed': CheckCircleIcon,
    'Handed Over': CheckCircleIcon
}

function SkeletonLoader() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array(4).fill(0).map((_, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex-shrink-0" />
                        <div className="flex-grow space-y-3">
                            <div className="h-4 bg-gray-100 rounded-md w-24" />
                            <div className="h-3 bg-gray-100 rounded-md w-32" />
                        </div>
                        <div className="w-24 h-6 bg-gray-100 rounded-full" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function RenoProgressContent({ renoProgresses, abort }: { renoProgresses: RenoProgress[]; abort: () => void }) {
    const getStatus = (progress: RenoProgress) => {
        if (progress.status === 'in_progress') return 'On Track';
        if (progress.status === 'completed') return 'Completed';
        if (progress.status === 'handed-over') return 'Handed Over';
    };

    if (renoProgresses.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                    <HotelIcon className="w-12 h-12 text-indigo-500" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No Renovation Progress</h2>
                <p className="text-gray-500 text-center">There are no renovation projects to display.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renoProgresses.map((progress) => {
                const StatusIcon = statusIcon[getStatus(progress)];

                return (
                    <Link
                        key={progress.id}
                        to={`${LOCAL_PATH_PREFIX}reno/progress/${progress.id}`}
                        state={{ fromUrl: `${LOCAL_PATH_PREFIX}reno-progress` }}
                        onClick={abort}
                        className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <HotelIcon className="w-6 h-6 text-indigo-500" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-sm font-semibold text-gray-900">
                                        {progress.property.block}-{progress.property.floor}-{progress.property.unit_no}
                                    </h3>
                                    <p className="text-sm text-gray-500">{progress.property.name}</p>
                                </div>
                            </div>
                            <div>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full ${statusColors[getStatus(progress)]}`}>
                                    <StatusIcon className="w-3.5 h-3.5" />
                                    {getStatus(progress)}
                                </span>
                            </div>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}

export default function RenoProgressPage() {
    const { renoProgresses, loading, error, abort } = useFetchOwnerRenoProgresses();

    if (error) {
        return (
            <div className="flex items-center justify-center p-6 bg-red-50 rounded-xl">
                <p className="text-red-600">{error}</p>
            </div>
        );
    }

    return (
        <main className="w-full mx-auto px-4 py-4">
            <div className="mb-4">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Renovation Progress</h1>
                <p className="text-gray-500">Track the status of your renovation projects</p>
            </div>

            {loading ? <SkeletonLoader /> : <RenoProgressContent renoProgresses={renoProgresses || []} abort={abort} />}
        </main>
    );
}