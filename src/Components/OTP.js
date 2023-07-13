import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { Button, Spinner } from 'reactstrap';

import { apiUrl, applicationUrl, pwdResetPageTitle, selfServicePageTitle } from '../const';

export const OTP = () => {
	const navigate = useNavigate();
	const location = useLocation();

	const [msg, setMsg] = useState({ msg: '', type: '' });

	const [isLoading, setLoading] = useState(false);
	const [otp, setOtp] = useState({ type: '', code: '', addr: '', stage: 1 });
	const [data, setData] = useState(null);
	const [showOTP, setShowOTP] = useState(false);

	const setInfoMsg = (msg) => {
		setMsg({ msg, type: 'info' });
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
				apti: location.state?.apti,
				phase: 'getOtpOptions'
			};

			setLoading(true);
			try {
				const response = await fetch(`${apiUrl}/amfa`, {
					method: 'POST',
					body: JSON.stringify(params),
					credentials: 'include',
				});
				// convert the data to json
				const json = await response.json();
				setLoading(false);

				if (json.message) {
					setShowOTP(false);
					setErrorMsg(json.message);
					return;
				}
				// set state with the result
				setData(json);
				setShowOTP(true);
				console.log(json);
			} catch (error) {
				console.error(error);
				setLoading(false);
				setErrorMsg('Error fetching data from the server');
				return;
			}
		}

		if (!location.state) {
			navigate('/');
			return;
		}
		else {
			setShowOTP(false);
			setOtp({ type: '', code: '', addr: '', stage: 1 });
			setLoading(false);
			setData(null);
			setErrorMsg('');

			window.history.pushState('fake-route', document.title, window.location.href);

			window.addEventListener('popstate', () => console.log('back pressed in MFA'));

			if (location.state.type === 'passwordreset' || location.state.type === 'updateotp') {
				// call the function
				getOtpOptions();
			}
			else {
				// if the type is not passwordreset or updateotp, then we need to navigate to the home page
				navigate('/');
				return;
			}
			return () => {
				window.removeEventListener('popstate', () => console.log('back pressed in MFA'));
				// If we left without using the back button, aka by using a button on the page, we need to clear out that fake history event
				if (window.history.state === 'fake-route') {
					window.history.back();
				}
				setShowOTP(false);
			};
		}

	}, []);

	const authParam = window.getAuthParam();

	const email = location.state?.email;
	const apti = location.state?.apti;

	const amfaStepPrefix = location.state.type === 'passwordreset' ? 'pwdreset' : 'selfservice';

	const setOTPCode = (e) => {
		setOtp({ ...otp, code: e.target.value });
	}

	const confirmLogin = (e) => {
		if (e.key === "Enter") {
			verifyOtp(e);
		}
	}

	const sendOtp = async ({ otptype }) => {
		setOtp({ ...otp, type: otptype });

		const sendOtpParams = {
			email,
			rememberDevice: false,
			authParam,
			apti,
			otptype,
			phase: `${amfaStepPrefix}${otp.stage + 1}`,
		};

		console.log('send otp params:', sendOtpParams);

		setLoading(true);
		setErrorMsg('');
		try {
			const result = await fetch(`${apiUrl}/amfa`, {
				method: 'POST',
				body: JSON.stringify(sendOtpParams),
				credentials: 'include',
			});

			switch (result.status) {
				case 202:
					const resultMsg = await result.json();
					if (resultMsg.message) {
						setInfoMsg(resultMsg.message);
						setTimeout(() => {
							setInfoMsg('');
						}, 8000);
					}
					else {
						navigate('/selfservice', {
							state: {
								selfservicemsg: 'Unknown OTP send error, please contact help desk.'
							}
						})
						return;
					}
					break;
				case 401:
					const resultMsg401 = await result.json();
					navigate('/selfservice', {
						state: {
							selfservicemsg: resultMsg401.message ? resultMsg401.message :
								'Unknown OTP send error, please contact help desk.'
						}
					})
					return;
				default:
					const res = await result.json();
					let msg = 'Unknown error, please contact help desk.';
					if (res) {
						msg = res.message ? res.message : res.name ? res.name : JSON.stringify(res);
					}
					navigate('/selfservice', {
						state: {
							selfservicemsg: msg
						}
					})
					return;;
			}
			setLoading(false);
		}
		catch (err) {
			console.error('error in Dual OTP', err);
			setErrorMsg('Dual OTP error, please contact help desk.');
			setLoading(false);
		}
	}

	const verifyOtp = async (e) => {

		if (!otp.code || otp.code.length < 1) {
			setErrorMsg('Please enter the verification code');
			return;
		}

		const verifyOtpParams = {
			email,
			rememberDevice: false,
			authParam,
			apti,
			otptype: otp.type,
			otpcode: otp.code,
			state: '',
			redirectUri: '',
			phase: `${amfaStepPrefix}verify${otp.stage + 1}`,
		};

		console.log('verify otp params:', verifyOtpParams);

		setLoading(true);
		setOtp({ ...otp, code: '', addr: '' });
		setErrorMsg('');
		try {
			const result = await fetch(`${apiUrl}/amfa`, {
				method: 'POST',
				body: JSON.stringify(verifyOtpParams),
				credentials: 'include',
			});

			console.log('verify otp result:', result);
			console.log('otp state:', otp);
			switch (result.status) {
				case 200:
					const response = await result.json();
					console.log('otp response:', response);
					if (otp.stage === 1) {
						setOtp({ ...otp, type: '', code: '', addr: '', stage: otp.stage + 1 });
						let count = 0;

						console.log('data', data);
						data.otpOptions.map((option) => {
							switch (option) {
								case 'e':
									if (data.email && data.email.length > 0) {
										count++;
									}
									break;
								case 'ae':
									if (data.aemail && data.aemail.length > 0) {
										count++;
									}
									break;
								case 's':
									if (data.phoneNumber && data.phoneNumber.length > 0) {
										count++;
									}
									break;
								case 'v':
									if (data.vPhoneNumber && data.vPhoneNumber.length > 0 && data.vPhoneNumber !== data.phoneNumber) {
										count++;
									}
									break;
								default:
									break;
							}
							return option;
						});

						let idx = data.otpOptions.findIndex(option => option === otp.type);
						console.log('idx:', idx);
						console.log('count:', count);

						if (idx > -1 && count > 1) {
							data.otpOptions.splice(idx, 1);

							if ((otp.type === 's' || otp.type === 'v') &&
								data.phoneNumber && data.phoneNumber.length > 0 && data.phoneNumber === data.vPhoneNumber) {
								const duplicate = otp.type === 's' ? 'v' : 's';
								idx = data.otpOptions.findIndex(option => option === duplicate);
								data.otpOptions.splice(idx, 1);
							}
						}
						else {
							if (count === 1) {
								navigate(`/${location.state.type}`, {
									state: {
										email,
										apti,
										uuid: response.uuid,
										validated: true,
										otpData: data,
										backable: false,
									}
								});
								// console.log ('count === 1, location.state:', location.state);
							}
							else {
								// could not find the verified OTP method in the array, unexpected
								localStorage.setItem('OTPErrorMsg', 'Dual OTP verification error, please contact help desk.');
								window.location.assign(`${applicationUrl}?amfa=relogin`);
							}
						}
						setLoading(false);
						return;
					}
					console.log('otp state:', otp);
					console.log('response:', response);
					if (otp.stage === 2 && response.uuid && response.uuid.length > 0) {
						navigate(`/${location.state.type}`, {
							state: {
								email,
								apti,
								uuid: response.uuid,
								validated: true,
								otpData: data,
								backable: false,
							}
						})
					}
					else {
						// unexpected
						navigate('/selfservice', {
							state: {
								selfservicemsg: 'Dual OTP verification error, please contact help desk.'
							}
						})
					}
					return;
				case 401:
					const resultMsg = await result.json();

					navigate('/selfservice', {
						state: {
							selfservicemsg: resultMsg.message ? resultMsg.message : 'Unknown error, please contact help desk.'
						}
					})
					return;
				case 403:
					const resMsg = await result.json();
					if (resMsg) {
						setErrorMsg(resMsg.message ? resMsg.message : resMsg.name ? resMsg.name : JSON.stringify(resMsg));
					}
					else {
						navigate('/selfservice', {
							state: {
								selfservicemsg: 'Unknown error, please contact help desk.'
							}
						});
						return;
					}
					break;
				case 203:
				default:
					const res = await result.json();
					let msg = 'Unknown error, please contact help desk.'
					if (res) {
						msg = res.message ? res.message : res.name ? res.name : JSON.stringify(res);
					}

					navigate('/selfservice', {
						state: {
							selfservicemsg: msg
						}
					});
			}
			setLoading(false);
		}
		catch (err) {
			setLoading(false);
			console.error('error in otp password reset/selfservice', err);
			setErrorMsg('OTP verify error, please contact help desk.');
		}
	}

	let OTPMethodsCount = 0;

	if (showOTP && data?.otpOptions) {
		data.otpOptions.forEach((option) => {
			switch (option) {
				case 'e':
					if (email)
						OTPMethodsCount++;
					break;
				case 'ae':
					if (data.aemail)
						OTPMethodsCount++;
					break;
				case 's':
					if (data.phoneNumber)
						OTPMethodsCount++;
					break;
				case 'v':
					if (data.vPhoneNumber && data.vPhoneNumber !== data.phoneNumber)
						OTPMethodsCount++;
					break;
				default:
					break;
			}
		})
	}
	return (
		<div>
			<span> <h4>{location.state?.type === 'passwordreset' ? pwdResetPageTitle : selfServicePageTitle}</h4> </span>
			<hr className='hr-customizable' />
			<div>
				<span
					style={{ lineHeight: '1rem', color: 'grey' }}
				>
					{showOTP ? OTPMethodsCount === 1 ?
						<>Access requires a verification.<br />
							Click your ID below to receive a one time verification code</> :
						<>Access requires 2 verifications.<br />
							Verification Step {otp.stage}. <br />
							Choose contact method:</> : ''}
				</span>
				<br />
			</div>
			<br />
			{showOTP && data.otpOptions.map((option) => (
				option === 'e' && email ?
					(<div className='row align-items-end'>
						<div className='col-4'>Email:</div>
						<div className='col'>
							<span className='link-customizable' onClick={() => email ? sendOtp({ otptype: 'e' }) : null}>
								{`${email[0]}xxx@${email[email.lastIndexOf('@') + 1]}xx.${email.substring((email.lastIndexOf('.') + 1))} >`}
							</span>
						</div>
					</div>) : option === 'ae' && data.aemail ?
						<div className='row align-items-end'>
							<div className='col-4'>Alt-Email:</div>
							<div className='col'>
								<span className='link-customizable' onClick={() => sendOtp({ otptype: 'ae' })}>
									{`${data.aemail} >`} </span>
							</div>
						</div> : option === 's' && data.phoneNumber ?
							<div className='row align-items-end'>
								<div className='col-4'>SMS:</div>
								<div className='col'>
									<span className='link-customizable' onClick={() => data.phoneNumber ? sendOtp({ otptype: 's' }) : null}>
										{data.phoneNumber + ' >'} </span>
								</div>
							</div> : option === 'v' && data.vPhoneNumber ?
								<div className='row align-items-end'>
									<div className='col-4'>Voice:</div>
									<div className='col'>
										<span className='link-customizable' onClick={() => data.vPhoneNumber ? sendOtp({ otptype: 'v' }) : null}>
											{data.vPhoneNumber + ' >'} </span>
									</div>
								</div> : option === 'm' &&
								<div className='row align-items-end'>
									<div className='col'>Mobile Token:&nbsp;&nbsp;&nbsp;&nbsp;Obtain from your mobile</div>
								</div>
			))}
			<br />
			<div>
				<input name="otpcode" id="otpcode" type="tel" className="form-control inputField-customizable" placeholder="####"
					style={{ width: '40%', margin: 'auto 10px', display: 'inline', height: '40px' }}
					autoCapitalize="none" required aria-label="otp code" value={otp.code} onChange={setOTPCode}
					onKeyUp={e => confirmLogin(e)}
					disabled={isLoading}
				/>

				<Button
					name='verifyotp'
					type='submit'
					className='btn btn-primary submitButton-customizable'
					style={{ width: '40%', margin: 'auto 10px', display: 'inline', height: '40px' }}
					disabled={isLoading || otp.type === ''}
					onClick={!isLoading ? verifyOtp : null}
				>
					{isLoading ? showOTP ? 'Sending...' : 'Checking...' : 'Verify'}
				</Button>
			</div>
			{isLoading ? <span className='errorMessage-customizable'><Spinner color="primary" style={{ "marginTop": "8px" }}>{''}</Spinner></span> : (
				msg?.msg && (
					<div><br /><span className={msg.type === 'error' ? 'errorMessage-customizable' : 'infoMessage-customizable'}>{msg.msg}</span></div>
				))}
		</div>
	);
}