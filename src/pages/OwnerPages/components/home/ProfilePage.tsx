import React, { useState } from 'react';
import {
    LogOutIcon,
    MailIcon,
    PhoneIcon,
    SettingsIcon,
    EditIcon,
    UserIcon
} from 'lucide-react';

// Components
import { User } from '../../../../types';
import ErrorToast from './components/ErrorToast';
import ProfileAvatar from './components/ProfileAvatar';
import ActionButton from './components/ActionButton';
import ProfileInfoItem from './components/ProfileInfoItem';
import MenuCard from './components/MenuCard';
import { logoutOwner } from '../../../../services/auth';
import { useNavigate } from 'react-router-dom';

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/owner/' : '/';

interface ProfilePageProps {
    owner: User;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ owner }) => {
    const navigate = useNavigate();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        setError(null);
        try {
            // window.$chatwoot.reset();
            await logoutOwner();
            navigate(LOCAL_PATH_PREFIX + 'login')
        } catch (error) {
            console.error('Logout failed:', error);
            setError('Failed to logout. Please try again.');
            setIsLoggingOut(false);
        }
    };

    const handleEditProfile = () => {
        // Navigation removed temporarily
        console.log('Edit profile clicked');
    };

    const handleSettings = () => {
        // Navigation removed temporarily
        console.log('Settings clicked');
    };

    return (
        <main className="w-full mx-auto px-4 py-8">
            {error && (
                <ErrorToast
                    message={error}
                    onClose={() => setError(null)}
                />
            )}

            {/* Profile Header */}
            {/* <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile</h1>
                <p className="text-gray-500">Manage your personal information and account settings</p>
            </div> */}

            {/* Profile Card */}
            <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    {/* Avatar */}
                    <ProfileAvatar user={owner} size="lg" />

                    {/* User Info */}
                    <div className="flex-grow text-center sm:text-left">
                        <h2 className="text-xl font-bold text-gray-900 mb-1">
                            {owner.name_preferred ? owner.name_preferred : owner.name}
                        </h2>
                        <p className="text-sm text-gray-500 mb-4">Account Owner</p>

                        {/* Edit Profile Button */}
                        {/* <ActionButton
                            icon={EditIcon}
                            label="Edit Profile"
                            onClick={handleEditProfile}
                            variant="primary"
                        /> */}
                    </div>
                </div>
            </div>

            {/* Contact Information */}
            <div className="mb-8">
                <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">
                    Contact Information
                </h3>
                <div className="space-y-3">
                    <ProfileInfoItem
                        icon={UserIcon}
                        label="Full Name"
                        value={owner.name ? owner.name : `${owner.name_first} ${owner.name_last}`}
                    />
                    <ProfileInfoItem
                        icon={PhoneIcon}
                        label="Phone Number"
                        value={`+${owner.country_code} ${owner.phone_no}`}
                    />
                    <ProfileInfoItem
                        icon={MailIcon}
                        label="Email Address"
                        value={owner.email || ''}
                    />
                </div>
            </div>

            {/* Account Actions */}
            <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">
                    Account Actions
                </h3>

                {/* Settings Button */}
                {/* <MenuCard
                    icon={SettingsIcon}
                    label="Settings"
                    onClick={handleSettings}
                /> */}

                {/* Logout Button */}
                <div className="mt-4">
                    <ActionButton
                        icon={LogOutIcon}
                        label="Logout"
                        onClick={handleLogout}
                        variant="danger"
                        isLoading={isLoggingOut}
                        fullWidth
                    />
                </div>
            </div>

            <div className="flex flex-col gap-1 text-center">
                {/* <span className='text-gray-500 text-sm'>Version: {'0.1.5'}</span> */}
                <span className='text-gray-500 text-xs'>We are still improving our system to enhance your experience.
                    <p className='mb-2'>If you have any feedback suggestions or bugs encountered, please don't hesitate to contact us:</p>
                    <a href="mailto:itsupport@renoxpert.my" className='underline'>itsupport@renoxpert.my</a>
                </span>
            </div>
        </main>
    );
};

export default ProfilePage;