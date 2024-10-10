import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { Button, Spinner } from 'reactstrap';
import InfoMsg from '../Components/InfoMsg';

import { apiUrl, applicationUrl } from '../const';
import { useFeConfigs } from '../DataProviders/FeConfigProvider';
import { getApti } from '../Components/utils';
import { useTranslation } from 'react-i18next';

const OTPMethods = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const config = useFeConfigs();

    const [data, setData] = useState(null);
    const [showOTP, setShowOTP] = useState(false);
    const [msg, setMsg] = useState(location.state?.msg);
    const [isLoading, setLoading] = useState(false);

    const { t} = useTranslation();

    const email = location.state?.email;
    const uuid = location.state?.uuid;

    const closeQuickView = () => {
        console.log('back pressed');
    }

    const setErrorMsg = (msg) => {
        setMsg({ msg, type: 'error' });
    }

    useEffect(() => {
        const getOtpOptions = async () => {
            // get the data from the api
            const params = {
                email: location.state?.email,
                rememberDevice: false,
                authParam: window.getAuthParam(),
                phase: 'getOtpOptions'
            };

            try {
                const response = await fetch(`${apiUrl}/amfa`, {
                    method: 'POST',
                    body: JSON.stringify(params),
                    credentials: 'include',
                });
                // convert the data to json
                const json = await response.json();

                if (json.message) {
                    setShowOTP(false);
                    setErrorMsg(json.message);
                    return;
                }
                // // set state with the result
                // if (!json.otpOptions.vPhoneNumber && json.otpOptions.phoneNumber) {
                //     json.otpOptions.vPhoneNumber = json.otpOptions.phoneNumber;
                // }
                setData(json);
                setShowOTP(true);
            } catch (error) {
                console.error(error);
                setErrorMsg('Error fetching data from the server');
                return;
            }
        }

        if (!location.state || !location.state.validated) {
            navigate('/selfservice');
        }

        window.history.pushState('fake-route', document.title, window.location.href);

        window.addEventListener('popstate', closeQuickView);

        getOtpOptions();

        return () => {
            window.removeEventListener('popstate', closeQuickView);
            // If we left without using the back button, aka by using a button on the page, we need to clear out that fake history event
            if (window.history.state === 'fake-route') {
                window.history.back();
            }
        };
    }, [location.state, navigate]);

    const UpdateProfileElement = ({ updateType, profile }) => {
        return (
            <div class="row">
                <div class="col" style={{ margin: 'auto 3px', display: 'inline', height: '40px' }}>
                    <div class="row"
                        style={{ fontWeight: 'bold' }}
                    >
                        {updateType === 'Phone Number' ? 'Mobile/SMS' : updateType === 'Voice Number' ? 'Voice' : updateType}:
                    </div>
                    <div className='row text-left small' style={{ color: '#4E95D9' }}>
                        {profile ? profile : <div style={{ color: '#C0C0C0' }}>{'---'}</div>}
                    </div>
                </div>
                <div class="col-4" style={{ margin: '15px auto', padding: '1px', display: 'inline' }}>
                    <Button
                        name={`${updateType}`}
                        type='submit'
                        className='btn btn-sm btn-success'
                        disabled={isLoading}
                        onClick={() => navigate('/updateprofile', {
                            state: {
                                email,
                                uuid,
                                validated: true,
                                updateType,
                                profile,
                                otpData: data,
                            }
                        })}
                    >
                        Update
                    </Button>
                </div>
                {config?.enable_self_service_remove_buttons &&
                    <div class="col-3" style={{ margin: '15px auto', padding: '1px', display: 'inline' }}>
                        {profile && <Button
                            name={`Remove${updateType}`}
                            type='submit'
                            className='btn btn-sm btn-danger'
                            disabled={isLoading}
                            onClick={() => navigate('/removeprofile', {
                                state: {
                                    email,
                                    uuid,
                                    validated: true,
                                    updateType,
                                    otpData: data,
                                }
                            })}
                        >
                            Remove
                        </Button>}
                    </div>
                }
            </div>
        )
    }

    const UpdatePassword = () => (
        <div class="row">
            <div class="col" style={{ margin: 'auto 3px', display: 'inline', height: '40px' }}>
                <div class="row"
                    style={{ fontWeight: 'bold' }}
                >
                    Update
                </div>
                <div class="row"
                    style={{ fontWeight: 'bold' }}
                >
                    Password:
                </div>
            </div>
            <div class="col-4" style={{ margin: '15px auto', padding: '1px', display: 'inline' }}>
                <Button
                    name='updatePassword'
                    type='submit'
                    // className='btn btn-primary submitButton-customizable'
                    className='btn-sm btn-success'
                    disabled={isLoading}
                    onClick={() => navigate('/passwordreset', {
                        state: {
                            email,
                            apti: getApti(),
                            uuid,
                            validated: true,
                            otpData: data,
                            backable: true,
                        }
                    })}
                >
                    Update
                </Button>
            </div>
            {config?.enable_self_service_remove_buttons &&
                <div class="col-3" style={{ margin: '15px auto', padding: '1px', display: 'inline' }} />
            }
        </div>)

    const removeTOTP = async () => {
        // console.log('remove TOTP');
        if (window.confirm('Do you want to remove your Mobile TOTP verification method?')) {
            const params = {
                email,
                uuid,
                profile: 'mobileToken',
                otptype: 't',
                authParam: window.getAuthParam(),
                phase: 'removeProfile'
            };

            const options = {
                method: 'POST',
                body: JSON.stringify(params),
                credentials: 'include',
            };

            setLoading(true);
            setErrorMsg('');
            try {
                const res = await fetch(`${apiUrl}/amfa`, options);
                switch (res.status) {
                    case 200:
                        data.mobileToken = null;
                        break;
                    case 400:
                    case 403:
                        const resMsg = await res.json();
                        if (resMsg) {
                            setErrorMsg(resMsg.message ? resMsg.message : resMsg.name ? resMsg.name : JSON.stringify(resMsg));
                        }
                        else {
                            let errMsg = 'Something went wrong, please try again.';
                            if (res.message === "NotAuthorizedException") {
                                errMsg = 'Invalid credentials.';
                            }
                            setErrorMsg(errMsg);
                        }
                        break;
                    default:
                        const result = await res.json();
                        let errMsg = 'Something went wrong, please try again.';
                        if (result.message === "NotAuthorizedException") {
                            errMsg = 'Invalid credentials.';
                        }
                        setErrorMsg(errMsg);
                        break;
                }
            } catch (error) {
                console.error(error);
                setErrorMsg('Error fetching data from the server');
                return;
            }
            finally {
                setLoading(false);
            }
        }
    }

    const UpdateMobileToken = () => (
        <div class="row">
            <div class="col" style={{ margin: 'auto 3px', display: 'inline', height: '40px' }}>
                <div class="row"
                    style={{ fontWeight: 'bold' }}
                >
                    Mobile TOTP:
                </div>
                <div className='row text-left small' style={{ color: '#4E95D9' }}>
                    {data?.mobileToken ? data.mobileToken : <div style={{ color: '#C0C0C0' }}>{'---'}</div>}
                </div>
            </div>
            <div class="col-4" style={{ margin: '15px auto', padding: '1px', display: 'inline' }}>
                <Button
                    name='setuptotp'
                    type='submit'
                    className='btn btn-sm btn-success'
                    disabled={isLoading}
                    onClick={() => navigate('/setuptotp', {
                        state: {
                            email,
                            uuid,
                            validated: true,
                            backable: true,
                            type: 'update'
                        }
                    })}
                >
                    Update
                </Button>
            </div>
            {config?.enable_self_service_remove_buttons &&
                <div class="col-3" style={{ margin: '15px auto', padding: '1px', display: 'inline' }}>
                    {data?.mobileToken && <Button
                        name={`RemoveMobileToken`}
                        type='submit'
                        className='btn btn-sm btn-danger'
                        disabled={isLoading}
                        onClick={removeTOTP}
                    >
                        Remove
                    </Button>}
                </div>
            }
        </div>
    )

    return (
        <div>
            <span><h4>{t('update_provile_app_portal_header')}</h4></span>
            {
                showOTP &&
                <span className='idpDescription-customizable' style={{ color: '#4E95D9' }}>
                    {data?.given_name + ' ' + data?.family_name}
                </span>
            }
            <hr className="hr-customizable" />
            {
                showOTP ? <>
                    {config.master_additional_otp_methods.includes('ae') && <>
                        <UpdateProfileElement updateType={'Alt Email'} profile={data?.aemail} />
                        <hr className='hr-customizable' />
                    </>
                    }
                    {config.master_additional_otp_methods.includes('s') && <>
                        <UpdateProfileElement updateType={'Phone Number'} profile={data?.phoneNumber} />
                        <hr className='hr-customizable' />
                    </>
                    }
                    {config.master_additional_otp_methods.includes('v') && <>
                        <UpdateProfileElement updateType={'Voice Number'} profile={data?.vPhoneNumber} />
                        <hr className='hr-customizable' />
                    </>
                    }
                    {config.master_additional_otp_methods.includes('t') && <>
                        <UpdateMobileToken />
                        <hr className='hr-customizable' />
                    </>
                    }
                    <UpdatePassword />
                </> : <Spinner color="primary" style={{ margin: '8px auto' }}>{''}</Spinner>}
            <hr className='hr-customizable' />
            <Button name="confirm" type="submit" className="btn btn-primary submitButton-customizable"
                variant="success"
                onClick={
                    async () => {
                        if (location.state && location.state.uuid) {
                            const params = {
                                email,
                                uuid: location.state.uuid,
                            };

                            setLoading(true);
                            try {
                                await fetch(`${apiUrl}/oauth2/signout`, {
                                    method: 'POST',
                                    body: JSON.stringify(params),
                                    credentials: 'include',
                                });
                            }
                            catch (err) {
                                console.log(err);
                            }
                            setLoading(false);
                        }
                        if (applicationUrl) {
                            // window.history.go(-4);
                            window.location.assign(applicationUrl)
                        }
                        else { window.close() }
                    }
                }
            >
                {applicationUrl ? 'Return to the Login Page' : 'Close this window'}
            </Button>
            <InfoMsg isLoading={isLoading} msg={msg} />
        </div >

    );
}


export default OTPMethods;