import { useEffect, useRef } from "react";
import KTComponent, { KTStepper } from "../metronic/core";
import SignatureCanvas from 'react-signature-canvas';

function Test() {

    useEffect(() => {
        KTComponent.init();
    });

    // const handleGoTo = (step: number) => {
    //     const stepperEl = document.querySelector('#my_stepper') as HTMLElement;
    //     const stepper = KTStepper.getInstance(stepperEl);

    //     // console.log(stepper);
    //     stepper.go(step);
    // }

    return (
        <>
            <div className="flex w-96">
                
            </div>
        </>
    );
}

export default Test;