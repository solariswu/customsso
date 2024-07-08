import { useLocation } from 'react-router-dom';
import { OTP } from "../Components/OTP";

const DualOTP = ({ updatetimer }) => {
	const location = useLocation();

	updatetimer(location.state?.type);
	return (
		<OTP />
	)
}
export default DualOTP;
