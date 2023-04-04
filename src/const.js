export const clientName = 'epnd-dev001';
export const region = 'eu-west-1';
const rootDomain = 'amfa.aws-amplify.dev';

export const amfaConfigs = {
    'entryUrl': '', //`https://amfa-${clientName}.auth.${region}.amazoncognito.com/login?response_type=code&client_id=${client_id}&redirect_uri=https://${clientName}.epnd.co.uk/&scope=openid+profile+email&state=amfa&idp_id=cognito_amfa`,
    'apiUrl': `https://api.${clientName}.${rootDomain}`,
    'tenantOtpConfigUrl': `https://cdn.jsdelivr.net/gh/solariswu/free-cdn-source@latest/${clientName}-otp-config.json`,
}