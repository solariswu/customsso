import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { Button, Spinner } from 'reactstrap';

import { apiUrl, applicationUrl, pwdResetPageTitle } from '../const';

export const OTP = () => {
	const navigate = useNavigate();
	const location = useLocation();

	const [errMsg, setErrorMsg] = useState('');
	const [infoMsg, setInfoMsg] = useState('');
	const [isLoading, setLoading] = useState(false);
	const [otp, setOtp] = useState({ type: 'e', code: '', addr: '', stage: 1 });
	const [data, setData] = useState(null);
	const [showOTP, setShowOTP] = useState(false);

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
				setShowOTP(true);
				setData(json);
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
			window.history.pushState('fake-route', document.title, window.location.href);

			window.addEventListener('popstate', () => console.log('back pressed in MFA'));

			switch (location.state.type) {
				case 'passwordreset':
					// call the function
					getOtpOptions();
					break;
				case 'updateotp':
					setData(location.state);
					setShowOTP(true);
					break;
				default:
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

	}, [location.state, navigate]);

	const authParam = window.getAuthParam();

	const email = location.state?.email;
	const apti = location.state?.apti;

	const setOTPCode = (e) => {
		setOtp({ ...otp, code: e.target.value });
	}

	const confirmLogin = (e) => {
		if (e.key === "Enter") {
			verifyOtp(e);
		}
	}

	const sendOtp = async ({ otptype, otpaddr }) => {
		setOtp({ ...otp, type: otptype, addr: otpaddr });

		const sendOtpParams = {
			email,
			rememberDevice: false,
			authParam,
			apti,
			otptype,
			otpaddr,
			phase: `pwdreset${otp.stage + 1}`,
		};

		console.log('send otp params:', sendOtpParams);

		setLoading(true);
		setErrorMsg('');
		setInfoMsg('');
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
						setErrorMsg('Unknown OTP send error, please contact help desk.');
					}
					break;
				case 401:
					const resultMsg401 = await result.json();
					if (resultMsg401.message) {
						localStorage.setItem('OTPErrorMsg', resultMsg401.message);
						window.location.assign(`${applicationUrl}?amfa=relogin`);
						return;
					}
					else {
						setErrorMsg('Unknown OTP send error, please contact help desk.');
					}
					break;
				default:
					const res = await result.json();
					if (res) {
						setErrorMsg(res.message ? res.message : res.name ? res.name : JSON.stringify(res));
					}
					else {
						setErrorMsg('Unknown error, please contact help desk.');
					}
					break;
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
			setInfoMsg('');
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
			phase: `pwdresetverify${otp.stage + 1}`,
		};

		console.log('verify otp params:', verifyOtpParams);

		setLoading(true);
		setOtp({ ...otp, code: '', addr: '' });
		setErrorMsg('');
		setInfoMsg('');
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
						setOtp({ ...otp, code: '', addr: '', stage: otp.stage + 1 });
						let count = 0;

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
							if (count === 1)
								navigate(`/${location.state.type}`, {
									state: {
										email,
										apti,
										uuid: response.uuid,
										validated: true,
										otpData: data,
									}
								});
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
							}
						})
					}
					else {
						// unexpected
						localStorage.setItem('OTPErrorMsg', 'Dual OTP verification error, please contact help desk.');
						window.location.assign(`${applicationUrl}?amfa=relogin`);
					}
					return;
				case 401:
					const resultMsg = await result.json();
					if (resultMsg.message) {
						localStorage.setItem('OTPErrorMsg', resultMsg.message);
						window.location.assign(`${applicationUrl}?amfa=relogin`);
						return;
					}
					else {
						setErrorMsg('Unknown OTP send error, please contact help desk.');
					}
					break;
				case 203:
				default:
					const res = await result.json();
					if (data) {
						setErrorMsg(res.message ? res.message : res.name ? res.name : JSON.stringify(res));
					}
					else {
						setErrorMsg('Unknown error, please contact help desk.');
					}
					break;
			}
			setLoading(false);
		}
		catch (err) {
			setLoading(false);
			console.error('error in otp password reset', err);
			setErrorMsg('OTP verify error, please contact help desk.');
		}
	}

	return (
		<div>
			<span> <h4>{pwdResetPageTitle}</h4> </span>
			<hr className='hr-customizable' />
			<div>
				<span
					style={{ lineHeight: '1rem', color: 'grey' }}
				>
					Access requires 2 verifications.<br />
					Verification Step {otp.stage}. <br />
					Choose contact method:
				</span>
				<br />
			</div>
			<br />
			{showOTP && data.otpOptions.map((option) => (
				option === 'e' && email ?
					(<div className='row align-items-end'>
						<div className='col-4'>Email:</div>
						<div className='col'>
							<span className='link-customizable' onClick={() => email ? sendOtp({ otptype: 'e', otpaddr: email }) : null}>
								{`${email[0]}xxx@${email[email.lastIndexOf('@') + 1]}xx.${email.substring((email.lastIndexOf('.') + 1))} >`}
							</span>
						</div>
					</div>) : option === 'ae' && data.aemail ?
						<div className='row align-items-end'>
							<div className='col-4'>Alt-Email:</div>
							<div className='col'>
								<span className='link-customizable' onClick={() => sendOtp({ otptype: 'ae', otpaddr: data.aemail })}>
									{`${data.aemail[0]}xxx@${data.aemail[data.aemail.lastIndexOf('@') + 1]}xx.${data.aemail.substring((data.aemail.lastIndexOf('.') + 1))} >`} </span>
							</div>
						</div> : option === 's' && data.phoneNumber ?
							<div className='row align-items-end'>
								<div className='col-4'>SMS:</div>
								<div className='col'>
									<span className='link-customizable' onClick={() => data.phoneNumber ? sendOtp({ otptype: 's', otpaddr: data.phoneNumber }) : null}>
										{data.phoneNumber.replace(/(\d{3})(\d{5})(\d{1})/, '$1xxx$3') + ' >'} </span>
								</div>
							</div> : option === 'v' && data.vPhoneNumber ?
								<div className='row align-items-end'>
									<div className='col-4'>Voice:</div>
									<div className='col'>
										<span className='link-customizable' onClick={() => data.vPhoneNumber ? sendOtp({ otptype: 'v', otpaddr: data.vPhoneNumber }) : null}>
											{data.vPhoneNumber.replace(/(\d{3})(\d{5})(\d{1})/, '$1xxx$3') + ' >'} </span>
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
					disabled={isLoading}
					onClick={!isLoading ? verifyOtp : null}
				>
					{isLoading ? 'Sending...' : 'Verify'}
				</Button>
			</div>
			{isLoading ? <span className='errorMessage-customizable'><Spinner color="primary" >{''}</Spinner></span> : (
				errMsg && (
					<div><br /><span className='errorMessage-customizable'>{errMsg}</span></div>
				))}
			{!isLoading && infoMsg &&
				<div><br /><span className='infoMessage-customizable'>{infoMsg}</span></div>
			}
		</div>
	);
}