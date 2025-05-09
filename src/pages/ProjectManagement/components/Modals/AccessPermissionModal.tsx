import React, { useRef, useState } from 'react'
import { Permission, RenoProgress, User } from '../../../../types'
import Loading from '../../../../components/Loading'
import { KTDropdown } from '../../../../metronic/core'
import { addUserItemPermission, changeRenoProgressGeneralPermission, changeUserItemPermission, fetchRenoProgress, removeUserItemPermission, userIndex } from '../../../../services/api'
import { Slide, toast } from 'react-toastify'

interface Props {
    permissions: Permission[]
    setPermissions: React.Dispatch<React.SetStateAction<Permission[]>>
    renoProgress: RenoProgress
    setRenoProgress: React.Dispatch<React.SetStateAction<RenoProgress>>
    users: User[]
    setUsers: React.Dispatch<React.SetStateAction<User[]>>
}

function AccessPermissionModal({ permissions, setPermissions, renoProgress, setRenoProgress, users, setUsers }: Props) {
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const notify = (type: 'success' | 'error', message: string) => {
        (toast[type] as (message: string, options?: object) => void)(message, {
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: localStorage.getItem('theme'),
            transition: Slide,
        });
    };

    const handleRefresh = async () => {

        try {
            const response = await fetchRenoProgress(Number(renoProgress.id));

            if (response?.success) {
                setRenoProgress(response.data);
            }

        } catch (error) {
            console.log(error);
        }
    }

    const handleSearchPermissionUser = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        // Debounce logic remains the same
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        debounceTimeout.current = setTimeout(async () => {
            const dropdownEl = document.querySelector('#search_user_dropdown') as HTMLElement;
            const dropdown = KTDropdown.getInstance(dropdownEl);

            try {
                const response = await userIndex(5, 1, value);
                setUsers(response.data);

            } catch (error) {
                notify('error', error.message);
            } finally {
                dropdown.show();
            }

        }, 500);
    }

    const handleSelectPermissionUser = async (userId: number) => {

        try {
            const response = await addUserItemPermission(userId, 1, Number(renoProgress.resource_item_id));

            if (response?.success) {
                const dropdownEl = document.querySelector('#search_user_dropdown') as HTMLElement;
                const dropdown = KTDropdown.getInstance(dropdownEl);

                dropdown.hide();
                handleRefresh();

                notify('success', 'User added successfully');
            }

        } catch (error) {
            notify('error', error.response.data.message);
        }
    }

    const handleChangeGeneralPermission = async (permissionId: number) => {
        try {
            const response = await changeRenoProgressGeneralPermission(Number(renoProgress.id), permissionId);

            if (response?.success) {
                setRenoProgress(response.data);
                notify('success', 'Permission updated successfully');
            }

        } catch (error) {
            notify('error', error.response.data.message);
        }
    }

    const handleChangePermission = async (userId: number, itemId: number, permissionId: number) => {

        try {
            const response = await changeUserItemPermission(userId, itemId, permissionId);

            if (response?.success) {
                handleRefresh();
                notify('success', 'Permission updated successfully');
            }

        } catch (error) {
            notify('error', error.response.data.message);
        }
    }

    const handleRemoveUserPermission = async (userId: number, itemId: number) => {

        try {
            const response = await removeUserItemPermission(userId, itemId);

            if (response?.success) {
                handleRefresh();
                notify('success', 'Permission removed successfully');
            }

        } catch (error) {
            notify('error', error.response.data.message);
        }
    }

    return (
        <>
            {isLoading && <Loading />}

            <div className="modal p-14" data-modal="true" id="access-permission-modal">
                <div className="modal-content modal-center-y max-w-[45%] max-h-[95%] bg-white rounded-lg shadow-xl">
                    <div className="modal-header py-4 px-5 border-b border-gray-200 flex justify-between items-center">
                        <span className="text-lg text-gray-900 font-bold">Reno Progress Access Permission</span>
                        <button
                            className="btn btn-sm btn-icon btn-light btn-clear shrink-0 w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700"
                            data-modal-dismiss="true"
                        >
                            <i className="ki-filled ki-cross text-xl"></i>
                        </button>
                    </div>
                    <div className="modal-body p-8 rounded-xl overflow-y-auto scrollable-y-auto">
                        <div className="flex flex-col gap-4">
                            <h2>
                                {/* User/Roles */}
                                User
                            </h2>
                            <div className="dropdow" data-dropdown="true" data-dropdown-placement="bottom-start" data-dropdown-trigger="click" id='search_user_dropdown'>
                                <label className="dropdown-toggle input input-lg">
                                    <input
                                        // placeholder="Search for users, roles to assign permission"
                                        placeholder="Search for users to assign permission"
                                        type="text"
                                        // value={searchTerm}
                                        onChange={handleSearchPermissionUser}
                                    />
                                </label>
                                {/* <button
                                    className="dropdown-toggle btn btn-light w-full flex justify-between items-center"
                                // onClick={handleOpenPropertyDropdown}
                                >
                                    <span>Property</span>
                                    <i className="ki-filled ki-down"></i>
                                </button> */}
                                <div className="dropdown-content w-full max-w-80">
                                    <div className="menu menu-default flex flex-col w-full">
                                        <div className="menu-item">
                                            <span className="text-xs text-gray-600 pl-[19px] mb-2">Users</span>
                                        </div>
                                        {users.length > 0 ? users.map((user, index) => (
                                            <div className="menu-item" key={index} data-id={user.id}>
                                                <button
                                                    className="menu-link gap-4"
                                                    onClick={() => handleSelectPermissionUser(Number(user.id))}
                                                >
                                                    <img
                                                        alt=""
                                                        className="size-9 rounded-full border-1 border-secondary shrink-0"
                                                        src="/media/avatars/default-user.png"
                                                    />
                                                    <div className="flex flex-col items-start">
                                                        <span className="text-gray-900 text-base font-semibold">{user.name}</span>
                                                        <span className="text-gray-600 text-sm">{user.type}</span>
                                                    </div>
                                                </button>
                                            </div>
                                        ))
                                            :
                                            <div className="menu-item">
                                                <div className="flex justify-center items-center cursor-default py-4">
                                                    <span className="text-gray-600 text-sm">No user found</span>
                                                </div>
                                            </div>
                                        }
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col items-start">
                                    <span className="text-gray-900 text-base font-semibold">Owner access not supported yet.</span>
                                    <span className="text-gray-600 text-sm"></span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="relative size-[36px] shrink-0">
                                    <img
                                        alt=""
                                        className="size-9 rounded-full border-2 border-primary shrink-0"
                                        src="/media/avatars/default-user.png"
                                    />
                                </div>

                                <div className="flex flex-col items-start">
                                    <span className="text-gray-900 text-base font-semibold">Anyone</span>
                                </div>
                                <div className="ml-auto">
                                    <div className="dropdow" data-dropdown="true" data-dropdown-placement="bottom-end" data-dropdown-trigger="click" id='permission_dropdown'>
                                        <button
                                            className="dropdown-toggle btn btn-light w-full flex justify-between items-center"
                                        // onClick={handleOpenPropertyDropdown}
                                        >
                                            <span className="menu-title">
                                                {permissions.length > 0 && permissions.map((permission, index) => (
                                                    permission.id === renoProgress.permission_id && (
                                                        <span key={index} className="menu-title">{permission.permission_name}</span>
                                                    )
                                                ))}
                                            </span>
                                            <i className="ki-filled ki-down"></i>
                                        </button>
                                        <div className="dropdown-content w-full max-w-80" data-dropdown-dismiss="true">
                                            <div className="menu menu-default flex flex-col w-full">
                                                <div className="menu-item">
                                                    <span className="text-xs text-gray-600 pl-[19px] mb-2">Permission</span>
                                                </div>
                                                {permissions.length > 0 ? permissions.map((permission, index) => (
                                                    <div className="menu-item" key={index} data-id={permission.id}>
                                                        <button
                                                            className="menu-link"
                                                            onClick={() => handleChangeGeneralPermission(Number(permission.id))}
                                                        >
                                                            <span className="menu-title">{permission.permission_name}</span>
                                                        </button>
                                                    </div>
                                                ))
                                                    :
                                                    <span>Loading</span>
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {renoProgress.permissions.map((perm, index) => (
                                <div className="flex items-center gap-4" key={index}>
                                    <div className="relative size-[36px] shrink-0">
                                        <img
                                            alt=""
                                            className="size-9 rounded-full border-1 border-secondary shrink-0"
                                            src="/media/avatars/default-user.png"
                                        />
                                    </div>

                                    <div className="flex flex-col items-start">
                                        <span className="text-gray-900 text-base font-semibold">{perm.name}</span>
                                        <span className="text-gray-600 text-sm">{perm.type}</span>
                                    </div>
                                    <div className="ml-auto">
                                        <div className="dropdow" data-dropdown="true" data-dropdown-placement="bottom-end" data-dropdown-trigger="click" id='permission_dropdown'>
                                            <button
                                                className="dropdown-toggle btn btn-light w-full flex justify-between items-center"
                                            // onClick={handleOpenPropertyDropdown}
                                            >
                                                <span>
                                                    {permissions.length > 0 && permissions.map((permission, index) => (
                                                        permission.id === perm.pivot.permission_id && (
                                                            <span key={index} className="menu-title">{permission.permission_name}</span>
                                                        )
                                                    ))}
                                                </span>
                                                <i className="ki-filled ki-down"></i>
                                            </button>
                                            <div className="dropdown-content w-full max-w-80" data-dropdown-dismiss="true">
                                                <div className="menu menu-default flex flex-col w-full">
                                                    <div className="menu-item">
                                                        <span className="text-xs text-gray-600 pl-[19px] mb-2">Permission</span>
                                                    </div>
                                                    {permissions.length > 0 ? permissions
                                                        .filter(permission => {
                                                            // Check if the current user type is 'owner' and exclude permission.id === 2
                                                            const isOwner = perm.type === 'owner';
                                                            return !isOwner || (isOwner && Number(permission.id) !== 2);
                                                        })
                                                        .map((permission, index) => (
                                                            <div className="menu-item" key={index} data-id={permission.id}>
                                                                <button
                                                                    className="menu-link"
                                                                    onClick={() => handleChangePermission(Number(perm.id), Number(perm.pivot.item_id), Number(permission.id))}
                                                                >
                                                                    <span className="menu-title">{permission.permission_name}</span>
                                                                </button>
                                                            </div>
                                                        )) : (
                                                        <span>Loading</span>
                                                    )}
                                                    <div className="menu-item">
                                                        <button
                                                            className="menu-link"
                                                            onClick={() => handleRemoveUserPermission(Number(perm.id), Number(perm.pivot.item_id))}
                                                        >
                                                            <span className="text-danger text-sm font-medium">Remove</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default AccessPermissionModal