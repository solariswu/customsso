import { stepone } from "./stepone.mjs";

const validateInputParams = (event) => {
	// check required params here
	// source IPs
	return event.headers['X-Forwarded-For'].trim().length > 0;
};

const headers = {
	'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Api-Key',
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'OPTIONS,GET,POST',
};

const response = (statusCode = 200, body) => {
	return {
		statusCode,
		headers,
		body,
	};
};

const getIPFromHeader = (fwdfor) => {
	const IPs = fwdfor.split(',');
	return IPs[0];
}
// lambda for rest api
export const handler = async (event) => {
	console.log('Received event:', JSON.stringify(event, null, 2));

	let error = '';

	try {
		// const payload = JSON.parse(event.body);

		if (validateInputParams(event)) {
			//  const username = payload.username;
			const ipAddress = getIPFromHeader(event.headers['X-Forwarded-For'].trim());

			let oneEvent = {};
			oneEvent.uIP = ipAddress;
			oneEvent.email = event.email;
			oneEvent.apti = event.apti;
			oneEvent.rememberDevice = event.rememberDevice;
			oneEvent.authParam = event.authParam;

			// todo fetch cookie from header
			// oneEvent.cookieString = event.cookieString;

			stepone (oneEvent);

			return response(200, JSON.stringify({ message: `requester IP is: ${ipAddress}` }));
		} else {
			error = 'incoming params error.';
		}
	} catch (err) {
		return response(
			err.statusCode,
			JSON.stringify({
				message: 'input param parse error',
			})
		);
	}

	return response(500, JSON.stringify(error));
};
