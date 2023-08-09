import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { Button, Spinner } from 'reactstrap';
import InfoMsg from '../Components/InfoMsg';

import { apiUrl } from '../const';
import { useFeConfigs } from '../DataProviders/FeConfigProvider';
import { getApti } from '../Components/utils';

const LOGIN = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const config = useFeConfigs();

	const [data, setData] = useState(null);
	const [showOTP, setShowOTP] = useState(false);
	const [msg, setMsg] = useState(location.state?.msg);

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
				// set state with the result
				if (!json.otpOptions.vPhoneNumber && json.otpOptions.phoneNumber) {
					json.otpOptions.vPhoneNumber = json.otpOptions.phoneNumber;
				}
				setData(json);
				setShowOTP(true);
				console.log('get otpoptions response: ', json);
			} catch (error) {
				console.error(error);
				setErrorMsg('Error fetching data from the server');
				return;
			}
		}

		console.log('otp methods, location state:', location.state);
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
						{updateType}:
					</div>
					<div class="row" style={{ color: '#C0C0C0' }}>
						{profile ? profile : '---'}
					</div>
				</div>
				<div class="col-3" style={{ margin: '15px auto', padding: '1px', display: 'inline' }}>
					<Button
						name={`${updateType}`}
						type='submit'
						className='btn btn-sm btn-success'
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
				<div class="col-3" style={{ margin: '15px auto', padding: '1px', display: 'inline' }}>
					{profile && <Button
						name={`Remove${updateType}`}
						type='submit'
						className='btn btn-sm btn-danger'
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
			</div>
		)
	}

	return (
		<div>
			<span><h4>{config?.branding.update_provile_app_portal_header}</h4></span>
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
						<UpdateProfileElement updateType={'Voice Number'} profile={data?.vPhoneNumber ? data.vPhoneNumber : data?.phoneNumber ? data.phoneNumber : null} />
						<hr className='hr-customizable' />
					</>
					}
					<div class="row">
						<div class="col" style={{ margin: 'auto 3px', display: 'inline', height: '40px' }}>
							<div class="row"
								style={{ fontWeight: 'bold' }}
							>
								Update Password:
							</div>
							<div class="row" style={{ color: '#C0C0C0' }}></div>
						</div>
						<div class="col-4" style={{ margin: '15px auto', padding: '1px', display: 'inline' }}>
							<Button
								name='updatePassword'
								type='submit'
								// className='btn btn-primary submitButton-customizable'
								className='btn btn-sm btn-success'
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
					</div>
				</> : <Spinner color="primary" style={{ margin: '8px auto' }}>{''}</Spinner>}
			<hr className='hr-customizable' />
			<InfoMsg isLoading={false} msg={msg} />
		</div >

	);
}

const OTPMethods = () => {

	return (
		<LOGIN />
	)
}
export default OTPMethods;