import { Link } from "react-router-dom";

function PMMain() {
    return (
        <>
            <div className="flex justify-between items-center flex-wrap mb-6">
                <div className="flex gap-4 items-center">
                    <span className="text-2xl font-bold text-gray-900">
                        Progress Management
                    </span>
                </div>
            </div>

            <Link to={'/reno-progress/1'} className="btn btn-primary">
                [TEMP] Reno Progress 1
            </Link>
        </>
    )
}

export default PMMain;