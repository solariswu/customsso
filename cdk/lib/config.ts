const spPortalUrl = process.env.SP_PORTAL_URL;
const customAppUrl = process.env.EXTRA_APP_URL;

let callbackUrls: string[] = [];
if (spPortalUrl) {
	callbackUrls.push(`${spPortalUrl}/auth-callback`);
	callbackUrls.push(`${spPortalUrl}`)
}
else {
	callbackUrls.push('https://example.com/login')
}
if (customAppUrl) {
	callbackUrls.push(customAppUrl);
}

let logoutUrls: string[] = [];
spPortalUrl ?
	logoutUrls.push(spPortalUrl) :
	logoutUrls.push('https://example.com/logout');
if (customAppUrl) {
	logoutUrls.push(customAppUrl);
}

export const config = [
	{
		'awsaccount': process.env.CDK_DEPLOY_ACCOUNT,
		'region': process.env.CDK_DEPLOY_REGION,
		tenantId: process.env.TENANT_ID, // lowercase only
		tenantName: process.env.TENANT_NAME,
		tenantAuthToken: process.env.TENANT_AUTH_TOKEN,
		mobileTokenKey: process.env.MOBILE_TOKEN_KEY,
		providerId: process.env.ASM_PROVIDER_ID,
		mobileTokenSalt: process.env.MOBILE_TOKEN_SALT,
		asmSalt: process.env.ASM_SALT,
		smtpHost: process.env.SMTP_HOST,
		smtpUser: process.env.SMTP_USER,
		smtpPass: process.env.SMTP_PASS,
		smtpSecure: process.env.SMTP_SECURE,
		smtpPort: process.env.SMTP_PORT,
		spPortalUrl,
		callbackUrls,
		logoutUrls,
		'magicstring': 'youguesswhat',
		// 'serviceName': service_name,
		// 'samlproxyinstanceid': process.env.SAML_INSTANCE_ID,
	}
]

