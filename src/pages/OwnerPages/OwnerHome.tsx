import { useEffect, useState } from "react";
import KTComponent from "../../metronic/core";
import Loading from "../../components/Loading";
import { user } from "../../services/ownerApi";
import { User } from "../../types";
import { useLocation, useNavigate } from "react-router-dom";
import useFetchOwnerRegistrationForms from "../../hook/useFetchOwnerRegistrationForms";
import { HomeBottomNav } from "./components/home-bottom-nav-bar";
import HomePage from "./components/home/HomePage";
import QuotationPage from "./components/home/QuotationPage";
import ProfilePage from "./components/home/ProfilePage";
import RenoProgressPage from "./components/home/RenoProgressPage";

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/owner/' : '/';

function OwnerHome() {
    const navigate = useNavigate();
    const location = useLocation();
    const { forms, loading: formsLoading, error: formsError } = useFetchOwnerRegistrationForms();
    const [owner, setOwner] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [userError, setUserError] = useState<string | null>(null);

    // Split 2 level for localhost
    const [activeItem, setActiveItem] = useState(window.location.hostname === 'localhost' ? (window.location.pathname.split("/")[2] || "home") : (window.location.pathname.split("/").pop() || "home"));


    useEffect(() => {
        KTComponent.init();
        loadUser();
    }, []);

    useEffect(() => {
        // Update the URL with the activeItem as a query parameter
        const searchParams = new URLSearchParams(location.search);
        searchParams.set('active', activeItem);

        // Use navigate to update the URL without triggering a route change
        navigate(LOCAL_PATH_PREFIX + activeItem);

        switch (activeItem) {
            case 'quotations':
                document.title = "Quotations | RenoXpert";
                break;
            case 'reno-progress':
                document.title = "Reno Progress | RenoXpert";
                break;
            case 'profile':
                document.title = "Profile | RenoXpert";
                break;
            default:
                document.title = "Home | RenoXpert";
                break;
        }

    }, [activeItem, navigate, location.search]);

    const loadUser = async () => {
        try {
            const response = await user();
            setOwner(response);
        } catch (error) {
            console.error(error);
            setUserError("Failed to load user data.");
        } finally {
            setLoading(false);
        }
    };

    if (formsLoading || loading) return <Loading />;
    if (formsError) return <div>Error fetching form: {formsError}</div>;
    if (userError) return <div>{userError}</div>;
    if (!owner || !forms) return <div>An unexpected error occurred</div>;

    return (
        <>
            {activeItem === "home" && <HomePage />}
            {activeItem === "quotations" && <QuotationPage />}
            {activeItem === "reno-progress" && <RenoProgressPage />}
            {activeItem === "profile" && <ProfilePage owner={owner} />}

            <HomeBottomNav
                activeItem={activeItem}
                setActiveItem={setActiveItem}
            />
        </>
    )
}

export default OwnerHome;