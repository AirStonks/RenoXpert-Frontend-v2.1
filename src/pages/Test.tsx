import { useEffect, useRef, useState } from "react";
import KTComponent, { KTStepper } from "../metronic/core";
import SignatureCanvas from 'react-signature-canvas';

function Test() {

    const [signature, setSignature] = useState();

    useEffect(() => {
        document.title = "Dashboard | RenoXpert";
        KTComponent.init();
    }, []);

    const handleClearSignature = (ref) => {
        signature.clear();
    }

    const handleSaveSignature = () => {
        const res = signature.getTrimmedCanvas().toDataURL('image/png');
        console.log(res);
    }

    // const handleGoTo = (step: number) => {
    //     const stepperEl = document.querySelector('#my_stepper') as HTMLElement;
    //     const stepper = KTStepper.getInstance(stepperEl);

    //     // console.log(stepper);
    //     stepper.go(step);
    // }

    return (
        <>
            <div className="flex flex-col mb-8">
                <div className="flex">
                    <SignatureCanvas
                        ref={(ref) => setSignature(ref)}
                        penColor='black'
                        canvasProps={{ width: 250, height: 120, className: 'sigCanvas border-slate-300 border-2' }}
                    />
                </div>
                <div className="flex gap-2">
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
        </>
    );
}

export default Test;