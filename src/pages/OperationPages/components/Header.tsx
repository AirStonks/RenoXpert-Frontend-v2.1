import { Link, useLocation } from "react-router-dom";

interface HeaderProps {
    title: string;
    backUrl: string;
}

function Header(props: HeaderProps) {
    const location = useLocation();

    return (
        <div className="flex w-full items-center px-2">
            <span className="flex-none">
                <Link
                    to={location.state?.from ?? props.backUrl}
                    className="ki-solid ki-arrow-left items-center">
                </Link>
            </span>
            <span className="flex-grow text-center font-bold">
                {props.title}
            </span>
        </div>
    );
}

export default Header;
