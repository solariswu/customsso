import { Spinner } from 'reactstrap';

const InfoMsg = (props) => {
	const { msg, isLoading } = props;
	console.log('props', props);
	console.log('msg', msg);
	return (
		isLoading ?
			<span className='errorMessage-customizable'><Spinner color="primary" style={{ margin: '8px auto' }}>{''}</Spinner></span> :
			(msg && msg.msg ?
				<div>
					<span className={msg.type === 'error' ? 'errorMessage-customizable' : 'infoMessage-customizable'}>
						{msg.msg}</span>
				</div> :
				<div style={{ height: '20px' }} />
			)
	)
}

export default InfoMsg;