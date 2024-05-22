import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Button, Spinner } from 'reactstrap';
import { apiUrl, applicationUrl } from '../const';
import { validateEmail } from '../Components/utils';
import { useFeConfigs } from '../DataProviders/FeConfigProvider';

const LOGIN = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const config = useFeConfigs();

	document.title = 'Update Profile';

	const [errorMsg, setErrorMsg] = useState(location.state?.selfservicemsg);
	const [email, setEmail] = useState(localStorage.getItem('amfa-username') || '');
	const [password, setPassword] = useState('');
	const [isLoading, setLoading] = useState(false);

	const confirmLogin = (e) => {
		if (e.key === "Enter") {
			handleSubmit();
		}
	}

	const handleSubmit = async (e) => {
		setErrorMsg('');

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
			body: JSON.stringify({ email, password: password.trim(), apti: 'admininitauth' }),
		};

		setLoading(true);
		setErrorMsg('');
		try {
			const res = await fetch(`${apiUrl}/oauth2/admininitauth`, options);

			if (res.status === 200) {

				navigate('/dualotp', {
					state: {
						email,
						type: 'otpmethods',
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

	if (config && !config.enable_self_service) {
		navigate('/');
		return;
	}



	return (
		<div>
			<span><h4>{config?.branding.update_profile_app_main_page_header}</h4></span>
			<hr className="hr-customizable" />
			<span className='idpDescription-customizable'> {config?.branding.update_profile_app_main_page_message} </span>
			{config?.enable_self_service &&
				<div>
					<input name="email" id="email" className="form-control inputField-customizable" placeholder="user@email.com"
						autoCapitalize="none" required aria-label="email"
						value={email} type="email" onChange={(e) => setEmail(e.target.value)}
						onKeyUp={e => confirmLogin(e)}
						autoFocus
						disabled={isLoading}
					/>
					<span className='idpDescription-customizable'> {config?.branding.update_profile_app_main_page_password_message} </span>
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
						{isLoading ? 'Sending...' : 'Confirm'}
					</Button>
					<Button name="back" type="submit" className="btn btn-primary submitButton-customizable-back"
						variant="success"
						disabled={isLoading}
						onClick={() => window.location.assign(applicationUrl)}
						style={{ marginTop: '10px' }}
					>
						Back to Login
					</Button>
				</div>}

			{
				!isLoading && config && config.enable_password_reset &&
				< span className='textDescription-customizable'><div className="link-customizable" onClick={() => {
					if (email) {
						navigate('/dualotp', {
							state: {
								email,
								type: 'passwordreset'
							}
						})
					}
					else {
						setErrorMsg('Please enter your email address');
					}
				}}>Forgot Password?
				</div></span>
			}
			{
				isLoading || !config ? <span className='errorMessage-customizable'><Spinner color="primary" style={{ marginTop: '10px' }} >{''}</Spinner></span> : (
					errorMsg && <div>
						<span className='errorMessage-customizable'>{errorMsg}</span>
					</div>)
			}
		</div >
	);
}

const SelfService = ({ stoptimer }) => {
	stoptimer();
	return (
		<LOGIN />
	)
}
export default SelfService;