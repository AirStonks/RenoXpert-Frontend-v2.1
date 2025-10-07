// src/components/StaffRestrictedRoute.tsx

import React from 'react';
import { useUser } from '../context/UserContext';
import { isStaffUser } from '../utils/userPermissions';

const LOCAL_PATH_PREFIX = window.location.hostname === "localhost" ? "/staff/" : "/"

interface StaffRestrictedRouteProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

const StaffRestrictedRoute: React.FC<StaffRestrictedRouteProps> = ({ 
    children, 
    fallback = (
        <div className="d-flex flex-column flex-center flex-column-fluid">
            <div className="d-flex flex-column flex-center text-center p-10">
                <div className="card card-flush w-lg-650px py-5">
                    <div className="card-body py-15 py-lg-20">
                        <div className="mb-13">
                            <i className="ki-duotone ki-shield-cross fs-3x text-warning mb-5">
                                <span className="path1"></span>
                                <span className="path2"></span>
                                <span className="path3"></span>
                            </i>
                        </div>
                        <div className="mb-11">
                            <h1 className="fw-bold text-gray-900 mb-3">Access Restricted</h1>
                            <div className="text-gray-500 fw-semibold fs-6">
                                You don't have permission to access this module.
                            </div>
                        </div>
                        <div className="mb-0">
                            <a href={LOCAL_PATH_PREFIX} className="btn btn-primary">
                                <i className="ki-duotone ki-home fs-2">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                Return to Dashboard
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}) => {
    const { currentUser } = useUser();

    if (isStaffUser(currentUser)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};

export default StaffRestrictedRoute;
