
import authProvider from './authProvider';

export const MyAuthCallbackPage = async () => {

	await authProvider.handleCallback()

	return null;

};
