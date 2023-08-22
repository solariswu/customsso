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

		return secret.totpSecret;

	} catch (error) {
		throw error;
	}

}