import {
	SecretsManagerClient,
	GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";


const client = new SecretsManagerClient({
	region: process.env.AWS_REGION,
});

export const getDBSecret = async () => {
	const secret_name = process.env.TOTP_DB_KEY.substring(0, process.env.TOTP_DB_KEY.lastIndexOf('-'));

	const response = await client.send(
		new GetSecretValueCommand({
			SecretId: secret_name,
		})
	);

	let secret = JSON.parse(response.SecretString);
	secret.user = secret.username;
	delete secret.username;
	delete secret.engine;
	delete secret.dbInstanceIdentifier;
	secret.database = process.env.TOTP_DB_NAME;
	return secret
}

export const getAsmSecret = async () => {

	const secret_name = process.env.TOTP_KEY_NAME.substring(0, process.env.TOTP_KEY_NAME.lastIndexOf('-'));

	const response = await client.send(
		new GetSecretValueCommand({
			SecretId: secret_name,
			VersionStage: "AWSCURRENT", // VersionStage defaults to AWSCURRENT if unspecified
		})
	);
	const secret = JSON.parse(response.SecretString);

	return secret.totpSecret;

}