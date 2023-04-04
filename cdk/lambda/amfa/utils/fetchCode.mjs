import {
	DynamoDBClient,
	GetItemCommand,
} from '@aws-sdk/client-dynamodb';

export const fetchCode = async (username, apti) => {

	const dynamodb = new DynamoDBClient({region: process.env.AWS_REGION});

    const params = {
      TableName: process.env.AUTHCODE_TABLE,
      Key: {
        username: {S: username},
		apti: {S: apti}
      },
    };
	const getItemCommand = new GetItemCommand(params);
	const results = await dynamodb.send(getItemCommand);
	console.log('get authcode result:', results);

	const state = results.Item.state.S;
	const authCode = results.Item.authCode.S;
	const redirectUri = results.Item.redirectUri.S;

	return `${redirectUri}/?code=${authCode}&state=${state}`;

}