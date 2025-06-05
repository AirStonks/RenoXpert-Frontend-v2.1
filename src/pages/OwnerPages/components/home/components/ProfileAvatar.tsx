import React, { useEffect, useState } from 'react';
import { User } from '../../../../../types';

interface ProfileAvatarProps {
    user: User;
    size?: 'sm' | 'md' | 'lg';
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ user, size = 'md' }) => {
    const [svgString, setSvgString] = useState<string>('');

    // Determine the pixel size based on the size prop
    const getPixelSize = (): number => {
        switch (size) {
            case 'sm': return 64;
            case 'lg': return 128;
            case 'md':
            default: return 96;
        }
    };

    useEffect(() => {
        // Import jdenticon dynamically to avoid server-side rendering issues
        const loadJdenticon = async () => {
            try {
                const jdenticon = await import('jdenticon/standalone');
                setSvgString(jdenticon.toSvg(user.name + user.phone_no, getPixelSize()));
            } catch (error) {
                console.error('Failed to load jdenticon:', error);
            }
        };

        loadJdenticon();
    }, [user.name, user.phone_no, size]);

    const sizeClasses = {
        sm: 'w-16 h-16',
        md: 'w-24 h-24',
        lg: 'w-32 h-32'
    };

    return (
        <div className={`${sizeClasses[size]} overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 shadow-sm transition-all duration-300 hover:shadow-md`}>
            {svgString && (
                <div
                    dangerouslySetInnerHTML={{ __html: svgString }}
                    className="w-full h-full object-cover"
                />
            )}
        </div>
    );
};

export default ProfileAvatar;