import {
	DynamoDBClient,
	GetItemCommand,
} from '@aws-sdk/client-dynamodb';

const headers = {
	'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Api-Key,Set-Cookie,Cookie,X-Requested-With',
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'OPTIONS,GET,POST',
	'Access-Control-Expose-Headers': 'Set-Cookie',
	'Access-Control-Allow-Credentials': 'true',
};

export const handler = async (event) => {
	const configType = 'amfaConfigs';

	const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION });

	const params = {
		TableName: process.env.AMFACONFIG_TABLE,
		Key: {
			configtype: { S: configType },
		},
	};
	const getItemCommand = new GetItemCommand(params);
	const results = await dynamodb.send(getItemCommand);
	console.log(`get ${configType} result:`, results);

	if (results.Item === undefined) {
		throw new Error(`No ${configType} found`);
	}

	const result = JSON.parse(results.Item.value.S);

	return {
		statusCode: 200,
		headers,
		body: JSON.stringify({
			allowSelfService: result.enable_self_service,
			allowSelfSignUp: result.enable_user_registration
		}),
	};

}