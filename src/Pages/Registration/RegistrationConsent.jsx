import { Button, Spinner } from "reactstrap";
import { useState } from 'react';
import { useFeConfigs } from "../../DataProviders/FeConfigProvider"
import { useNavigate } from "react-router-dom";
import InfoMsg from "../../Components/InfoMsg";

const ConsentForm = () => {
	const config = useFeConfigs();
	const navigate = useNavigate();
	const [consent, setConsent] = useState(false);
	const [msg, setMsg] = useState({ msg: '', type: '' });

	const setErrorMsg = (msg) => { setMsg({ msg, type: 'error' }) }

	if (config && config.enable_user_registration) {

		return (
			<div>
				<span>
					<h4>Registration</h4>
				</span>
				<hr className="hr-customizable" />

				<div>
					<span
						style={{ lineHeight: '1rem', color: 'grey' }}
					>
						By signing up, I accept the&nbsp;
						<a href={config?.legal.privacy_policy} target="_blank">
							privacy policy</a>&nbsp;
						and the&nbsp;
						<a href={config?.legal.terms_of_service} target="_blank">
							terms &amp; conditions</a>
					</span>
					<hr className='hr-customizable' />
				</div>
				<div>
					<input
						type="checkbox" id="consent-tick" name="consent-tick"
						checked={consent}
						onChange={() => setConsent(consent => !consent)}
					/>
					<span style={{ fontSize: '1rem', marginLeft: '0.5em', color: 'grey' }}>
						I Agree
					</span>
					<br />
				</div>
				<Button
					name="confirm" type="submit"
					className="btn btn-primary submitButton-customizable"
					onClick={() => {
						if (consent) {
							navigate('/registration', {
								state: { consent: true }
							})
						}
						else {
							setErrorMsg('Please tick the box to confirm')
						}
					}}
				>
					Submit
				</Button>
				<InfoMsg isLoading={false} msg={msg} />
			</div>
		)
	}

	return <Spinner color="primary" style={{ margin: '8px auto' }}>{''}</Spinner>
}

const RegistrationConsent = () => {
	return (
		<ConsentForm />
	)
}
export default RegistrationConsent;
