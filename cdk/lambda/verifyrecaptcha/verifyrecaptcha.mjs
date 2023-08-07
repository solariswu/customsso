const headers = {
	'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Api-Key,Set-Cookie,Cookie,X-Requested-With',
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'OPTIONS,GET,POST',
	'Access-Control-Expose-Headers': 'Set-Cookie',
	'Access-Control-Allow-Credentials': 'true',
};

export const handler = async (event, context, callback) => {

	console.log('event:', event);

	const payload = JSON.parse(event.body);
	try {
		const recaptRes = await fetch('https://www.google.com/recaptcha/api/siteverify',
			{
				method: 'POST',
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: `secret=${process.env.RECAPTCHA_SECRET}&response=${payload.token}`,
			});

		console.log('recaptRes:', recaptRes);

		const recaptResBody = await recaptRes.json();
		if (recaptResBody.success) {
			callback(null, {
				statusCode: 200,
				headers,
				body: JSON.stringify({
					success: true
				})
			});
		}

		console.log('recaptResBody:', recaptResBody);
		callback(null, {
			statusCode: 200,
			headers,
			body: JSON.stringify({
				success: false
			})
		});

	}
	catch (e) {
		callback(null, {
			statusCode: 500,
			headers,
			body: JSON.stringify({
				success: false
			})
		});
	}
}