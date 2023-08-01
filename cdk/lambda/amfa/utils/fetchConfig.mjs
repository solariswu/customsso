import {
	DynamoDBClient,
	GetItemCommand,
} from '@aws-sdk/client-dynamodb';

export const fetchConfig = async (configType) => {

	const dynamodb = new DynamoDBClient({region: process.env.AWS_REGION});

    const params = {
      TableName: process.env.AMFACONFIG_TABLE,
      Key: {
        configtype: {S: configType},
      },
    };
	const getItemCommand = new GetItemCommand(params);
	const results = await dynamodb.send(getItemCommand);

	if (results.Item === undefined) {
		throw new Error(`No ${configType} found`);
	}

	const result = JSON.parse(results.Item.value.S);

	console.log (`get ${configType}:`, result);
	return result;

}