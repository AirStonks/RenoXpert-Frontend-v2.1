import { LogOutIcon, MailIcon, PhoneIcon, SettingsIcon, EditIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { User } from '../../../../types';
import { logoutOwner } from '../../../../services/auth';
import { toSvg } from 'jdenticon/standalone';
import { useNavigate } from 'react-router-dom';

interface Props {
    owner: User;
}

export default function ProfilePage({ owner }: Props) {
    const [size, setSize] = useState(window.innerWidth >= 768 ? 150 : 100);
    const [svgString, setSvgString] = useState('');
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleLogout = async () => {
        setIsLoggingOut(true);
        setError(null);
        try {
            await logoutOwner();
            navigate('/owner/home');
        } catch (error) {
            console.error('Logout failed:', error);
            setError('Failed to logout. Please try again.');
            setIsLoggingOut(false);
        }
    };

    const handleEditProfile = () => {
        navigate('/owner/profile/edit');
    };

    const handleSettings = () => {
        navigate('/owner/settings');
    };

    useEffect(() => {
        const handleResize = () => {
            setSize(window.innerWidth >= 768 ? 150 : window.innerWidth >= 640 ? 120 : 100);
        };

        setSvgString(toSvg(owner.name + owner.phone_no, size));

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [owner.name, owner.phone_no]);

    useEffect(() => {
        setSvgString(toSvg(owner.name + owner.phone_no, size));
    }, [size, owner.name, owner.phone_no]);

    return (
        <main className="container mx-auto px-4 py-8 max-w-3xl">
            {/* Error Toast */}
            {error && (
                <div className="fixed top-4 right-4 bg-red-500 text-white p-3 rounded-lg shadow-lg text-sm">
                    {error}
                    <button 
                        className="ml-3 text-white hover:text-red-200"
                        onClick={() => setError(null)}
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 transform transition-all hover:scale-[1.01]">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    <div className="w-24 h-24 sm:w-36 sm:h-36 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden flex-shrink-0">
                        <div
                            dangerouslySetInnerHTML={{ __html: svgString }}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="flex-grow text-center sm:text-left">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">{owner.name}</h2>
                        <div className="space-y-2">
                            <div className="flex items-center justify-center sm:justify-start text-gray-600 bg-gray-50 p-2 rounded-lg transition-colors hover:bg-gray-100">
                                <PhoneIcon className="w-4 h-4 mr-2 text-gray-500" />
                                <span className="text-xs font-medium">+{owner.country_code} {owner.phone_no}</span>
                            </div>
                            <div className="flex items-center justify-center sm:justify-start text-gray-600 bg-gray-50 p-2 rounded-lg transition-colors hover:bg-gray-100">
                                <MailIcon className="w-4 h-4 mr-2 text-gray-500" />
                                <span className="text-xs font-medium">{owner.email ? owner.email : '-'}</span>
                            </div>
                        </div>
                        {/* <button
                            onClick={handleEditProfile}
                            className="mt-3 inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                            <EditIcon className="w-3 h-3 mr-1.5" />
                            Edit Profile
                        </button> */}
                    </div>
                </div>
            </div>

            {/* Settings Button */}
            {/* <button 
                onClick={handleSettings}
                className="w-full bg-white rounded-2xl shadow-lg p-4 mb-4 flex items-center justify-between hover:bg-gray-50 transition-all hover:shadow-md"
            >
                <div className="flex items-center">
                    <SettingsIcon className="w-5 h-5 text-gray-600 mr-2" />
                    <span className="text-gray-900 font-medium text-base">Settings</span>
                </div>
                <span className="text-gray-400">→</span>
            </button> */}

            {/* Logout Button */}
            <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={`w-full rounded-2xl shadow-lg p-4 flex items-center justify-between transition-all ${
                    isLoggingOut 
                        ? 'bg-gray-100 cursor-not-allowed' 
                        : 'bg-red-50 hover:bg-red-100 hover:shadow-md'
                }`}
            >
                <div className="flex items-center">
                    <LogOutIcon className={`w-5 h-5 mr-2 ${isLoggingOut ? 'text-gray-400' : 'text-red-600'}`} />
                    <span className={`font-medium text-base ${isLoggingOut ? 'text-gray-400' : 'text-red-600'}`}>
                        {isLoggingOut ? 'Logging out...' : 'Logout'}
                    </span>
                </div>
            </button>
        </main>
    );
}