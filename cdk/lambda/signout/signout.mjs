import {
	DeleteItemCommand,
	DynamoDBClient,
	GetItemCommand,
} from '@aws-sdk/client-dynamodb';

const headers = {
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Api-Key,X-Requested-With',
    'Access-Control-Allow-Origin': `https://${process.env.ALLOW_ORIGIN}`,
	'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'OPTIONS,GET,POST',
	'Access-Control-Allow-Credentials': 'true',
	'Cache-Control': 'no-cache',
	'X-Content-Type-Options': 'nosniff',
};

export const handler = async (event) => {

	console.info("EVENT\n" + JSON.stringify(event, null, 2));

	const payload = JSON.parse(event.body);

	const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION });

	const params = {
		TableName: process.env.SESSION_ID_TABLE,
		Key: {
			uuid: { S: payload.uuid },
		},
	};

	try {
		const getItemCommand = new GetItemCommand(params);
		const results = await dynamodb.send(getItemCommand);
		console.log('removeuuid, get uuid result:', results);

		const email = results.Item.username.S;
		const apti = results.Item.apti.S;

		if (email.trim().toLowerCase() === payload.email.trim().toLowerCase() &&
			(apti === payload.apti || apti === 'updateprofile')) {

			//delete the pwd reset session id once reset is done successfully.
			const deleteItemCommand = new DeleteItemCommand(params);
			const res = await dynamodb.send(deleteItemCommand);

			console.log('removeuuid, delete uuid result:', res);

			return {
				statusCode: 200,
				headers,
				body: JSON.stringify({ message: 'success' }),
				isBase64Encoded: false,
			}
		}
	}
	catch (error) {
		console.log('error', error);
		return {
			statusCode: 500,
			headers,
			body: JSON.stringify(error),
			isBase64Encoded: false,
		};
	}

	return {
		statusCode: 501,
		headers,
		body: JSON.stringify({ message: 'not found' }),
		isBase64Encoded: false,
	}
}