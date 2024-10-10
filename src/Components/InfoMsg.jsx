import { Spinner } from 'reactstrap';

const InfoMsg = (props) => {
	const { msg, isLoading } = props;
	return (
		isLoading ?
			<Spinner color="primary" style={{ margin: '8px auto' }}>{''}</Spinner> :
			<span className='errorMessage-customizable'>
				{msg && msg.msg && msg.msg.length > 0 ?
					<div>
						<span className={msg.type === 'error' ? 'errorMessage-customizable' : 'infoMessage-customizable'}>
							{msg.msg}</span>
					</div> :
					<div style={{ height: '20px' }} />
				}
			</span>
	)
}

export default InfoMsg;