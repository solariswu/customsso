import { useEffect, useState, } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { Button, Spinner } from 'reactstrap';
import { apiUrl } from '/const.js';

import 'react-phone-number-input/style.css'
import InfoMsg from '../../Components/InfoMsg';
import { useTranslation } from 'react-i18next';

const CONTENT = ({ updatetimer }) => {
	const navigate = useNavigate();
	const location = useLocation();

	const email = location.state?.email;
	const password = location.state?.password;
	const attributes = location.state?.attributes;
	const apti = location.state?.apti;
	const [uuid, setUuid] = useState(null);

	const [msg, setMsg] = useState({ msg: '', type: 'info' });
	const [isLoading, setLoading] = useState(false);
	const [isVerified, setVerified] = useState(false);
	const [isIniting, setIniting] = useState(true);
	const [otpcode, setOtpcode] = useState('');

	const { t } = useTranslation();

	const sendOTP = async (isResend) => {
		// console.log('send SignUp new OTP');

		const options = {
			method: 'POST',
			body: JSON.stringify({
				email,
				otptype: 'e',
				apti,
				authParam: window.getAuthParam(),
				phase: 'emailverificationSendOTP',
				isResend,
			}),
			credentials: 'include',
		};

		setLoading(true);
		setErrorMsg('');
		try {
			const res = await fetch(`${apiUrl}/amfa`, options);

			switch (res.status) {
				case 200:
				case 202:
					const resultMsg = await res.json();
					// console.log('resultMsg', resultMsg);
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
				case 501:
					const resultMsg401 = await res.json();
					if (resultMsg401.message) {
						navigate('/registration', { state: { email, apti, msg: resultMsg401.message, type: 'error' } });
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
			setIniting(false);
		}
	}

	useEffect(() => {
		setIniting(true);
		sendOTP(false);
	}, []);

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

	const handleOTPVerify = async (e) => {

		if (!otpcode || otpcode.length < 1) {
			setErrorMsg('Please enter the verification code');
			return;
		}

		const options = {
			method: 'POST',
			body: JSON.stringify({
				email,
				password,
				apti,
				authParam: window.getAuthParam(),
				otpcode,
				otptype: 'e',
				attributes,
				phase: 'emailverificationverifyotp'
			}),
			credentials: 'include',
		};

		setLoading(true);
		setErrorMsg('');
		try {
			const res = await fetch(`${apiUrl}/amfa`, options);
			switch (res.status) {
				case 200:
					const resultMsg = await res.json();
					setUuid(resultMsg?.uuid);
					// console.log('resultMsg', resultMsg);
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

	const VerifyDone = () => {
		updatetimer('selfservice')
		return (
			<div>
				<span className='idpDescription-customizable'> Your account has been registed. </span><br />
				<span> Please click Continue to register your Multi-Factor Authentication Methods. </span>
				<hr className="hr-customizable" />
				<Button name="confirm" type="submit" className="btn btn-primary submitButton-customizable"
					variant="success"
					onClick={() => navigate('/otpmethods', {
						state: {
							email,
							apti,
							uuid,
							validated: true,
						}
					})}
				>
					{'Continue'}
				</Button>
			</div >
		)
	}

	if (isIniting) {
		return (
			<div>
				<span><h4>Registration </h4></span>
				<hr className="hr-customizable" />
				<span className='idpDescription-customizable'> Email Verification </span>
				<span> OTP sending is in progress. Please wait. </span>
				<Spinner color="primary" style={{ margin: '8px auto' }}>{''}</Spinner>
			</div>
		)
	}
	return (
		<div>
			<span><h4>Registration </h4></span>
			<hr className="hr-customizable" />
			{isVerified ? <VerifyDone /> :
				<div>
					<span className='idpDescription-customizable'> Email Verification </span>
					<span>
						{t('registration_app_verify_retreive_message')}
					</span>
					<hr className="hr-customizable" />
					<input name="otpcode" id="otpcode" type="tel" className="form-control inputField-customizable" placeholder="####"
						style={{ width: '40%', margin: 'auto 10px', display: 'inline', height: '40px' }}
						autoCapitalize="none" required aria-label="otp code" value={otpcode}
						autoFocus
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
						onClick={handleOTPVerify}
					>
						{'Verify OTP'}
					</Button>
					<Button name='resend' type="submit" className="btn btn-primary submitButton-customizable"
						disabled={isLoading}
						onClick={() => sendOTP(true)}
					>{!isLoading ? 'Resend OTP' : 'Sending...'}</Button>
					{!isLoading && <Button name='back' type="submit" className="btn btn-secondary submitButton-customizable-back"
						variant="outline-success"
						disabled={isLoading}
						onClick={() =>
							navigate('/registration_attributes', {
								state: {
									email,
									password,
									apti,
									attributes,
								}
							})}
						style={{ marginTop: '10px' }}
					>{'Back'}</Button>}
					<InfoMsg msg={msg} isLoading={isLoading} />
				</div>}
		</div >
	);
}

const RegistrationVerify = ({ updatetimer }) => {

	return (
		<CONTENT updatetimer={updatetimer} />
	)
}
export default RegistrationVerify;