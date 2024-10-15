import { useEffect } from "react";
import { applicationUrl } from "/const.js";
import { useTranslation } from "react-i18next";


const TimeOut = ({ updatetimer }) => {
    useEffect(() => {
        updatetimer();
    })
    const BackToSP = () => {
        const { t } = useTranslation();


        return (
            <span><h4>{t('general_timeout_message')}</h4>
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