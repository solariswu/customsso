import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { Button } from 'reactstrap';

const LOGIN = () => {
	const navigate = useNavigate();
	const location = useLocation();

	const data = location.state?.otpData ? location.state.otpData : null;
	const email = location.state?.email;
	const apti = location.state?.apti;
	const uuid = location.state?.uuid;

	const closeQuickView = () => {
		console.log('back pressed');
	}

	useEffect(() => {
		console.log('otp methods, location state:', location.state);
		if (!location.state || !location.state.validated) {
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

	return (
		<div>
			<span><h4>Update Profile: verify methods</h4></span>
			<hr className="hr-customizable" />
			<div class="row">
				<div class="col" style={{ margin: 'auto 10px', display: 'inline', height: '40px' }}>
					<div class="row"
						style={{ fontWeight: 'bold' }}
					>
						Alt-Email:
					</div>
					<div class="row" style={{ color: '#C0C0C0' }}>
						{data?.aemail ? data.aemail : '---'}
					</div>
				</div>
				<div class="col-3" style={{ margin: '15px 5px auto', display: 'inline' }}>
					<Button
						name='updateEmail'
						type='submit'
						className='btn btn-sm btn-success'
						onClick={() => navigate('/updateprofile', {
							state: {
								email,
								apti,
								uuid,
								validated: true,
								updateType: 'Alt Email',
								profile: data.aemail,
								otpData: data,
							}
						})}
					>
						Update
					</Button>
				</div>
				<div class="col-3" style={{ margin: '15px 5px auto', display: 'inline' }}>
					{data?.aemail && <Button
						name='RemoveEmail'
						type='submit'
						className='btn btn-sm btn-danger'
						onClick={() => navigate('/removeprofile', {
							state: {
								email,
								apti,
								uuid,
								validated: true,
								updateType: 'Alt Email',
								otpData: data,
							}
						})}
					>
						Remove
					</Button>}
				</div>
			</div>
			<hr className='hr-customizable' />
			<div class="row">
				<div class="col" style={{ margin: 'auto 10px', display: 'inline', height: '40px' }}>
					<div class="row"
						style={{ fontWeight: 'bold' }}
					>
						Mobile Number:
					</div>
					<div class="row" style={{ color: '#C0C0C0' }}>
						{data?.phoneNumber ? data.phoneNumber : '---'}
					</div>
				</div>
				<div class="col-3" style={{ margin: '15px 5px auto', display: 'inline' }}>
					<Button
						name='updatePhone'
						type='submit'
						className='btn btn-sm btn-success'
						onClick={() => navigate('/updateprofile', {
							state: {
								email,
								apti,
								uuid,
								validated: true,
								updateType: 'Phone Number',
								profile: data.phoneNumber,
								otpData: data,
							}
						})}
					>
						Update
					</Button>
				</div>
				<div class="col-3" style={{ margin: '15px 5px auto', display: 'inline' }}>
					{data?.phoneNumber && <Button
						name='RemovePhone'
						type='submit'
						className='btn btn-danger btn-sm'
						onClick={() => navigate('/removeprofile', {
							state: {
								email,
								apti,
								uuid,
								validated: true,
								updateType: 'Phone Number',
								otpData: data,
							}
						})}
					>
						Remove
					</Button>}
				</div>
			</div>
			<hr className='hr-customizable' />
			<div class="row">
				<div class="col" style={{ margin: 'auto 10px', display: 'inline', height: '40px' }}>
					<div class="row"
						style={{ fontWeight: 'bold' }}
					>
						Voice Number:
					</div>
					<div class="row" style={{ color: '#C0C0C0' }}>
						{data?.vPhoneNumber ? data.vPhoneNumber : data.phoneNumber ? data.phoneNumber : '---'}
					</div>
				</div>
				<div class="col-3" style={{ margin: '15px 5px auto', display: 'inline' }}>
					<Button
						name='updateVoice'
						type='submit'
						className='btn btn-sm btn-success'
						onClick={() => navigate('/updateprofile', {
							state: {
								email,
								apti,
								uuid,
								validated: true,
								updateType: 'Voice Number',
								profile: data.vPhoneNumber,
								otpData: data,
							}
						})}
					>
						Update
					</Button>
				</div>
				<div class="col-3" style={{ margin: '15px 5px auto', display: 'inline' }}>
					{ data?.vPhoneNumber && <Button
						name='RemoveVoice'
						type='submit'
						className='btn btn-danger btn-sm'
						onClick={() => navigate('/removeprofile', {
							state: {
								email,
								apti,
								uuid,
								validated: true,
								updateType: 'Voice Number',
								otpData: data,
							}
						})}
					>
						Remove
					</Button>}
				</div>
			</div>
			<hr className='hr-customizable' />
			<div class="row">
				<div class="col" style={{ margin: 'auto 10px', display: 'inline', height: '40px' }}>
					<div class="row"
						style={{ fontWeight: 'bold' }}
					>
						Update Password:
					</div>
					<div class="row" style={{ color: '#C0C0C0' }}></div>
				</div>
				<div class="col-4">
					<Button
						name='updatePassword'
						type='submit'
						className='btn btn-primary submitButton-customizable'
						onClick={() => navigate('/passwordreset', {
							state: {
								email,
								apti,
								uuid,
								validated: true,
								otpData: data,
								backable: true,
							}
						})}
					>
						Update
					</Button>
				</div>
			</div>

		</div >
	);
}

const OTPMethods = () => {

	return (
		<LOGIN />
	)
}
export default OTPMethods;