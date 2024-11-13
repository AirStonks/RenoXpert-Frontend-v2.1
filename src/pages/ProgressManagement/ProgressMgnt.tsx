import { useLocation, useNavigate, useParams } from "react-router-dom";
import useFetchRenoProgress from "../../hook/useFetchRenoProgress";
import Loading from "../../components/Loading";
import { useEffect, useState } from "react";
import KTComponents, { KTAccordion, KTTabs } from "../../metronic/core";
import { RenoProgress } from "../../types";
import { toggleTaskInstall, toggleTaskSupply } from "../../services/api";
import ClipboardJS from "clipboard";
import { Slide, toast } from "react-toastify";
import { Link } from "react-router-dom";

function ProgressMgnt() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { id } = useParams<{ id: string }>();
    const renoProgressId = id ? parseInt(id, 10) : null;

    const [activeTab, setActiveTab] = useState('pre_reno_tab');

    const { renoProgressDetail, loading, error } = useFetchRenoProgress(renoProgressId);
    const [renoProgress, setRenoProgress] = useState<RenoProgress | null>(null);

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
        const initFunctions = async () => {
            if (renoProgressDetail) {
                await setRenoProgress(renoProgressDetail); // Assign renoProgressDetail to renoProgress

                // handleSearchRenoProgress(renoProgressDetail.id);
            }

            await new Promise(resolve => setTimeout(resolve, 1));

            KTComponents.init();
        }

        initFunctions();

        const clipboard = new ClipboardJS('.copy-link');

        clipboard.on('success', function (e) {
            notify('success', 'Copied to clipboard!');
            e.clearSelection();
        });

        return () => {
            clipboard.destroy();
        };

    }, [renoProgressDetail]); // This effect runs when renoProgressDetail changes


    if (!renoProgressId) return null; // Early return for null orderId

    const handleBackClick = () => {
        if (state) {
            navigate(state.fromUrl);
        } else {
            navigate('/reno-progress');
        }
    };

    // const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    //     const { name, value } = e.target;
    //     setFormData((prevData) => ({
    //         ...prevData,
    //         [name]: value,
    //     }));
    // };

    const toggleProperty = async (id: number, phaseId: number, jobId: number, property: 'supply' | 'install') => {

        console.log('triggered');


        try {
            let response;
            if (property === 'supply') {
                response = await toggleTaskSupply(renoProgressId, id);
            } else {
                response = await toggleTaskInstall(renoProgressId, id);
            }

            // const response = await toggleTaskSupply(renoProgressId, id);

            if (response?.success) {
                setRenoProgress((prevData) => {
                    if (!prevData) return null;

                    // Update the state immutably
                    return {
                        ...prevData,
                        phases: prevData.phases?.map(phase => ({
                            ...phase,
                            jobs: phase.jobs?.map(job => ({
                                ...job,
                                tasks: job.tasks?.map(task => {
                                    if (Number(task.id) === id) {
                                        // Toggle the correct property (either is_supplied or is_installed)
                                        return response.data;
                                    }
                                    return task; // Return the task unchanged if it's not the one to update
                                }),
                            })),
                        })),
                    };
                });
            }

        } catch (error) {
            console.log(error);
        }
    };

    if (loading) return <Loading />;
    if (error) return <div>{error}</div>;
    if (!renoProgress) return <div>An unexpected error occured</div>;

    console.log(renoProgress);

    return (
        <>
            <div className="flex justify-between items-center flex-wrap mb-6">
                <div className="flex gap-4 items-center">
                    <button className='text-gray-800 dark:text-gray-400' onClick={handleBackClick}>
                        <i className="ki-solid ki-arrow-left"></i>
                    </button>
                    <span className="text-2xl font-bold text-gray-900">
                        Reno Progress Detail
                    </span>
                </div>
            </div>

            <div className="flex mb-6 gap-4">
                <div className="card flex-1">
                    <div className="card-header">
                        <div className="card-title">
                            Property
                        </div>
                    </div>
                    <div className="card-body">
                        {/* <table className="table-auto">
                            <tbody>
                                <tr>
                                    <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                        Property Name:
                                    </td>
                                    <td className="text-sm text-gray-900 pb-3">
                                        {orderDetail.property.name}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                        Unit:
                                    </td>
                                    <td className="text-sm text-gray-900 pb-3">
                                        {orderDetail.block}-{orderDetail.floor}-{orderDetail.unit_no}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                        Address:
                                    </td>
                                    <td className="text-sm text-gray-900 pb-3">
                                        {[
                                            orderDetail.property.address,
                                            orderDetail.property.street,
                                            orderDetail.property.postcode,
                                            orderDetail.property.city,
                                            orderDetail.property.state,
                                        ]
                                            .filter(Boolean)
                                            .join(', ')
                                        }
                                    </td>

                                </tr>
                            </tbody>
                        </table> */}
                    </div>
                </div>
                <div className="card flex-1">
                    <div className="card-header">
                        <div className="card-title">
                            {/* Payment progress and status */}
                        </div>
                    </div>
                    <div className="card-body flex flex-col">
                        <span className="font-medium">Note:</span>
                        <span className="text-sm font-medium">- After submit the form, record install/completion date</span>
                    </div>
                </div>
                <div className="card flex-1">
                    <div className="card-header">
                        <div className="card-title">
                            {/* Reno Progress Statistic */}
                        </div>
                    </div>
                    <div className="card-body">

                    </div>
                </div>
            </div>

            <div className="flex flex-col">
                <div className="text-xl font-semibold mb-2">
                    Progress Management
                </div>

                <div>
                    <div className="tabs mb-5" data-tabs="true">
                        <button
                            className={`tab ${activeTab === 'pre_reno_tab' ? 'active' : ''}`}
                            onClick={() => setActiveTab('pre_reno_tab')}
                        >
                            Pre Reno
                        </button>
                        <button
                            className={`tab ${activeTab === 'reno_tab' ? 'active' : ''}`}
                            onClick={() => setActiveTab('reno_tab')}
                        >
                            Reno
                        </button>
                        <button
                            className={`tab ${activeTab === 'post_reno_tab' ? 'active' : ''}`}
                            onClick={() => setActiveTab('post_reno_tab')}
                        >
                            Post Reno
                        </button>
                    </div>

                    <div className={activeTab === 'pre_reno_tab' ? '' : 'hidden'} id="pre_reno_tab">
                        <div className="flex flex-col gap-5" data-accordion="true">
                            {renoProgress.phases[0].jobs
                                .sort((a, b) => b.priority - a.priority) // Sort jobs by priority (higher number comes first)
                                .map((job) => (
                                    <div className="flex item-center" key={job.id}>
                                        <div className="card accordion-item border rounded-xl w-full" data-accordion-item="true" id={job.id}>
                                            <button className="accordion-toggle p-4" data-accordion-toggle={"#package_content_" + job.id}>
                                                <div className="flex flex-col items-start">
                                                    <span className="text-base text-gray-900 font-medium">
                                                        {job.name}
                                                    </span>
                                                </div>
                                                <i className="ki-outline ki-plus text-gray-600 text-2sm accordion-active:hidden block">
                                                </i>
                                                <i className="ki-outline ki-minus text-gray-600 text-2sm accordion-active:block hidden">
                                                </i>
                                            </button>
                                            <div className="accordion-content hidden border-t" id={"package_content_" + job.id}>
                                                <table className="table align-middle text-gray-700 font-medium text-sm">
                                                    <thead>
                                                        <tr>
                                                            <th className='w-[220px]'>Product</th>
                                                            <th className='w-[180px]'>Product Description</th>
                                                            <th className='w-[10px] text-center'>Supply</th>
                                                            <th className='w-[100px] text-center'>Supply Date</th>
                                                            <th className='w-[10px] text-center'>Install/Complete</th>
                                                            <th className='w-[100px] text-center'>Complete Date</th>
                                                            <th className='w-[100px] text-center'>Documents</th>
                                                            <th className='w-[130px] text-center'>Comment to Owner</th>
                                                            <th className='w-[130px] text-center'>Internal Comment</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {job.tasks.map((task, taskIndex) => (
                                                            <tr key={taskIndex}>
                                                                <td>{task.name}</td>
                                                                <td>-</td>
                                                                <td>
                                                                    <div className="flex flex-col items-center">
                                                                        <input
                                                                            className="checkbox"
                                                                            name="supply"
                                                                            type="checkbox"
                                                                            checked={!!task.is_supplied}
                                                                            onChange={() => toggleProperty(Number(task.id), Number(renoProgress.phases[0].id), Number(job.id), 'supply')}
                                                                        />
                                                                    </div>
                                                                </td>
                                                                <td>{task.supply_date
                                                                    ? new Date(task.supply_date).toLocaleDateString('en-GB', {
                                                                        day: '2-digit',
                                                                        month: 'short',
                                                                        year: 'numeric'
                                                                    })
                                                                    : ''}</td>
                                                                <td>
                                                                    <div className="flex flex-col items-center">
                                                                        {task.is_defect_form ?
                                                                            <Link
                                                                                to={`/reno-progress/${renoProgress.id}/defect-inspection-report`}
                                                                                className="btn btn-info btn-sm"
                                                                            >
                                                                                DIR Overview
                                                                            </Link>
                                                                            :
                                                                            <input
                                                                                className="checkbox"
                                                                                name="install"
                                                                                type="checkbox"
                                                                                checked={!!task.is_installed}
                                                                                onChange={() => toggleProperty(Number(task.id), Number(renoProgress.phases[0].id), Number(job.id), 'install')}
                                                                            />
                                                                        }

                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    {task.install_date
                                                                        ? new Date(task.install_date).toLocaleDateString('en-GB', {
                                                                            day: '2-digit',
                                                                            month: 'short',
                                                                            year: 'numeric'
                                                                        })
                                                                        : ''}
                                                                </td>
                                                                <td className="text-center">
                                                                    {task.is_defect_form ?
                                                                        ''
                                                                        :
                                                                        <button className="btn btn-primary btn-sm">
                                                                            Manage
                                                                        </button>
                                                                    }

                                                                </td>
                                                                <td>
                                                                    <input type="text" className="input" name="owner_comment" value={'No Comment'} readOnly />
                                                                </td>
                                                                <td>
                                                                    <input type="text" className="input" name="internal_comment" value={'Out of stock'} readOnly />
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                    <div className={activeTab === 'reno_tab' ? '' : 'hidden'} id="reno_tab">
                        <div className="flex flex-col gap-5" data-accordion="true">
                            {renoProgress.phases[1].jobs
                                .sort((a, b) => b.priority - a.priority) // Sort jobs by priority (higher number comes first)
                                .map((job) => (
                                    <div className="flex item-center" key={job.id}>
                                        <div className="card accordion-item border rounded-xl w-full" data-accordion-item="true" id={job.id}>
                                            <button className="accordion-toggle p-4" data-accordion-toggle={"#package_content_" + job.id}>
                                                <div className="flex flex-col items-start">
                                                    <span className="text-base text-gray-900 font-medium">
                                                        {job.name}
                                                    </span>
                                                </div>
                                                <i className="ki-outline ki-plus text-gray-600 text-2sm accordion-active:hidden block">
                                                </i>
                                                <i className="ki-outline ki-minus text-gray-600 text-2sm accordion-active:block hidden">
                                                </i>
                                            </button>
                                            <div className="accordion-content hidden border-t" id={"package_content_" + job.id}>
                                                <table className="table align-middle text-gray-700 font-medium text-sm">
                                                    <thead>
                                                        <tr>
                                                            <th className='w-[220px]'>Product</th>
                                                            <th className='w-[180px]'>Product Description</th>
                                                            <th className='w-[10px] text-center'>Supply</th>
                                                            <th className='w-[100px] text-center'>Supply Date</th>
                                                            <th className='w-[10px] text-center'>Install/Complete</th>
                                                            <th className='w-[100px] text-center'>Complete Date</th>
                                                            <th className='w-[100px] text-center'>Documents</th>
                                                            <th className='w-[130px] text-center'>Comment to Owner</th>
                                                            <th className='w-[130px] text-center'>Internal Comment</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {job.tasks.map((task, taskIndex) => (
                                                            <tr key={taskIndex}>
                                                                <td>{task.name}</td>
                                                                <td>-</td>
                                                                <td>
                                                                    <div className="flex flex-col items-center">
                                                                        <input
                                                                            className="checkbox"
                                                                            name="supply"
                                                                            type="checkbox"
                                                                            checked={!!task.is_supplied}
                                                                            onChange={() => toggleProperty(Number(task.id), Number(renoProgress.phases[1].id), Number(job.id), 'supply')}
                                                                        />
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    {task.supply_date
                                                                        ? new Date(task.supply_date).toLocaleDateString('en-GB', {
                                                                            day: '2-digit',
                                                                            month: 'short',
                                                                            year: 'numeric'
                                                                        })
                                                                        : ''}
                                                                </td>
                                                                <td>
                                                                    <div className="flex flex-col items-center">
                                                                        <input
                                                                            className="checkbox"
                                                                            name="install"
                                                                            type="checkbox"
                                                                            checked={!!task.is_installed}
                                                                            onChange={() => toggleProperty(Number(task.id), Number(renoProgress.phases[1].id), Number(job.id), 'install')}
                                                                        />
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    {task.install_date
                                                                        ? new Date(task.install_date).toLocaleDateString('en-GB', {
                                                                            day: '2-digit',
                                                                            month: 'short',
                                                                            year: 'numeric'
                                                                        })
                                                                        : ''}
                                                                </td>
                                                                <td className="text-center">
                                                                    <button className="btn btn-primary btn-sm">
                                                                        Manage
                                                                    </button>
                                                                </td>
                                                                <td>
                                                                    <input type="text" className="input" name="owner_comment" value={'No Comment'} readOnly />
                                                                </td>
                                                                <td>
                                                                    <input type="text" className="input" name="internal_comment" value={'Out of stock'} readOnly />
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                    <div className={activeTab === 'post_reno_tab' ? '' : 'hidden'} id="post_reno_tab">

                    </div>
                </div>
            </div>
        </>
    )
}

export default ProgressMgnt;

