
import {
	DynamoDBClient,
	PutItemCommand,
} from '@aws-sdk/client-dynamodb';
import { amfaPolicies, amfaConfigs, amfaBrandings } from './config.mjs';

const createAmfaConfigs = async (configType, dynamodb) => {
	const values = { 
		'amfaPolicies': amfaPolicies,
		'amfaConfigs': amfaConfigs,
		'amfaBrandings': amfaBrandings 
	};
	try {
		let value = JSON.stringify(values[configType], null, "  ");

		let params = {
			Item: {
				configtype: {
					S: configType,
				},
				value: {
					S: value,
				},
			},
			ReturnConsumedCapacity: 'TOTAL',
			TableName: process.env.AMFACONFIG_TABLE,
		};

		let putItemCommand = new PutItemCommand(params);
		let results = await dynamodb.send(putItemCommand);
		console.log(`${configType} write result:`, results);

	} catch (err) {
		console.error('create config failed with:', err);
		console.error('RequestId: ' + err.requestId);
	}
}

export const handler = async (event) => {
	const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION });
	await createAmfaConfigs('amfaPolicies', dynamodb);
	await createAmfaConfigs('amfaBrandings', dynamodb);
	await createAmfaConfigs('amfaConfigs', dynamodb);
};
