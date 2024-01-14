import {
	AdminAddUserToGroupCommand,
	AdminCreateUserCommand,
	AdminLinkProviderForUserCommand,
	AdminSetUserPasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { fetchConfig } from './fetchConfig.mjs';


export const signUp = async (username, password, attributes, cognito) => {

	console.log ('username:', username, 'password:', password, 'attributes:', attributes);
	const attJson = [];
	Object.keys(attributes).forEach(key => {
		attJson.push({
			Name: key,
			Value: attributes[key],
		});
	})

	attJson.push ({
		Name: 'email',
		Value: username,
	});

	attJson.push ({
		Name: 'email_verified',
		Value: 'true',
	});

	attJson.push ({
		Name: 'name',
		Value: attributes['given_name'] + ' ' + attributes['family_name'],
	})

	let cognitoParam = {
		UserPoolId: process.env.USERPOOL_ID,
		Username: username.replace('@', '_').replace('.', '_'),
		UserAttributes: attJson,
		TemporaryPassword: password,
		MessageAction: "SUPPRESS",
	};

	console.log('adminCreateUserParam:', cognitoParam);

	const user = await cognito.send(new AdminCreateUserCommand(cognitoParam));
	cognitoParam = {
		UserPoolId: process.env.USERPOOL_ID,
		Username: username,
		Password: password,
		Permanent: true,
	}
	await cognito.send(new AdminSetUserPasswordCommand(cognitoParam));
	// cognitoParam = {
	// 	UserPoolId: process.env.USERPOOL_ID,
	// 	Username: username,
	// }
	// await cognito.send(new AdminConfirmSignUpCommand(cognitoParam));
	const amfaConfigs = await fetchConfig('amfaConfigs');
	const userGroupName = amfaConfigs.user_registration_default_group;

	await cognito.send(new AdminAddUserToGroupCommand({
		GroupName: userGroupName,
		UserPoolId: process.env.USERPOOL_ID,
		Username: username,
	}));

	await cognito.send(new AdminLinkProviderForUserCommand({
		UserPoolId: process.env.USERPOOL_ID,
		DestinationUser: {
			ProviderName: 'Cognito',
			ProviderAttributeName: 'email',
			ProviderAttributeValue: username,
		},
		SourceUser: {
			ProviderName: 'apersona',
			ProviderAttributeName: 'email',
			ProviderAttributeValue: username,
		}
	}))

	console.log('user:', user);
	return user;
}
