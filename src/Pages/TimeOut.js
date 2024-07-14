import { useEffect } from "react";
import { applicationUrl } from "../const";


const TimeOut = ({ updatetimer }) => {
    useEffect(() => {
        updatetimer();
    })
    const BackToSP = () => {

        return (
            <span><h4>Your login session has been expired</h4>
                <button className="btn btn-primary" onClick={() => window.location.assign(applicationUrl)}>
                    Back to Login
                </button>
            </span>
        );
    }

    return (
        <BackToSP />
    );
}
export default TimeOut;