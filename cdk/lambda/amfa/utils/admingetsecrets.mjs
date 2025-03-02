import { getSMTP, setSMTP } from "./totp/getKms.mjs"

export const adminGetSecrets = async (tenantId) => {
	console.log('adminGetSecrets, tenantId:', tenantId)
	const amfaSecrets = await getSMTP();
	return {
		...amfaSecrets,
		clientId: process.env.CLIENTCREDENTIALS_ID,
		clientSecret: process.env.CLIENTCREDENTIALS_SECRET,
		domain: `https://${process.env.USERPOOL_DOMAIN}.auth.${process.env.AWS_REGION}.amazoncognito.com/oauth2/token`,
		oauthdomain: `https://${process.env.USERPOOL_DOMAIN}.auth.${process.env.AWS_REGION}.amazoncognito.com/`,
	}
}

export const adminSetSmtp = async (data) => {
	const response = await setSMTP(data.tenantid, data.smtp);
	return response;
}