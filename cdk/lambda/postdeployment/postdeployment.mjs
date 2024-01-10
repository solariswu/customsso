
import {
	DynamoDBClient,
	PutItemCommand,
} from '@aws-sdk/client-dynamodb';

import { CognitoIdentityProviderClient, CreateGroupCommand } from '@aws-sdk/client-cognito-identity-provider';
import { amfaPolicies, amfaConfigs, amfaBrandings, amfaLegals } from './config.mjs';

const createAmfaConfigs = async (configType, dynamodb) => {
	const values = {
		'amfaPolicies': amfaPolicies,
		'amfaConfigs': amfaConfigs,
		'amfaBrandings': amfaBrandings,
		'amfaLegals': amfaLegals,
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

const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION });
const cognito = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });

export const handler = async (event) => {
	await createAmfaConfigs('amfaPolicies', dynamodb);
	await createAmfaConfigs('amfaBrandings', dynamodb);
	await createAmfaConfigs('amfaConfigs', dynamodb);
	await createAmfaConfigs('amfaLegals', dynamodb);

	const param = {
		GroupName: amfaConfigs.user_registration_default_group,
		UserPoolId: process.env.USERPOOL_ID,
	}

	try {
		await cognito.send(new CreateGroupCommand(param));
	}
	catch (err) {
		console.error('create group failed with:', err);
		console.error('RequestId: ' + err.requestId);
	}
};
