import {
	GetItemCommand,
} from '@aws-sdk/client-dynamodb';

export const fetchConfig = async (configType, dynamodb) => {

	const params = {
		TableName: process.env.CONFIG_TABLE,
		Key: {
			configtype: { S: configType },
		},
	};
	const getItemCommand = new GetItemCommand(params);
	const results = await dynamodb.send(getItemCommand);

	if (results.Item === undefined) {
		throw new Error(`No ${configType} found`);
	}

	const result = JSON.parse(results.Item.value.S);

	console.log(`get ${configType}:`, result);
	return result;

}