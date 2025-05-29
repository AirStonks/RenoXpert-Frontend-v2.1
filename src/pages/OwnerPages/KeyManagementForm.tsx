import { Link } from "react-router-dom";

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/owner/' : '/';

function KeyManagementForm() {

    return (
        <>
            <div className="flex w-full px-2">
                <div className="card flex-auto w-full max-w-4xl">
                    <div className="card-header flex justify-between">
                        <div className="flex gap-4 justify-center">
                            <Link
                                to={LOCAL_PATH_PREFIX + 'home'}
                                className="ki-solid ki-arrow-left items-center text-gray-900">
                            </Link>
                            <span className="text-lg text-gray-900 font-semibold">Key Management Form</span>
                        </div>
                    </div>
                    <div className="card-body pt-2 px-4">
                        <div className="card flex-1 sm:mb-0 mb-2 mr-2">
                            <div className="card-header">
                                <h2 className="card-title">
                                    Property
                                </h2>
                            </div>
                            <div className="card-body">
                                <div className="flex justify-between flex-wrap">
                                    <div className="flex flex-col mb-4 mr-8">
                                        <span className='text-sm text-gray-600'>Name:</span>
                                        {/* <span className='text-sm text-gray-900 font-semibold'>{orderDetail.property.name}</span> */}
                                        <span className='text-sm text-gray-900 font-semibold'>Ara Tre'</span>
                                    </div>
                                    <div className="flex flex-col mb-4">
                                        <span className='text-sm text-gray-600'>Unit:</span>
                                        {/* <span className='text-sm text-gray-900 font-semibold'>{orderDetail.block}-{orderDetail.floor}-{orderDetail.unit_no}</span> */}
                                        <span className='text-sm text-gray-900 font-semibold'>B-15-15</span>
                                    </div>
                                    <div className="">

                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <span className='text-sm text-gray-600'>Address:</span>
                                    {/* <span className='text-sm text-gray-900'>
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
                                    </span> */}
                                    <span className='text-sm text-gray-900'>Jalan PJU 1a/46, Pusat Perdagangan Dana 1, 47301, Petaling Jaya, Selangor</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default KeyManagementForm;