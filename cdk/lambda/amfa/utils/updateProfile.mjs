import {
	AdminUpdateUserAttributesCommand,
} from '@aws-sdk/client-cognito-identity-provider';

import { notifyProfileChange } from './mailer.mjs';

export const updateProfile = async (email, otptype, profile, logoUrl, cognitoClient) => {
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

	await notifyProfileChange(email, [profileTypes[otptype]], [profile], logoUrl, false);

}