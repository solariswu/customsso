import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { Button } from 'reactstrap';

const LOGIN = () => {
	const navigate = useNavigate();
	const location = useLocation();

	const closeQuickView = () => {
		console.log('back pressed');
	}

	useEffect(() => {
		if (!location.state) {
			navigate('/');
		}

		window.history.pushState('fake-route', document.title, window.location.href);

		window.addEventListener('popstate', closeQuickView);
		return () => {
			window.removeEventListener('popstate', closeQuickView);
			// If we left without using the back button, aka by using a button on the page, we need to clear out that fake history event
			if (window.history.state === 'fake-route') {
				window.history.back();
			}
		};
	}, [location.state, navigate]);

	const email = location.state?.email;

	return (
		<div>
			<span><h4>Self Service: verify methods</h4></span>
			<hr className="hr-customizable" />
			<div style={{ width: '40%', margin: 'auto 10px', display: 'inline', height: '40px' }}
			>
				<ul>
					<li>
						<span>Email:</span>
					</li>
					<li>
						<span>{email}</span>
					</li>
				</ul>
			</div>

			<Button
				name='updateEmail'
				type='submit'
				className='btn btn-primary submitButton-customizable'
				style={{ width: '20%', margin: 'auto 10px', display: 'inline', height: '40px' }}
				onClick={null}
			>
				Update
			</Button>

			<hr className='hr-customizable' />
			<div style={{ width: '40%', margin: 'auto 10px', display: 'inline', height: '40px' }}
			>
				<ul>
					<li>
						<span>Email:</span>
					</li>
					<li>
						<span>{email}</span>
					</li>
				</ul>
			</div>

			<Button
				name='updateEmail'
				type='submit'
				className='btn btn-primary submitButton-customizable'
				style={{ width: '20%', margin: 'auto 10px', display: 'inline', height: '40px' }}
				onClick={null}
			>
				Update
			</Button>
		</div >
	);
}

const OTPMethods = () => {

	return (
		<LOGIN />
	)
}
export default OTPMethods;