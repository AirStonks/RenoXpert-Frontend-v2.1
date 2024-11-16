import { useEffect } from "react";
import KTComponent, { KTStepper } from "../metronic/core";

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
            <div>
                <div className="tabs mb-5" data-tabs="true">
                    <button className="tab active" data-tab-toggle="#tab_1_1">
                        Tab 1
                    </button>
                    <button className="tab" data-tab-toggle="#tab_1_2">
                        Tab 2
                    </button>
                    <button className="tab" data-tab-toggle="#tab_1_3">
                        Tab 3
                    </button>
                </div>
                <div className="" id="tab_1_1">
                    Tab 1 content.
                </div>
                <div className="hidden" id="tab_1_2">
                    Tab 2 content.
                </div>
                <div className="hidden" id="tab_1_3">
                    Tab 3 content.
                </div>
            </div>
        </>

    );

}

export default Test;