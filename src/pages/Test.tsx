// import { useEffect, useRef, useState } from "react";
// import KTComponent, { KTStepper } from "../metronic/core";
// import SignatureCanvas from 'react-signature-canvas';
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

    // const [signature, setSignature] = useState();

    // useEffect(() => {
    //     document.title = "Dashboard | RenoXpert";
    //     KTComponent.init();
    // }, []);

    // const handleClearSignature = (ref) => {
    //     signature.clear();
    // }

    // const handleSaveSignature = () => {
    //     const res = signature.getTrimmedCanvas().toDataURL('image/png');
    //     console.log(res);
    // }

    // const handleGoTo = (step: number) => {
    //     const stepperEl = document.querySelector('#my_stepper') as HTMLElement;
    //     const stepper = KTStepper.getInstance(stepperEl);

    //     // console.log(stepper);
    //     stepper.go(step);
    // }

    return (
        <>
            {/* <div className="card">
                <div className="card-body flex flex-col items-center gap-2.5 py-7.5">
                    <div className="flex">
                        <div className="flex border">
                            <SignatureCanvas
                                ref={(ref) => setSignature(ref)}
                                penColor='green'
                                canvasProps={{ width: 200, height: 120, className: 'sigCanvas' }} />
                        </div>
                        <div className="flex">
                            <button
                                className="btn btn-primary"
                                onClick={handleClearSignature}
                            >
                                Clear
                            </button>
                            <button
                                className="btn btn-success"
                                onClick={handleSaveSignature}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            </div> */}
        </>
    );
}

export default Test;