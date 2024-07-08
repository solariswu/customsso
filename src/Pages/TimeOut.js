import { applicationUrl } from "../const";


const TimeOut = ({updatetimer}) => {
	const BackToSP = () => {

		return (
			<span><h4>Your login session has been expired</h4>
				<button className="btn btn-primary" onClick={() => window.location.assign(applicationUrl)}>
					Back to Login
				</button>
			</span>
		);
	}

	updatetimer();
	return (
		<BackToSP />
	);
}
export default TimeOut;