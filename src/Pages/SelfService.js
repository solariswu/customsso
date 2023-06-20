import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button, Spinner } from 'reactstrap';
import { apiUrl, clientName, allowSelfService } from '../const';
import { getApti, validateEmail } from './utils';

const LOGIN = () => {
	const navigate = useNavigate();

	if (!allowSelfService) {
		navigate('/');
	}

	document.title = 'Update Profile';

	const apti = getApti();

	const [errorMsg, setErrorMsg] = useState(null);
	const [email, setEmail] = useState(localStorage.getItem('amfa-username') || '');
	const [password, setPassword] = useState('');
	const [isLoading, setLoading] = useState(false);

	const confirmLogin = (e) => {
		if (e.key === "Enter") {
			handleSubmit();
		}
	}

	const handleSubmit = async (e) => {
		if (!email || validateEmail(email)) {
			setErrorMsg('Please enter a valid email address');
			return;
		};

		if (!password) {
			setErrorMsg('Please enter password');
			return;
		};

		const options = {
			method: 'POST',
			body: JSON.stringify({ email, password, apti }),
		};

		setLoading(true);
		setErrorMsg('');
		try {
			const res = await fetch(`${apiUrl}/oauth2/admininitauth`, options);

			if (res.status === 200) {
				const response2 = await res.json();

				navigate('/dualotp', {
					state: {
						email,
						apti,
						type: 'updateotp',
						aemail: response2['custom:alter-email']?.toLocaleLowerCase(),
						phoneNumber: response2.phone_number,
						vPhoneNumber: response2['custom:voice-number'] ? response2['custom:voice-number'] : response2.phoneNumber,
						otpOptions: response2.otpOptions,
					}
				});
			}
			else {
				const data = await res.json();

				let errMsg = 'Something went wrong, please try your login again.';

				if (data.name === "NotAuthorizedException") {
					errMsg = 'Invalid credentials.';
				}
				setErrorMsg(errMsg);
			}
		}
		catch (err) {
			setErrorMsg('Password login error, please contact help desk.');
		}
		finally {
			setLoading(false);
		}
	}

	return (
		<div>
			<span><h4>Update Profile</h4></span>
			<hr className="hr-customizable" />
			<span className='idpDescription-customizable'> Login with your {clientName} account </span>
			<div>
				<input name="email" id="email" className="form-control inputField-customizable" placeholder="user@email.com"
					autoCapitalize="none" required aria-label="email"
					value={email} type="email" onChange={(e) => setEmail(e.target.value.toLocaleLowerCase())}
					onKeyUp={e => confirmLogin(e)}
					autoFocus
					disabled={isLoading}
				/><br />
				<span className='idpDescription-customizable'> Please enter your password </span>
				<input id="signInFormPassword" name="password" type="password" className="form-control inputField-customizable"
					placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)}
					onKeyUp={e => confirmLogin(e)}
					disabled={isLoading}
				/>
				<Button name="confirm" type="submit" className="btn btn-primary submitButton-customizable"
					variant="success"
					disabled={isLoading}
					onClick={!isLoading ? handleSubmit : null}
				>
					{isLoading ? 'Sending...' : 'Sign In'}
				</Button>
			</div>

			{!isLoading && <span className='textDescription-customizable'><div className="textLink-customizable" onClick={() =>
				navigate('/dualotp', {
					state: {
						email,
						apti,
						type: 'passwordreset'
					}
				})}>Forgot Password?
			</div></span>}
			{isLoading ? <span className='errorMessage-customizable'><Spinner color="primary" style={{ marginTop: '10px' }} >{''}</Spinner></span> : (
				errorMsg && <div>
					<span className='errorMessage-customizable'>{errorMsg}</span>
				</div>)}
		</div >
	);
}

const SelfService = () => {

	return (
		<LOGIN />
	)
}
export default SelfService;