import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { Button, Spinner } from 'reactstrap';
import { apiUrl, applicationUrl } from '../const';
import { getApti, validateEmail, validatePhoneNumber } from '../Components/utils';

import 'react-phone-number-input/style.css'
import PhoneInput from 'react-phone-number-input';

const CONTENT = () => {
	const navigate = useNavigate();
	const location = useLocation();

	const email = location.state?.email;

	const updateType = location.state?.updateType;
	const legacyProfile = location.state?.profile ? location.state.profile : '';
	const [bundleId, setBundleId] = useState('');
	const [apti, setApti] = useState(null);

	useEffect(() => {
		if (!location.state || !location.state.validated) {
			navigate('/selfservice', {
				state: {
					selfservicemsg: null,
				}
			});
		}

	}, [location.state, navigate]);


	const [msg, setMsg] = useState({ msg: '', type: 'info' });
	const [profile, setProfile] = useState('');
	const [newProfile, setNewProfile] = useState('');
	const [isLoading, setLoading] = useState(false);
	const [isResetDone, setResetDone] = useState(false);
	const [otpcode, setOtpcode] = useState('');
	const [profileInFly, setProfileInFly] = useState('');

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
		if (profile && newData === profile.trim()) {
			setErrorMsg(`New ${updateType} is same as old ${updateType}`);
			return false;
		}

		if (newData === '') {
			setErrorMsg(`You need to input new ${updateType}`);
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
				uuid: bundleId,
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
				case 401:
					navigate('/otpmethods', {
						state: {
							email,
							uuid: location.state ? location.state.uuid : '',
							validated: true,
							otpData: location.state ? location.state.otpData : '',
							msg: {
								msg: 'OTP Method not updated. You may try again.',
								type: 'error'
							}
						}
					})
					return;
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
		if (e)
			e.preventDefault();

		console.log('send register new OTP');
		let newApti = apti;

		if (!apti) {
			newApti = getApti();
			setApti(newApti);
		}

		if (validProfile()) {

			const options = {
				method: 'POST',
				body: JSON.stringify({
					email,
					otptype: otpList[updateType.toLowerCase()],
					newProfile,
					profile,
					apti: newApti,
					uuid: location.state ? location.state.uuid : '',
					rememberDevice: false,
					authParam: window.getAuthParam(),
					phase: 'updateProfileSendOTP',
					isResend: profileInFly === newProfile,
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
							setBundleId(resultMsg.uuid);
							setProfileInFly(newProfile);
						}
						else {
							setErrorMsg('Unknown OTP send error, please contact help desk.');
						}
						break;
					case 401:
						const resultMsg401 = await res.json();
						if (resultMsg401.message) {
							localStorage.setItem('OTPErrorMsg', resultMsg401.message);
							// window.history.go(-3);
							window.location.assign(`${applicationUrl}?err=${resultMsg401.message}`);
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
		//todo: call logout 
		return (
			<div>
				<span className='idpDescription-customizable'> Your {updateType} has been changed. </span><br />
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
								// window.history.go(-3);
								window.location.assign(applicationUrl)
							}
							else { window.close() }
						}
					}
				>
					{applicationUrl ? 'Return to the Login Page' : 'Close this window'}
				</Button>
				<Button name="back" type="submit" className="btn btn-secondary submitButton-customizable-back"
					variant="outline-success"
					onClick={() => navigate('/otpmethods', {
						state: {
							email,
							uuid: location.state ? location.state.uuid : '',
							validated: true,
							msg: { msg: '', type: '' },
						}
					})}
				>
					{'Return to Update Profile'}
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
					{legacyProfile !== '' && <><span className='idpDescription-customizable'> Enter your current {updateType} </span>
						{updateType.toLowerCase() === 'alt email' ?

							<div className="input-group">
								<input id="profile" name="profile" type="email" className="form-control inputField-customizable"
									style={{ height: '40px' }}
									placeholder={"user@email.com"}
									value={profile}
									onChange={(e) => setProfile(e.target.value)}
									autoFocus
									disabled={isLoading}
								/>
							</div> :
							<PhoneInput
								international
								countryCallingCodeEditable={false}
								defaultCountry="US"
								placeholder="phone number"
								value={profile}
								onChange={setProfile}
								disabled={isLoading}
							/>
						}</>}
					<span className='idpDescription-customizable'> Enter your new {updateType} </span>
					{updateType?.toLowerCase() === 'alt email' ?
						<div className="input-group">
							<input id="signInFormNewProfile" name="newProfile" type="email" className="form-control inputField-customizable"
								style={{ height: '40px' }}
								placeholder="user@email.com" value={newProfile} onChange={(e) => setNewProfile(e.target.value)}
								autocomplete='off'
								onKeyUp={e => confirmSubmit(e)}
								disabled={isLoading}
							/> </div> :
						<PhoneInput
							international
							countryCallingCodeEditable={false}
							defaultCountry="US"
							placeholder="phone number"
							value={newProfile}
							autoComplete='off'
							onChange={setNewProfile}
							disabled={isLoading}
						/>
					}
					{newProfile && newProfile.length > 0 &&
						<Button name="confirm" type="submit" className="btn btn-primary submitButton-customizable"
							variant="success"
							disabled={isLoading}
							onClick={sendOTP}
						>
							{isLoading ? 'Sending...' : profileInFly === newProfile ? 'Resend Code' : `Register New ${updateType}`}
						</Button>}
					{isLoading ? <span className='errorMessage-customizable'><Spinner color="primary" style={{ margin: '8px auto' }}>{''}</Spinner></span> : (
						msg && msg.msg ?
							<div>
								<span className={msg.type === 'error' ? 'errorMessage-customizable' : 'infoMessage-customizable'}>
									{msg.msg}</span>
							</div> :
							profileInFly === '' && newProfile && newProfile.length > 0 ?
								<div>
									<span className='infoMessage-customizable'>
										{`Click "Register" and a verification code will be sent to your new ${updateType}.`}
									</span>
								</div> :
								< div style={{ height: '20px' }} />
					)}
					{profileInFly !== '' && profileInFly === newProfile &&
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
						</div>}
					<Button name='back' type="submit" className="btn btn-secondary submitButton-customizable-back"
						disabled={isLoading}
						variant="outline-success"
						onClick={() => navigate('/otpmethods', {
							state: {
								email,
								uuid: location.state ? location.state.uuid : '',
								validated: true,
								msg: { msg: '', type: '' },
							}
						})}
					>
						{'Return to Update Profile'}
					</Button>
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