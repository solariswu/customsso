import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { Button, Spinner } from 'reactstrap';
import { apiUrl, applicationUrl } from '../const';
import { validateEmail, validatePhoneNumber } from './utils';

import 'react-phone-number-input/style.css'
import PhoneInput from 'react-phone-number-input';
import InfoMsg from '../../Components/InfoMsg';

const CONTENT = () => {
	const navigate = useNavigate();
	const location = useLocation();

	// const closeQuickView = () => {
	// 	console.log('back pressed');
	// }

	const email = location.state?.email;
	const apti = location.state?.apti;

	const [msg, setMsg] = useState({ msg: '', type: 'info' });
	const [isLoading, setLoading] = useState(false);
	const [isVerified, setVerified] = useState(false);
	const [otpcode, setOtpcode] = useState('');

	const setErrorMsg = (msg) => {
		setMsg({ msg, type: 'error' });
	}
	const setInfoMsg = (msg) => {
		setMsg({ msg, type: 'info' });
	}

	const confirmOTPVerify = (e) => {
		if (e.key === "Enter") {
			handleOTPVerify(e);
		}
	}

	const confirmSubmit = (e) => {
		if (e.key === "Enter") {
			sendOTP(e);
		}
	}

	const handleOTPVerify = async (e) => {

		if (!otpcode || otpcode.length < 1) {
			setErrorMsg('Please enter the verification code');
			return;
		}

		const options = {
			method: 'POST',
			body: JSON.stringify({
				email,
				apti,
				authParam: window.getAuthParam(),
				otpcode,
				otptype: 'email',
				phase: 'emailverification'
			}),
			credentials: 'include',
		};

		setLoading(true);
		setErrorMsg('');
		try {
			const res = await fetch(`${apiUrl}/amfa`, options);
			switch (res.status) {
				case 200:
					setVerified(true);
					break;
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
					const data = await res.json();
					let errMsg = 'Something went wrong, please try again.';
					if (data.message === "NotAuthorizedException") {
						errMsg = 'Invalid credentials.';
					}
					setErrorMsg(errMsg);
					break;
			}
		}
		catch (err) {
			console.log(err);
			setErrorMsg('Self SignUp OTP Verify Failed. Please try again. If the problem persists, please contact help desk.');
		}
		finally {
			setLoading(false);
		}
	}

	const sendOTP = async (e) => {
		e.preventDefault();

		console.log('send SignUp new OTP');

		const options = {
			method: 'POST',
			body: JSON.stringify({
				email,
				otptype: 'email',
				apti,
				authParam: window.getAuthParam(),
				phase: 'emailverificationsendotp'
			}),
			credentials: 'include',
		};

		setLoading(true);
		setErrorMsg('');
		try {
			const res = await fetch(`${apiUrl}/amfa`, options);
			console.log('res', res);

			switch (res.status) {
				case 200:
				case 202:
					const resultMsg = await res.json();
					console.log('resultMsg', resultMsg);
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
					const resultMsg401 = await res.json();
					if (resultMsg401.message) {
						navigate('/registration_email', { state: { email, apti, msg: resultMsg401.message } });
						return;
					}
					else {
						setErrorMsg('Unknown OTP send error, please contact help desk.');
					}
					break;
				default:
					const resJson = await res.json();
					if (resJson) {
						setErrorMsg(resJson.message ? resJson.message : resJson.name ? resJson.name : JSON.stringify(resJson));
					}
					else {
						setErrorMsg('Unknown error, please contact help desk.');
					}
					break;
			}
		}
		catch (err) {
			console.log(err);
			setErrorMsg('Self SignUp send OTP failed. Please try again. If the problem persists, please contact help desk.');
		}
		finally {
			setLoading(false);
		}
	}

	const VerifyDone = () => {
		return (
			<div>
				<span className='idpDescription-customizable'> Your account has been registed. </span><br />
				<Button name="confirm" type="submit" className="btn btn-primary submitButton-customizable"
					variant="success"
					onClick={{ applicationUrl } ?
						() => window.location.assign(`${applicationUrl}?amfa=relogin`) :
						() => window.close()}
				>
					{applicationUrl ? 'Return to the Login Page' : 'Close this window'}
				</Button>
			</div >
		)
	}

	return (
		<div>
			<span><h4>Registration </h4></span>
			<hr className="hr-customizable" />
			{isVerified ? <VerifyDone /> :
				<div>
					<p><span className='idpDescription-customizable'> Email Verification </span></p>
					<span className='idpDescription-customizable'>
						A one-time registration code was emailed to you at {email}.</span>
					<span>
						Please retrieve it, enter it below and click Complete Registration.</span>
					<div>
						<input name="otpcode" id="otpcode" type="tel" className="form-control inputField-customizable" placeholder="####"
							style={{ width: '40%', margin: 'auto 10px', display: 'inline', height: '40px' }}
							autoCapitalize="none" required aria-label="otp code" value={otpcode}
							onChange={(e) => setOtpcode(e.target.value)}
							onKeyUp={e => confirmOTPVerify(e)}
							disabled={isLoading}
						/>

						<Button
							name='verifyotp'
							type='submit'
							className='btn btn-primary submitButton-customizable'
							style={{ width: '40%', margin: 'auto 10px', display: 'inline', height: '40px' }}
							disabled={isLoading}
							onClick={!isLoading ? handleOTPVerify : null}
						>
							{isLoading ? 'Loading...' : 'Complete Registration'}
						</Button>
					</div>
					<Button name='back' type="submit" className="btn btn-primary submitButton-customizable"
						disabled={isLoading}
						onClick={!isLoading ? () =>
							navigate('/registration_password', {
								state: {
									email,
									apti,
									uuid: location.state ? location.state.uuid : '',
									validated: true,
									otpData: location.state ? location.state.otpData : '',
								}
							}) : null}
					>{!isLoading ? 'Back' : 'Loading...'}</Button>
					<InfoMsg msg={msg} isLoading={isLoading} />
				</div>}
		</div >
	);
}

const EmailVerification = () => {

	return (
		<CONTENT />
	)
}
export default EmailVerification;