import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { Button } from 'reactstrap';
import { apiUrl, applicationUrl } from '../const';

import 'react-phone-number-input/style.css'
import PhoneInput from 'react-phone-number-input';
import InfoMsg from '../Components/InfoMsg';

const CONTENT = () => {
	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		if (!location.state || !location.state.validated) {
			navigate('/selfservice', {
				state: {
					selfservicemsg: null,
				}
			});
		}

	}, [location.state, navigate]);

	const email = location.state?.email;
	const apti = location.state?.apti;
	const updateType = location.state?.updateType;

	const [msg, setMsg] = useState({ msg: '', type: '' });
	const [profile, setProfile] = useState('');
	const [isLoading, setLoading] = useState(false);
	const [isUpdateDone, setUpdateDone] = useState(false);

	const setErrorMsg = (msg) => {
		setMsg({ msg, type: 'error' });
	}

	const confirmSubmit = (e) => {
		if (e.key === "Enter") {
			handleRemove(e);
		}
	}

	const otpList = { 'alt email': 'ae', 'phone number': 's', 'voice number': 'v' };

	const handleRemove = async (e) => {

		if (!profile || profile.trim().length < 1) {
			setErrorMsg(`Please input your current ${updateType} value`);
			return;
		}

		const options = {
			method: 'POST',
			body: JSON.stringify({
				email,
				profile,
				uuid: location.state ? location.state.uuid : '',
				apti,
				rememberDevice: false,
				authParam: window.getAuthParam(),
				otptype: otpList[updateType.toLowerCase()],
				phase: 'removeProfile'
			}),
		};

		setLoading(true);
		setErrorMsg('');
		try {
			const res = await fetch(`${apiUrl}/amfa`, options);
			switch (res.status) {
				case 200:
					setUpdateDone(true);
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
			setErrorMsg('Remove OTP method Failed. Please try again. If the problem persists, please contact help desk.');
		}
		finally {
			setLoading(false);
		}
	}

	const UpdateDone = () => {
		return (
			<div>
				<span className='idpDescription-customizable'> Your {updateType} has been removed from OTP methods. </span><br />
				<Button name="confirm" type="submit" className="btn btn-primary submitButton-customizable"
					variant="success"
					onClick={{ applicationUrl } ?
						() => window.location.assign(`${applicationUrl}?amfa=relogin`) :
						() => window.close()}
				>
					{applicationUrl ? 'Return to the Login Page' : 'Close this window'}
				</Button>
				<Button name="back" type="submit" className="btn btn-secondary submitButton-customizable"
					variant="outline-success"
					onClick={() => navigate('/updateotp', {
						state: {
							email,
							apti,
							uuid: location.state ? location.state.uuid : '',
							validated: true,
							msg: { msg: '', type: '' },
						}
					})}
				>
					{'Back'}
				</Button>
			</div >
		)
	}

	return (
		<div>
			<span><h4>Remove {updateType} </h4></span>
			<hr className="hr-customizable" />
			{isUpdateDone ? <UpdateDone /> :
				<div>
					<span className='idpDescription-customizable'> Enter your current {updateType} </span>
					{updateType.toLowerCase() === 'alt email' ?

						<div className="input-group">
							<input id="profile" name="profile" type="email" className="form-control inputField-customizable"
								style={{ height: '40px' }}
								placeholder="user@email.com" value={profile} onChange={(e) => setProfile(e.target.value)}
								autoFocus
								disabled={isLoading}
								onKeyUp={confirmSubmit}
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
					}
					<Button name="confirm" type="submit" className="btn submitButton-customizable-danger"
						disabled={isLoading}
						onClick={!isLoading ? handleRemove : null}
					>
						{isLoading ? 'Process...' : 'Remove'}
					</Button>
					<Button name='back' type="submit" className="btn btn-secondary submitButton-customizable"
						variant="outline-success"
						disabled={isLoading}
						onClick={() => navigate('/updateotp', {
							state: {
								email,
								apti,
								uuid: location.state ? location.state.uuid : '',
								validated: true,
								msg: { msg: '', type: '' }
							}
						})}
					>{'Back'}</Button>
					<InfoMsg msg={msg} isLoading={isLoading} />
				</div>}
		</div >
	);
}

const RemoveProfile = () => {

	return (
		<CONTENT />
	)
}
export default RemoveProfile;