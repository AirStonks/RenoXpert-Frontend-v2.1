// import { useEffect, useRef, useState } from "react";
// import KTComponent, { KTStepper } from "../metronic/core";
// import SignatureCanvas from 'react-signature-canvas';

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