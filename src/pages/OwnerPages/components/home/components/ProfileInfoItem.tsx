import React from 'react';
import { SVGProps } from 'react'; // For Lucide React icon props

interface ProfileInfoItemProps {
    icon: React.ComponentType<SVGProps<SVGSVGElement>>; // Type for Lucide React icons
    label: string;
    value: string;
}

const ProfileInfoItem: React.FC<ProfileInfoItemProps> = ({ icon: Icon, label, value }) => {
    return (
        <div className="group flex items-center space-x-3 p-3 rounded-xl bg-white border border-gray-100 hover:bg-gray-50 transition-all duration-300">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-100 transition-colors duration-300">
                <Icon className="w-4 h-4" /> {/* Use className for size, as Lucide uses SVG props */}
            </div>
            <div className="flex-grow">
                <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                <p className="text-sm font-medium text-gray-800">{value || '-'}</p>
            </div>
        </div>
    );
};

export default ProfileInfoItem;