import { SSMClient, SendCommandCommand } from "@aws-sdk/client-ssm";

const headers = {
	'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Api-Key,X-Requested-With',
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'OPTIONS,GET,POST',
};

const client = new SSMClient();

export const handler = async (event) => {

	console.info("EVENT\n" + JSON.stringify(event, null, 2));

	const input = { // SendCommandRequest
		InstanceIds: [ // InstanceIdList
			process.env.SAMLPROXY_INSTANCE_ID,
		],
		DocumentName: "AWS-RunShellScript", // required
		TimeoutSeconds: Number(60),
		Parameters: { // Parameters
			"commands": [ // ParameterValueList
				"/usr/bin/sudo /usr/bin/systemctl restart samlproxy.service",
			],
		},
	};

	try {
		const command = new SendCommandCommand(input);
		const result = await client.send(command);
		console.log('restart proxy, get result:', result);

		return {
			statusCode: 200,
			headers,
			body: JSON.stringify({ message: 'success' }),
		}

	}
	catch (error) {
		console.log('error', error);
		return {
			statusCode: 500,
			headers,
			body: JSON.stringify(error),
		};
	}
}