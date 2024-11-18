// src\pages\User\UsersMain.tsx

import { Link } from "react-router-dom";
import UserTable from "../../components/Tables/UserTable";
import { useEffect } from "react";

function UsersMain() {

    useEffect(() => {
        document.title = "Users | RenoXpert";
    }, []);

    return (
        <>
            <div className="flex justify-between items-center flex-wrap mb-6">
                <div className="flex gap-4 items-center">
                    <span className="text-2xl font-bold text-gray-900">
                        User Overview
                    </span>
                </div>
                <Link
                    to={'/users/add'}
                    className="btn btn-info btn-sm"
                >
                    Add User
                </Link>
            </div>


            <UserTable />
        </>
    );
}

export default UsersMain;