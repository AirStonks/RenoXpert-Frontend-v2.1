import { ReactNode, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import { Link } from 'react-router-dom';
import { useUser } from '../../hook/useUser';
import { generateHmac } from '../../utils/hmac';

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/owner/' : '/';

// Webwidget HMAC token - get from environment variables or use default
const WEBWIDGET_HMAC_TOKEN = import.meta.env.VITE_WEBWIDGET_HMAC_TOKEN || '<webwidget-hmac-token>';

interface MasterLayoutProps {
    children: ReactNode;
}

function OwnerMasterLayout({ children }: MasterLayoutProps) {
    const { user: owner } = useUser();

    useEffect(() => {
        // Only initialize Chatwoot when user data is available
        if (!owner) return;

        // Chatwoot integration
        const loadChatwoot = () => {
            const BASE_URL = import.meta.env.VITE_CHATWOOT_BASE_URL || "https://chat.belive.asia";

            // Check if script is already loaded
            if (document.querySelector('script[src*="sdk.js"]')) {
                return;
            }

            // Check if Chatwoot is already initialized
            if (window.chatwootSDK) {
                return;
            }

            const script = document.createElement('script');
            script.src = BASE_URL + "/packs/js/sdk.js";
            script.async = true;

            script.onload = function () {
                try {
                    if (window.chatwootSDK) {
                        // Set settings before running Chatwoot to ensure they're applied
                        window.chatwootSettings = {
                            hideMessageBubble: true, // This hides the default Chatwoot button
                            position: 'right',
                            locale: 'en',
                            type: 'expanded'
                        };

                        window.chatwootSDK.run({
                            websiteToken: import.meta.env.VITE_CHATWOOT_WEBSITE_TOKEN,
                            baseUrl: BASE_URL
                        });

                        window.addEventListener("chatwoot:ready", async function () {
                            const userData = owner || {
                                id: "testing-user-uuid",
                                name: "Test User",
                                email: "test@test.com"
                            };

                            const identifierHash = await generateHmac(userData.uuid, import.meta.env.VITE_WEBWIDGET_HMAC_TOKEN);

                            // Set chatwoot user
                            window.$chatwoot.setUser(userData.uuid || "testing-user-uuid", {
                                name: userData.name || "Test User",
                                email: userData.email || "test@test.com",
                                uuid: userData.uuid || "",
                                phone_number: "+" + userData.country_code + userData.phone_no || "",
                                avatar_url: "",
                                identifier_hash: identifierHash
                            });

                            // Set custom attributes for better user identification
                            window.$chatwoot.setCustomAttributes({
                                user_id: userData.id,
                                user_uuid: userData.uuid || "",
                                user_type: userData.type || "owner",
                                country_code: userData.country_code || "",
                                created_at: userData.created_at || "",
                            });

                            // Additional safety measure: hide any existing chat bubbles
                            const chatBubbles = document.querySelectorAll('[data-testid="chat-bubble"]');
                            chatBubbles.forEach(bubble => {
                                (bubble as HTMLElement).style.display = 'none';
                            });
                        });
                    }
                } catch (error) {
                    console.error('Error initializing Chatwoot:', error);
                }
            };

            script.onerror = function () {
                console.error('Failed to load Chatwoot SDK');
            };

            document.head.appendChild(script);
        };

        loadChatwoot();

        // Add CSS to hide Chatwoot bubble if it appears
        const style = document.createElement('style');
        style.textContent = `
            /* Hide Chatwoot bubble completely */
            [data-testid="chat-bubble"],
            .cw--bubble-button,
            .cw--widget-button,
            .chatwoot--bubble-button,
            .chatwoot--widget-button {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                pointer-events: none !important;
            }
        `;
        document.head.appendChild(style);

        // Cleanup function
        return () => {
            const script = document.querySelector('script[src*="sdk.js"]');
            if (script) {
                script.remove();
            }
            // Remove the style element
            if (style && style.parentNode) {
                style.parentNode.removeChild(style);
            }
        };
    }, [owner]);

    // Function to handle custom chat button click
    const handleChatButtonClick = () => {
        if (window.$chatwoot) {
            window.$chatwoot.toggle(); // Opens or closes the chat widget
        }
    };

    // Expose the chat handler globally so it can be used by other components
    window.handleChatwootToggle = handleChatButtonClick;


    return (
        <>
            <main className="grow items-center bg-gray-50" id="content" role="content">
                <div className="flex flex-col items-center bg-gray-50">
                    <div className="container relative flex items-center justify-center" id="content_container">
                        <div className="flex flex-col flex-wrap pt-5 pb-40 justify-center items-center w-full max-w-4xl">
                            <Link
                                to={LOCAL_PATH_PREFIX + 'home'}
                                className='mb-4 w-full px-5'
                            >
                                <img className="default-logo min-h-[22px] h-[42px] max-w-none" src="/app/RenoExpert_logo-01.svg"></img>
                            </Link>
                            {children}
                        </div>
                    </div>
                </div>



                <ToastContainer />
            </main>
        </>
    );
}

export default OwnerMasterLayout;