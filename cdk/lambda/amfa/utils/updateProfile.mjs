import {
	AdminUpdateUserAttributesCommand,
} from '@aws-sdk/client-cognito-identity-provider';

import { mailer } from './mailer.mjs';
import HTML_TEMPLATE from './htmlTemplate.mjs';

export const updateProfile = async (email, otptype, profile, cognitoClient, smtpConfig) => {
	let UserAttributes = [];
	const profileTypes = {
		'ae': 'alter email',
		'v': 'voice number',
		's': 'phone number',
	}

	switch (otptype) {
		case 'ae':
			UserAttributes.push({
				Name: 'custom:alter-email',
				Value: profile,
			});
			break;
		case 'v':
			UserAttributes.push({
				Name: 'custom:voice-number',
				Value: profile,
			});
			break;
		case 's':
			UserAttributes.push({
				Name: 'phone_number',
				Value: profile,
			});
			UserAttributes.push({
				Name: 'phone_number_verified',
				Value: (profile && profile.length > 0) ? 'true' : 'false',
			});
			break;
		default:
			break;
	}

	const param = new AdminUpdateUserAttributesCommand({
		Username: email,
		UserPoolId: process.env.USERPOOL_ID,
		UserAttributes,
	});

	await cognitoClient.send(param);

	const change = profile && profile.length > 0 ? `changed to \n${profile}` : 'removed';

	const message = `Hi ${email},\n\n Your ${profileTypes[otptype]} MFA has been ${change}.\nIf this is not your desired change, please login check or contact help desk.`
	const options = {
		from: "Admin <admin@amfasolution.com>", // sender address
		to: email, // receiver email
		subject: "Your profile has been updated", // Subject line
		text: message,
		html: HTML_TEMPLATE(email, profileTypes[otptype], profile),
	}

	console.log ('mailer options', options, ' smtp config:', smtpConfig);
	await mailer(options, smtpConfig);

}