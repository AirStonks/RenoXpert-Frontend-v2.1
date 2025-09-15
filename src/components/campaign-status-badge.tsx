import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';

interface CampaignStatusBadgeProps {
    status?: string;
    showIcon?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export default function CampaignStatusBadge({ 
    status, 
    showIcon = true, 
    size = 'md' 
}: CampaignStatusBadgeProps) {
    const getStatusConfig = (status?: string) => {
        switch (status?.toLowerCase()) {
            case 'active':
                return {
                    class: 'badge-light-success',
                    icon: <CheckCircle className="fs-6" />,
                    text: 'Active'
                };
            case 'inactive':
                return {
                    class: 'badge-light-danger',
                    icon: <XCircle className="fs-6" />,
                    text: 'Inactive'
                };
            case 'draft':
                return {
                    class: 'badge-light-warning',
                    icon: <AlertCircle className="fs-6" />,
                    text: 'Draft'
                };
            case 'completed':
                return {
                    class: 'badge-light-info',
                    icon: <CheckCircle className="fs-6" />,
                    text: 'Completed'
                };
            case 'pending':
                return {
                    class: 'badge-light-secondary',
                    icon: <Clock className="fs-6" />,
                    text: 'Pending'
                };
            default:
                return {
                    class: 'badge-light-secondary',
                    icon: <AlertCircle className="fs-6" />,
                    text: 'Unknown'
                };
        }
    };

    const getSizeClass = (size: string) => {
        switch (size) {
            case 'sm':
                return 'fs-8';
            case 'lg':
                return 'fs-6';
            default:
                return 'fs-7';
        }
    };

    const config = getStatusConfig(status);
    const sizeClass = getSizeClass(size);

    return (
        <span className={`badge ${config.class} ${sizeClass} fw-bold d-flex align-items-center`}>
            {showIcon && <span className="me-1">{config.icon}</span>}
            {config.text}
        </span>
    );
}
