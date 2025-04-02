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

const fetchConfig = async (configType, dynamodb) => {
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

	return JSON.parse(results.Item.value.S);
}

export const handler = async (event) => {

	const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION });

	const FeConfig = await fetchConfig('amfaConfigs', dynamodb);
	const BrandingConfig = await fetchConfig('amfaBrandings', dynamodb);
	const LegalConfig = await fetchConfig('amfaLegals', dynamodb);

	return {
		statusCode: 200,
		headers,
		body: JSON.stringify({
			...FeConfig,
			branding: {
				...BrandingConfig,
			},
			legal: {
				...LegalConfig,
			}
		}),
	};

}