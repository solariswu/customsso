import { useLocation } from 'react-router-dom';
import { OTP } from "../Components/OTP";
import { useEffect } from 'react';

const DualOTP = ({ updatetimer }) => {
	const location = useLocation();

	useEffect(() => {
		updatetimer(location.state?.type);
	}, [])

	return (
		<OTP />
	)
}
export default DualOTP;
