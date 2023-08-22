import {
	SecretsManagerClient,
	GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

const secret_name = process.env.TOTP_KEY_NAME.substring(0, process.env.TOTP_KEY_NAME.lastIndexOf('-'));

const client = new SecretsManagerClient({
	region: process.env.AWS_REGION,
});

export const getAsmSecret = async () => {

	try {
		const response = await client.send(
			new GetSecretValueCommand({
				SecretId: secret_name,
				VersionStage: "AWSCURRENT", // VersionStage defaults to AWSCURRENT if unspecified
			})
		);
		const secret = JSON.parse(response.SecretString);

		console.log ('get secret string:', response.SecretString);
		console.log ('secret', secret);
		return secret.totpSecret;

	} catch (error) {
		// For a list of exceptions thrown, see
		// https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
		throw error;
	}

}