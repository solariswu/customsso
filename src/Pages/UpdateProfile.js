import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { Button, Spinner } from 'reactstrap';
import { apiUrl, applicationUrl } from '../const';
import { validateEmail, validatePhoneNumber } from './utils';

import 'react-phone-number-input/style.css'
import PhoneInput from 'react-phone-number-input';

const CONTENT = () => {
	const navigate = useNavigate();
	const location = useLocation();

	// const closeQuickView = () => {
	// 	console.log('back pressed');
	// }

	useEffect(() => {
		if (!location.state || !location.state.validated) {
			navigate('/selfservice', {
				state: {
					selfservicemsg: null,
				}
			});
		}

		// window.history.pushState('fake-route', document.title, window.location.href);

		// window.addEventListener('popstate', closeQuickView);
		// return () => {
		// 	window.removeEventListener('popstate', closeQuickView);
		// 	// If we left without using the back button, aka by using a button on the page, we need to clear out that fake history event
		// 	if (window.history.state === 'fake-route') {
		// 		window.history.back();
		// 	}
		// };
	}, [location.state, navigate]);

	const email = location.state?.email;
	const apti = location.state?.apti;
	const updateType = location.state?.updateType;
	const legacyProfile = location.state?.profile ? location.state.profile : '';

	const [msg, setMsg] = useState({ msg: `Click "Registraction", a verification code would be sent to new ${updateType}`, type: 'info' });
	const [profile, setProfile] = useState('');
	const [newProfile, setNewProfile] = useState('');
	const [isLoading, setLoading] = useState(false);
	const [isResetDone, setResetDone] = useState(false);
	const [otpcode, setOtpcode] = useState('');
	const [uuid, setUuid] = useState('');

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

	const validProfile = () => {
		let validateResult = 'unKnown Error';

		const newData = newProfile.trim();
		if (newData === profile.trim()) {
			setErrorMsg(`New ${updateType} is same as old ${updateType}`);
			return false;
		}

		if (newData === '') {
			alert(`Do you want to remove this ${updateType} verification method?`);
			// to do
			return false;
		}

		updateType?.toLowerCase() === 'alt email' ? validateResult = validateEmail(newData) : validateResult = validatePhoneNumber(newData);

		if (validateResult) {
			setErrorMsg(validateResult);
			return false;
		}

		return true;
	}

	const otpList = { 'alt email': 'ae', 'phone number': 's', 'voice number': 'v' };

	const handleOTPVerify = async (e) => {

		if (!otpcode || otpcode.length < 1) {
			setErrorMsg('Please enter the verification code');
			return;
		}

		const options = {
			method: 'POST',
			body: JSON.stringify({
				email,
				newProfile,
				uuid,
				apti,
				rememberDevice: false,
				authParam: window.getAuthParam(),
				otpcode,
				otptype: otpList[updateType.toLowerCase()],
				phase: 'updateProfile'
			}),
			credentials: 'include',
		};

		setLoading(true);
		setErrorMsg('');
		try {
			const res = await fetch(`${apiUrl}/amfa`, options);
			switch (res.status) {
				case 200:
					setResetDone(true);
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
			setErrorMsg('Self Service OTP Verify Failed. Please try again. If the problem persists, please contact help desk.');
		}
		finally {
			setLoading(false);
		}
	}

	const sendOTP = async (e) => {
		e.preventDefault();

		console.log('send register new OTP');

		if (validProfile()) {

			const options = {
				method: 'POST',
				body: JSON.stringify({
					email,
					otptype: otpList[updateType.toLowerCase()],
					newProfile,
					profile,
					apti,
					rememberDevice: false,
					authParam: window.getAuthParam(),
					phase: 'updateProfileSendOTP'
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
							setUuid(resultMsg.uuid);
						}
						else {
							setErrorMsg('Unknown OTP send error, please contact help desk.');
						}
						break;
					case 401:
						const resultMsg401 = await res.json();
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
				setErrorMsg('Self Service new Register Failed. Please try again. If the problem persists, please contact help desk.');
			}
			finally {
				setLoading(false);
			}
		}
	}

	const ResetDone = () => {
		return (
			<div>
				<span className='idpDescription-customizable'> Your {updateType} has been changed. </span><br />
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
			<span><h4>Update {updateType} </h4></span>
			<hr className="hr-customizable" />
			{isResetDone ? <ResetDone /> :
				<div>
					<span className='idpDescription-customizable'> Enter your current {updateType} </span>
					{updateType.toLowerCase() === 'alt email' ?

						<div className="input-group">
							<input id="profile" name="profile" type="email" className="form-control inputField-customizable"
								style={{ height: '40px' }}
								placeholder="user@email.com" value={legacyProfile === '' ? legacyProfile : profile} onChange={(e) => setProfile(e.target.value)}
								autoFocus
								disabled={isLoading || legacyProfile === ''}
							/>
						</div> :
						<PhoneInput
							international
							countryCallingCodeEditable={false}
							defaultCountry="US"
							placeholder="phone number"
							value={legacyProfile === '' ? legacyProfile : profile}
							onChange={setNewProfile}
							disabled={isLoading || legacyProfile === ''}
						/>
					}
					<span className='idpDescription-customizable'> Enter your new {updateType} </span>
					<p><span> Leave it empty if you want to remove this {updateType} verification method</span></p>
					{updateType?.toLowerCase() === 'alt email' ?
						<div className="input-group">
							<input id="signInFormNewProfile" name="newProfile" type="email" className="form-control inputField-customizable"
								style={{ height: '40px' }}
								placeholder="user@email.com" value={newProfile} onChange={(e) => setNewProfile(e.target.value)}
								onKeyUp={e => confirmSubmit(e)}
								disabled={isLoading}
							/> </div> :
						<PhoneInput
							international
							countryCallingCodeEditable={false}
							defaultCountry="US"
							placeholder="phone number"
							value={newProfile}
							onChange={setNewProfile}
							disabled={isLoading}
						/>
					}
					<Button name="confirm" type="submit" className="btn btn-primary submitButton-customizable"
						variant="success"
						disabled={isLoading}
						onClick={!isLoading ? sendOTP : null}
					>
						{isLoading ? 'Sending...' : `Register New ${updateType}`}
					</Button>
					{isLoading ? <span className='errorMessage-customizable'><Spinner color="primary" style={{ margin: '8px auto' }}>{''}</Spinner></span> : (
						msg && msg.msg ?
							<div>
								<span className={msg.type === 'error' ? 'errorMessage-customizable' : 'infoMessage-customizable'}>
									{msg.msg}</span>
							</div> :
							<div style={{ height: '20px' }} />
					)}
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
							{isLoading ? 'Sending...' : 'Verify'}
						</Button>
					</div>
					<span className='textDescription-customizable'><div className="link-customizable" onClick={() =>
						navigate('/updateotp', {
							state: {
								email,
								apti,
								uuid: location.state ? location.state.uuid : '',
								validated: true,
								otpData: location.state ? location.state.otpData : '',
							}
						})
					}>Back
					</div></span>
				</div>}
		</div >
	);
}

const UpdateProfile = () => {

	return (
		<CONTENT />
	)
}
export default UpdateProfile;