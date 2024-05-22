import { applicationUrl } from "../const";


const TimeOut = ({stoptimer}) => {
	const BackToSP = () => {

		return (
			<span><h4>Your login session has been expired</h4>
				<button className="btn btn-primary" onClick={() => window.location.assign(applicationUrl)}>
					Back to Login
				</button>
			</span>
		);
	}

	stoptimer();
	return (
		<BackToSP />
	);
}
export default TimeOut;