import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { Button, Spinner } from 'reactstrap';

import { apiUrl, clientName, applicationUrl } from '../const';

import ReCAPTCHA from "react-google-recaptcha"
import { useRef } from 'react';


const LOGIN = () => {

	const [errorMsg, setErrorMsg] = useState(null);
	const [isLoading, setLoading] = useState(false);
	const [email, setEmail] = useState('');

	const navigate = useNavigate();
	const location = useLocation();
	const captchaRef = useRef(null)


	const apti = location.state?.apti;
	const state = location.state?.state;
	const redirectUri = location.state?.redirectUri;

	const confirmSignUp = (e) => {
		if (e.key === "Enter") {
			signUp();
		}
	}
	const verifyToken = async (token) => {
		let APIResponse = [];

		try {
			const params = {
				reCAPTCHA_TOKEN: token,
				Secret_Key: process.env.SECRET_KEY,
			};

			const options = {
				method: 'POST',
				body: JSON.stringify(params),
				credentials: 'include',
			};
			const res = await fetch(`${apiUrl}/verify`, options);
			const response = await res.json();
			console.log(response);
			APIResponse.push(response);
			return APIResponse;

		} catch (error) {
			console.log(error);
		}
	};

	const isABot = async () => {
		let token = captchaRef.current.getValue();
		captchaRef.current.reset();

		if (token) {
			let valid_token = await verifyToken(token);

			if (valid_token[0].success === true) {
				console.log("verified");
				return true
			} else {
				console.log("not verified");
				setErrorMsg(" Sorry!! Captcha not verified")
			}
		}
		else {
			setErrorMsg("No Captcha Found")
		}
		return false;
	}

	const signUp = async (e) => {
		const mailformat = /^\b[A-Z0-9._+%-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\b$/i;
		setErrorMsg('');

		// /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
		if (!email || !email.match(mailformat)) {
			setErrorMsg('Please enter a valid email address');
			return;
		};

		setLoading(true);

		const isBot = await isABot();

		if (isBot) {
			setLoading(false);
			return;
		}

		const params = {
			email,
			// authParam: window.getAuthParam(),
			apti,
		};

		const options = {
			method: 'POST',
			body: JSON.stringify(params),
		};

		try {
			const res = await fetch(`${apiUrl}/oauth2/checkuser`, options);

			switch (res.status) {
				case 200:
					// const result = await res.json();
					navigate('/passwordreset', {
						state: {
							email,
							apti,
						}
					});
					break;
				default:
					const data = await res.json();
					if (data) {
						setErrorMsg(data.message ? data.message : JSON.stringify(data));
					}
					else {
						setErrorMsg('Unknown error, please contact help desk.');
					}
					break;
			}
			setLoading(false);
		}
		catch (err) {
			console.error('error in sign up', err);
			setErrorMsg('new account sign up error, please contact help desk.');
			setLoading(false);
		}
	}

	return (
		<div>
			<span>
				<h4>Registration</h4>
			</span>
			<hr className="hr-customizable" />
			<span className='idpDescription-customizable'> Enter your {clientName} account ID </span>

			<div>
				<input name="email" id="email" className="form-control inputField-customizable" placeholder="user@email.com"
					autoCapitalize="none" required aria-label="email" value={email} type="email" onChange={(e) => setEmail(e.target.value)}
					onKeyUp={e => confirmSignUp(e)}
					disabled={isLoading}
				/>
				<br />
				<ReCAPTCHA
					sitekey={process.env.REACT_APP_SITE_KEY}
					ref={captchaRef}
				/>
				<Button
					name="confirm" type="submit"
					className="btn btn-primary submitButton-customizable"
					disabled={isLoading}
					onClick={!isLoading ? signUp : null}
				>
					{isLoading ? 'Sending...' : 'Sign In'}
				</Button>
			</div>
			{isLoading ? <span className='errorMessage-customizable'><Spinner color="primary" >{''}</Spinner></span> :
				(errorMsg && <div>
					<br />
					<span className='errorMessage-customizable'>{errorMsg}</span>
				</div>)}
		</div>

	);
}

const Captcha = () => {

	return (
		<LOGIN />
	);
}
export default Captcha;