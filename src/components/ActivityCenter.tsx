
function ActivityCenter() {

    return (
        <>
            {/* <button className="btn btn-outline btn-info rounded-e-none px-3 fixed top-20 right-0 z-20" data-drawer-toggle="#drawer_6">
                <i className="ki-filled ki-message-notify"></i>
            </button>
            <div className="drawer drawer-end border-r drawer-open:shadow-2xl rounded-s-3xl flex flex-col max-w-[90%] w-[400px]"
                data-drawer="true" data-drawer-backdrop="false" id="drawer_6">
                <div className="flex items-center justify-between px-5 py-4 border-b">
                    <h3 className="text-base font-semibold text-gray-900">
                        Activity Center
                    </h3>
                    <button className="btn btn-xs btn-icon btn-light" data-drawer-dismiss="true">
                        <i className="ki-outline ki-cross">
                        </i>
                    </button>
                </div>
                <div className="px-5 scrollable-y">

                </div>
                <div className="flex p-5">
                    <input type="text" className='input' />
                </div>
            </div> */}

            <button className="btn btn-outline btn-info rounded-e-none px-3 fixed top-20 right-0 z-20" data-drawer-toggle="#drawer_4">
                <i className="ki-filled ki-message-notify"></i>
            </button>

            <div className="drawer drawer-end flex flex-col gap-4 max-w-[90%] w-[400px]" data-drawer="true" id="drawer_4">
                <div className="flex items-center justify-between p-5 border-b">
                    <h3 className="text-base font-semibold text-gray-900">
                        Drawer Title
                    </h3>
                    <button className="btn btn-xs btn-icon btn-light" data-drawer-dismiss="true">
                        <i className="ki-outline ki-cross">
                        </i>
                    </button>
                </div>
                <div className="scrollable-y h-full py-0 pl-5 pr-2 mr-3">
                    <div className="tabs mb-5" data-tabs="true">
                        <button className="tab active" data-tab-toggle="#tab_1_1">
                            Activities
                        </button>
                        <button className="tab" data-tab-toggle="#tab_1_2">
                            Comments
                        </button>
                    </div>

                    <div className="" id="tab_1_1">
                        <div className="flex flex-col">
                            <div className="flex mb-4 items-center gap-2">
                                <div className="rounded-full">
                                    <img alt="" className="size-9 rounded-full border-2 border-success shrink-0" src="/media/avatars/300-2.png" />
                                </div>
                                <div className="flex flex-col">
                                    <span className='text-slate-700 text-sm font-semibold'>Jane Doe</span>
                                    <div className="flex gap-2">
                                        <span className='text-slate-400 text-xs'>4:31 pm</span>
                                        <span className='text-slate-400 text-xs'>12 Oct</span>
                                    </div>
                                </div>
                            </div>
                            <span className='text-slate-900 text-sm mb-2'>
                                Updated package <span className='font-bold'>Kitchen</span>
                            </span>
                        </div>
                        <hr className='my-4' />
                        <div className="flex flex-col">
                            <div className="flex mb-4 items-center gap-2">
                                <div className="rounded-full">
                                    <img alt="" className="size-9 rounded-full border-2 border-success shrink-0" src="/media/avatars/300-3.png" />
                                </div>
                                <div className="flex flex-col">
                                    <span className='text-slate-700 text-sm font-semibold'>Justin Lim Wah Long</span>
                                    <div className="flex gap-2">
                                        <span className='text-slate-400 text-xs'>12:15 pm</span>
                                        <span className='text-slate-400 text-xs'>12 Oct</span>
                                    </div>
                                </div>
                            </div>
                            <span className='text-slate-900 text-sm mb-2'>
                                Created new package <span className='font-bold'>Partition Queen-Sized Bedroom</span>
                            </span>
                        </div>
                        <hr className='my-4' />
                        <div className="flex flex-col">
                            <div className="flex mb-4 items-center gap-2">
                                <div className="rounded-full">
                                    <img alt="" className="size-9 rounded-full border-2 border-success shrink-0" src="/media/avatars/300-4.png" />
                                </div>
                                <div className="flex flex-col">
                                    <span className='text-slate-700 text-sm font-semibold'>CK Chang</span>
                                    <div className="flex gap-2">
                                        <span className='text-slate-400 text-xs'>10:58 am</span>
                                        <span className='text-slate-400 text-xs'>11 Oct</span>
                                    </div>
                                </div>
                            </div>
                            <span className='text-slate-900 text-sm mb-2'>
                                Deleted package <span className='font-bold'>(Draft) Queen-Sized Bedroom</span>
                            </span>
                        </div>
                        <hr className='my-4' />
                    </div>
                    <div className="hidden" id="tab_1_2">
                        <div className="flex flex-col gap-4">

                            <div className="card w-[85%]">
                                <div className="card-body flex flex-col px-4">
                                    <div className="flex mb-2 items-center gap-2">
                                        <div className="rounded-full">
                                            <img alt="" className="size-9 rounded-full border-2 border-success shrink-0" src="/media/avatars/300-2.png" />
                                        </div>
                                        <span className='text-slate-900 text-sm font-semibold'>Jane Doe</span>
                                    </div>
                                    <span className='text-slate-900 text-sm mb-4'>
                                        Please take note that the owner have some requested to have partition room.
                                    </span>
                                    <div className="flex justify-end">
                                        <span className='text-slate-400 text-xs'>12:07 pm </span>
                                    </div>
                                </div>
                            </div>
                            <div className="card w-[85%] ml-auto bg-violet-100">
                                <div className="card-body flex flex-col px-4 justify-end">
                                    <div className="flex mb-2 items-center gap-2">
                                        <div className="rounded-full">
                                            <img alt="" className="size-9 rounded-full border-2 border-success shrink-0" src="/media/avatars/300-2.png" />
                                        </div>
                                        <span className='text-slate-900 text-sm font-semibold'>Jane Doe</span>
                                    </div>
                                    <span className='text-slate-900 text-sm mb-4'>
                                        Please take note that the owner have some requested to have partition room.
                                    </span>
                                    <div className="flex justify-end">
                                        <span className='text-slate-400 text-xs'>12:07 pm </span>
                                    </div>
                                </div>
                            </div>
                            <div className="card w-[85%]">
                                <div className="card-body flex flex-col px-4">
                                    <div className="flex mb-2 items-center gap-2">
                                        <div className="rounded-full">
                                            <img alt="" className="size-9 rounded-full border-2 border-success shrink-0" src="/media/avatars/300-2.png" />
                                        </div>
                                        <span className='text-slate-900 text-sm font-semibold'>Jane Doe</span>
                                    </div>
                                    <span className='text-slate-900 text-sm mb-4'>
                                        Please take note that the owner have some requested to have partition room.
                                    </span>
                                    <div className="flex justify-end">
                                        <span className='text-slate-400 text-xs'>12:07 pm </span>
                                    </div>
                                </div>
                            </div>
                            <div className="card w-[85%] ml-auto bg-violet-100">
                                <div className="card-body flex flex-col px-4 justify-end">
                                    <div className="flex mb-2 items-center gap-2">
                                        <div className="rounded-full">
                                            <img alt="" className="size-9 rounded-full border-2 border-success shrink-0" src="/media/avatars/300-2.png" />
                                        </div>
                                        <span className='text-slate-900 text-sm font-semibold'>Jane Doe</span>
                                    </div>
                                    <span className='text-slate-900 text-sm mb-4'>
                                        Please take note that the owner have some requested to have partition room.
                                    </span>
                                    <div className="flex justify-end">
                                        <span className='text-slate-400 text-xs'>12:07 pm </span>
                                    </div>
                                </div>
                            </div>
                            <div className="card w-[85%]">
                                <div className="card-body flex flex-col px-4">
                                    <div className="flex mb-2 items-center gap-2">
                                        <div className="rounded-full">
                                            <img alt="" className="size-9 rounded-full border-2 border-success shrink-0" src="/media/avatars/300-2.png" />
                                        </div>
                                        <span className='text-slate-900 text-sm font-semibold'>Jane Doe</span>
                                    </div>
                                    <span className='text-slate-900 text-sm mb-4'>
                                        Please take note that the owner have some requested to have partition room.
                                    </span>
                                    <div className="flex justify-end">
                                        <span className='text-slate-400 text-xs'>12:07 pm </span>
                                    </div>
                                </div>
                            </div>
                            <div className="card w-[85%] ml-auto bg-violet-100">
                                <div className="card-body flex flex-col px-4 justify-end">
                                    <div className="flex mb-2 items-center gap-2">
                                        <div className="rounded-full">
                                            <img alt="" className="size-9 rounded-full border-2 border-success shrink-0" src="/media/avatars/300-2.png" />
                                        </div>
                                        <span className='text-slate-900 text-sm font-semibold'>Jane Doe</span>
                                    </div>
                                    <span className='text-slate-900 text-sm mb-4'>
                                        Please take note that the owner have some requested to have partition room.
                                    </span>
                                    <div className="flex justify-end">
                                        <span className='text-slate-400 text-xs'>12:07 pm </span>
                                    </div>
                                </div>
                            </div>
                            <div className="card w-[85%]">
                                <div className="card-body flex flex-col px-4">
                                    <div className="flex mb-2 items-center gap-2">
                                        <div className="rounded-full">
                                            <img alt="" className="size-9 rounded-full border-2 border-success shrink-0" src="/media/avatars/300-2.png" />
                                        </div>
                                        <span className='text-slate-900 text-sm font-semibold'>Jane Doe</span>
                                    </div>
                                    <span className='text-slate-900 text-sm mb-4'>
                                        Please take note that the owner have some requested to have partition room.
                                    </span>
                                    <div className="flex justify-end">
                                        <span className='text-slate-400 text-xs'>12:07 pm </span>
                                    </div>
                                </div>
                            </div>
                            <div className="card w-[85%] ml-auto bg-violet-100">
                                <div className="card-body flex flex-col px-4 justify-end">
                                    <div className="flex mb-2 items-center gap-2">
                                        <div className="rounded-full">
                                            <img alt="" className="size-9 rounded-full border-2 border-success shrink-0" src="/media/avatars/300-2.png" />
                                        </div>
                                        <span className='text-slate-900 text-sm font-semibold'>Jane Doe</span>
                                    </div>
                                    <span className='text-slate-900 text-sm mb-4'>
                                        Please take note that the owner have some requested to have partition room.
                                    </span>
                                    <div className="flex justify-end">
                                        <span className='text-slate-400 text-xs'>12:07 pm </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-4 border-t p-5">
                    <button className="btn btn-light" data-drawer-dismiss="true">
                        Cancel
                    </button>
                    <button className="btn btn-primary">
                        Submit
                    </button>
                </div>
            </div>
        </>
    );
}

export default ActivityCenter;