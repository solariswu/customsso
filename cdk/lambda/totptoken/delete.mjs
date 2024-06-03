import { DeleteItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { AdminUpdateUserAttributesCommand } from '@aws-sdk/client-cognito-identity-provider';

export const deleteResData = async (payload, dynamodb, cognito) => {

	console.log('delete all old token from db');

	const email = payload.email.trim().toLowerCase();

	const params = {
		TableName: process.env.TOTPTOKEN_TABLE,
		Key: {
			id: { S: email + '#' + payload.pid.trim() },
		},
		ReturnValues: "ALL_OLD",
	};

	const getRes = await dynamodb.send(new GetItemCommand(params));
	console.log('delete totp - count items from db result', getRes)

	if (getRes.Item) {

		const delRes = await dynamodb.send(new DeleteItemCommand(params));
		console.log('delete totp from db result', delRes)

		try {

			await cognito.send(new AdminUpdateUserAttributesCommand({
				UserPoolId: process.env.USERPOOL_ID,
				Username: email,
				UserAttributes: [{
					Name: 'custom:totp-label',
					Value: ''
				}]
			}));
		}
		catch (error) {
			console.log('error', error);
		}

		// if (needNotify) {
		//     // user may deleted
		//     await notifyProfileChange(email, ['Mobile Token'], [null], logoUrl, isByAdmin);
		// }

		return 1
	}

	return 0;

}
