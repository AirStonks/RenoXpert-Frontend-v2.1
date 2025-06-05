import { Link } from "react-router-dom";

const MEDIA_URL =
    import.meta.env.VITE_APP_ENV === "local"
        ? '/public/media/'
        : '/media/';

const Showcase: React.FC = () => {
    return (
        <div className="flex justify-center w-full border-2 rounded-lg my-2">
            <div className="overflow-hidden  h-[280px] md:h-[420px] w-full max-w-md">
                <img
                    src={`${MEDIA_URL}owner-home/showcase_1.png`}
                    alt="Showcase image"
                    className="w-full h-full object-contain"
                />
            </div>
        </div>
    );
};

export default Showcase;