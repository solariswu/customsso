export const OTPSend = () => {

	const sendOtp = async ({ otptype, otpaddr }) => {
		setOtp({ ...otp, type: otptype, addr: otpaddr });

		const sendOtpParams = {
			email,
			rememberDevice: false,
			authParam,
			apti,
			otptype,
			otpaddr,
			phase: `pwdreset${otp.stage + 1}`,
		};

		console.log('send otp params:', sendOtpParams);

		setLoading(true);
		setErrorMsg('');
		setInfoMsg('');
		try {
			const result = await fetch(`${apiUrl}/amfa`, {
				method: 'POST',
				body: JSON.stringify(sendOtpParams),
				credentials: 'include',
			});

			switch (result.status) {
				case 202:
					const resultMsg = await result.json();
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
					const resultMsg401 = await result.json();
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
					const res = await result.json();
					if (res) {
						setErrorMsg(res.message ? res.message : res.name ? res.name : JSON.stringify(res));
					}
					else {
						setErrorMsg('Unknown error, please contact help desk.');
					}
					break;
			}
			setLoading(false);
		}
		catch (err) {
			console.error('error in Dual OTP', err);
			setErrorMsg('Dual OTP error, please contact help desk.');
			setLoading(false);
		}
	}
}