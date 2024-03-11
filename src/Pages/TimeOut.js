

const TimeOut = ({stoptimer}) => {
	const BackToSP = () => {

		return (
			<span><h4>Your login session has been expired</h4>
				<button className="btn btn-primary" onClick={() => window.history.go(-3)}>
					Back to SP
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