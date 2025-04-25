import React from 'react';
import { Link } from 'react-router-dom';

const Error404: React.FC = () => {
    return (
        <div
            className="min-h-screen w-full flex items-center justify-center bg-cover bg-center bg-no-repeat text-gray-800 text-center"
            style={{
                backgroundImage:
                    "url('/public/media/images/2600x1600/bg-2.png')",
            }}
        >
            <div className="max-w-lg mx-5">
                <img
                    src="/public/media/illustrations/15.svg"
                    alt="404 Error Illustration"
                    className="w-full max-w-[240px] mx-auto mb-4"
                />
                <h1 className="text-4xl md:text-5xl font-bold mb-2">404 - Page Not Found</h1>
                <p className="text-lg md:text-xl mb-5">
                    Sorry, the page you're looking for doesn't exist.
                </p>
                {/* <Link
                    to="/"
                    className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                    Return to Home
                </Link> */}
            </div>
        </div>
    );
};

export default Error404;