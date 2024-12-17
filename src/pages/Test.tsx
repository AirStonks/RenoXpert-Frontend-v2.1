import { useEffect, useState } from "react";
import KTComponent from "../metronic/core";

interface TimelineItem {
    date: string;
    title: string;
    description: string;
    icon: JSX.Element;
}

const timelineData: TimelineItem[] = [
    {
        date: 'January 2024',
        title: 'Started learning Tailwind CSS!',
        description: 'I began my journey with Tailwind CSS and built my first responsive design.',
        icon: <i className="fa fa-check text-white"></i>,
    },
    {
        date: 'February 2024',
        title: 'Built my first project with Tailwind CSS.',
        description: 'I built a simple landing page using only Tailwind CSS.',
        icon: <i className="fa fa-laptop text-white"></i>,
    },
    {
        date: 'March 2024',
        title: 'Created a portfolio website using Tailwind CSS.',
        description: 'I created my personal portfolio to showcase my projects.',
        icon: <i className="fa fa-rocket text-white"></i>,
    },
];


function Test() {
    return (
        <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-24">
            <div className="flex flex-col justify-center divide-y divide-slate-200 [&>*]:py-16">

                {/* Timeline 1 */}
                <div className="w-full max-w-3xl mx-auto">
                    <div className="-my-6">
                        {/** Item #1 */}
                        <div className="relative pl-8 sm:pl-32 py-6 group">
                            <div className="font-caveat font-medium text-2xl text-indigo-500 mb-1 sm:mb-0">The origin</div>
                            <div className="flex flex-col sm:flex-row items-start mb-1 group-last:before:hidden before:absolute before:left-2 sm:before:left-0 before:h-full before:px-px before:bg-slate-300 sm:before:ml-[6.5rem] before:self-start before:-translate-x-1/2 before:translate-y-3 after:absolute after:left-2 sm:after:left-0 after:w-2 after:h-2 after:bg-indigo-600 after:border-4 after:box-content after:border-slate-50 after:rounded-full sm:after:ml-[6.5rem] after:-translate-x-1/2 after:translate-y-1.5">
                                <time className="sm:absolute left-0 translate-y-0.5 inline-flex items-center justify-center text-xs font-semibold uppercase w-20 h-6 mb-3 sm:mb-0 text-emerald-600 bg-emerald-100 rounded-full">May, 2020</time>
                                <div className="text-xl font-bold text-slate-900">Acme was founded in Milan, Italy</div>
                            </div>
                            <div className="text-slate-500">Pretium lectus quam id leo. Urna et pharetra pharetra massa massa. Adipiscing enim eu neque aliquam vestibulum morbi blandit cursus risus.</div>
                        </div>
                        {/** More items go here */}
                        <div className="relative pl-8 sm:pl-32 py-6 group">
                            <div className="font-caveat font-medium text-2xl text-indigo-500 mb-1 sm:mb-0">The origin</div>
                            <div className="flex flex-col sm:flex-row items-start mb-1 group-last:before:hidden before:absolute before:left-2 sm:before:left-0 before:h-full before:px-px before:bg-slate-300 sm:before:ml-[6.5rem] before:self-start before:-translate-x-1/2 before:translate-y-3 after:absolute after:left-2 sm:after:left-0 after:w-2 after:h-2 after:bg-indigo-600 after:border-4 after:box-content after:border-slate-50 after:rounded-full sm:after:ml-[6.5rem] after:-translate-x-1/2 after:translate-y-1.5">
                                <time className="sm:absolute left-0 translate-y-0.5 inline-flex items-center justify-center text-xs font-semibold uppercase w-20 h-6 mb-3 sm:mb-0 text-emerald-600 bg-emerald-100 rounded-full">May, 2020</time>
                                <div className="text-xl font-bold text-slate-900">Acme was founded in Milan, Italy</div>
                            </div>
                            <div className="text-slate-500">Pretium lectus quam id leo. Urna et pharetra pharetra massa massa. Adipiscing enim eu neque aliquam vestibulum morbi blandit cursus risus.</div>
                        </div>
                    </div>
                </div>

                {/* Timeline 2 */}
                <div className="w-full max-w-3xl mx-auto">
                    <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                        {/** Item #1 */}
                        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-emerald-500 text-slate-500 group-[.is-active]:text-emerald-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                <svg className="fill-current" xmlns="http://www.w3.org/2000/svg" width="12" height="10">
                                    <path fillRule="nonzero" d="M10.422 1.257 4.655 7.025 2.553 4.923A.916.916 0 0 0 1.257 6.22l2.75 2.75a.916.916 0 0 0 1.296 0l6.415-6.416a.916.916 0 0 0-1.296-1.296Z" />
                                </svg>
                            </div>
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded border border-slate-200 shadow">
                                <div className="flex items-center justify-between space-x-2 mb-1">
                                    <div className="font-bold text-slate-900">Order Placed</div>
                                    <time className="font-caveat font-medium text-indigo-500">08/06/2023</time>
                                </div>
                                <div className="text-slate-500">Pretium lectus quam id leo. Urna et pharetra aliquam vestibulum morbi blandit cursus risus.</div>
                            </div>
                        </div>
                        {/** More items go here */}
                        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-emerald-500 text-slate-500 group-[.is-active]:text-emerald-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                <svg className="fill-current" xmlns="http://www.w3.org/2000/svg" width="12" height="10">
                                    <path fillRule="nonzero" d="M10.422 1.257 4.655 7.025 2.553 4.923A.916.916 0 0 0 1.257 6.22l2.75 2.75a.916.916 0 0 0 1.296 0l6.415-6.416a.916.916 0 0 0-1.296-1.296Z" />
                                </svg>
                            </div>
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded border border-slate-200 shadow">
                                <div className="flex items-center justify-between space-x-2 mb-1">
                                    <div className="font-bold text-slate-900">Order Placed</div>
                                    <time className="font-caveat font-medium text-indigo-500">08/06/2023</time>
                                </div>
                                <div className="text-slate-500">Pretium lectus quam id leo. Urna et pharetra aliquam vestibulum morbi blandit cursus risus.</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Timeline 3 */}
                <div className="w-full max-w-3xl mx-auto">
                    <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:ml-[8.75rem] md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                        {/** Item #1 */}
                        <div className="relative">
                            <div className="md:flex items-center md:space-x-4 mb-3">
                                <div className="flex items-center space-x-4 md:space-x-2 md:space-x-reverse">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow md:order-1">
                                        <svg className="fill-emerald-500" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
                                            <path d="M8 0a8 8 0 1 0 8 8 8.009 8.009 0 0 0-8-8Zm0 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z" />
                                        </svg>
                                    </div>
                                    <time className="font-caveat font-medium text-xl text-indigo-500 md:w-28">Apr 7, 2024</time>
                                </div>
                                <div className="text-slate-500 ml-14"><span className="text-slate-900 font-bold">Mark Mikrol</span> opened the request</div>
                            </div>
                            <div className="bg-white p-4 rounded border border-slate-200 text-slate-500 shadow ml-14 md:ml-44">Various versions have evolved over the years, sometimes by accident, sometimes on purpose injected humour and the like.</div>
                        </div>
                        {/** More items go here */}
                        <div className="relative">
                            <div className="md:flex items-center md:space-x-4 mb-3">
                                <div className="flex items-center space-x-4 md:space-x-2 md:space-x-reverse">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow md:order-1">
                                        <svg className="fill-emerald-500" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
                                            <path d="M8 0a8 8 0 1 0 8 8 8.009 8.009 0 0 0-8-8Zm0 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z" />
                                        </svg>
                                    </div>
                                    <time className="font-caveat font-medium text-xl text-indigo-500 md:w-28">Apr 7, 2024</time>
                                </div>
                                <div className="text-slate-500 ml-14"><span className="text-slate-900 font-bold">Mark Mikrol</span> opened the request</div>
                            </div>
                            <div className="bg-white p-4 rounded border border-slate-200 text-slate-500 shadow ml-14 md:ml-44">Various versions have evolved over the years, sometimes by accident, sometimes on purpose injected humour and the like.</div>
                        </div>
                    </div>
                </div>

            </div>
        </div>

    );
}

export default Test;