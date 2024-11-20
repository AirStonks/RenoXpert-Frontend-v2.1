import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import useFetchUser from "../../hook/useFetchUser";
import Loading from "../../components/Loading";
import { Link } from "react-router-dom";
import { KTModal } from "../../metronic/core";
import ClipboardJS from "clipboard";
import { resetUserPassword } from "../../services/api";
import { Slide, toast } from "react-toastify";

function UserDetail() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { id } = useParams<{ id: string }>();
    const userId = id ? parseInt(id, 10) : null;

    const { userDetail, loading, error } = useFetchUser(userId);

    const [newPassword, setNewPassword] = useState('');

    const handleBackClick = () => {
        if (state) {
            navigate(state.fromUrl);
        } else {
            navigate('/users');
        }
    };

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

    useEffect(() => {
        document.title = 'User Detail | RenoXpert';
    }, []);

    const handleResetPassword = async () => {
        try {
            const response = await resetUserPassword(userId);

            if (response?.success) {
                setNewPassword(response.data.new_password);
                notify('success', 'Password reset successfully!');

                const clipboard = new ClipboardJS('.copy-link');

                clipboard.on('success', function (e) {
                    notify('success', 'Copied to clipboard!');
                    e.clearSelection();
                });

                return () => {
                    clipboard.destroy();
                };
            }

        } catch (error) {
            console.error(error);
        }
    }


    if (userDetail) {
        const modalEl = document.querySelector('#reset_password_modal') as HTMLElement;
        const modal = KTModal.getInstance(modalEl);
        console.log(modal);
    }

    return (
        <>
            {/* Loading Overlay */}
            {loading && <Loading />}

            <div className="flex justify-between items-center flex-wrap mb-6">
                <div className="flex gap-4 items-center">
                    <button className='text-gray-800 dark:text-gray-400' onClick={handleBackClick}>
                        <i className="ki-solid ki-arrow-left"></i>
                    </button>
                    <span className="text-2xl font-bold text-gray-900">
                        User Detail
                    </span>
                </div>
                {userDetail && userDetail.status !== 'deactivated' && (
                    <div className="flex gap-2">
                        <Link
                            to={''}
                            className="btn btn-primary btn-sm"
                        >
                            Update Information
                        </Link>

                        <button
                            className="btn btn-info btn-sm"
                            data-modal-toggle="#reset_password_modal"
                        >
                            Reset Password
                        </button>
                    </div>
                )}
            </div>

            {userDetail && (
                <div className="card w-full flex justify-center items-center">
                    <div className="card-body py-6 flex flex-col items-center max-w-3xl w-full">
                        <div className="flex mb-4 w-full">
                            <span className="text-xl font-bold">User Detail</span>
                        </div>
                        <div className="flex mb-4 gap-4 w-full">
                            <div className="flex flex-col w-full">
                                <span className="font-bold">First Name</span>
                                <span>{userDetail.name_first}</span>
                            </div>
                            <div className="flex flex-col w-full">
                                <span className="font-bold">First Name</span>
                                <span>{userDetail.name_last}</span>
                            </div>
                        </div>
                        <div className="flex flex-col mb-4 w-full">
                            <span className="font-bold">Email</span>
                            <span>{userDetail.email}</span>
                        </div>
                        <div className="flex flex-col mb-4 w-full">
                            <span className="font-bold">Phone No.</span>
                            <span>+60 {userDetail.phone_no}</span>
                        </div>
                        <div className="flex flex-col mb-4 w-full">
                            <span className="font-bold">Status.</span>
                            <span className="">{userDetail.status.charAt(0).toUpperCase() + userDetail.status.slice(1)}</span>
                        </div>
                        <div className="flex flex-col w-full">
                            <span className="font-bold">User Type/Role</span>
                            <span>{userDetail.type.charAt(0).toUpperCase() + userDetail.type.slice(1)}</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="modal" data-modal="true" id="reset_password_modal">
                <div className="modal-content max-w-[600px] top-[20%]">
                    <div className="modal-header">
                        <h3 className="modal-title">
                            Reset Password
                        </h3>
                        <button className="btn btn-xs btn-icon btn-light" data-modal-dismiss="true">
                            <i className="ki-outline ki-cross">
                            </i>
                        </button>
                    </div>
                    <div className="modal-body">
                        <div className="flex flex-col justify-center items-center">
                            <span className="my-2 font-semibold">Click the below button to reset the password</span>
                            <div className="flex my-4">
                                <button
                                    className="btn btn-info"
                                    onClick={handleResetPassword}
                                >
                                    Confirm Reset Password
                                </button>
                            </div>
                            {newPassword &&
                                <>
                                    <span className="font-medium mt-4">
                                        New Password
                                    </span>
                                    <div className="flex items-center mt-1 mb-4">
                                        <span className="input">
                                            {newPassword}
                                        </span>
                                        <button
                                            className="btn btn-sm btn-icon copy-link flex justify-center gap-2"
                                            data-clipboard-text={newPassword}
                                        >
                                            <i className="ki-filled ki-copy"></i>
                                        </button>
                                    </div>
                                </>
                            }
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default UserDetail;