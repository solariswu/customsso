import { stepone } from "./stepone.mjs";

const validateInputParams = (payload) => {
	// check required params here
	// source IPs
	// return event.headers['X-Forwarded-For'].trim().length > 0;

	return (payload && payload.email &&
		payload.apti && payload.rememberDevice && payload.authParam);
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
		const payload = JSON.parse(event.body);

		if (validateInputParams(payload)) {
			const ipAddress = getIPFromHeader(
				event.headers['X-Forwarded-For'].trim()
			);
			const origin = event.headers['origin']?.trim();

			if (
				origin !== `https://${process.env.TENANT_ID}.${process.env.DOMAIN_NAME}`
			) {
				return response(403, JSON.stringify({ message: 'origin not allowed' }));
			}

			let oneEvent = {};
			oneEvent.uIP = ipAddress;
			oneEvent.email = payload.email;
			oneEvent.apti = payload.apti;
			oneEvent.rememberDevice = payload.rememberDevice;
			oneEvent.authParam = payload.authParam;
			oneEvent.origin = `${process.env.TENANT_ID}.${process.env.DOMAIN_NAME}`;

			// todo fetch cookie from header
			// oneEvent.cookieString = event.headers['Cookies']['']';
			console.log ('oneEvent', oneEvent);

			const steponeResponse = await stepone(oneEvent);

			return response(stepone.statusCode, steponeResponse.body);
		} else {
			error = 'incoming params error.';
		}
	} catch (err) {
		console.log (err);
		return response(
			err.statusCode ? err.statusCode : 500,
			JSON.stringify({
				message: 'input param parse error',
			})
		);
	}

	return response(500, JSON.stringify(error));
};
