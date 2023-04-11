export const clientName = 'epnd-dev002';
export const region = 'eu-west-1';
const rootDomain = 'amfa.aws-amplify.dev';
const appUrl = 'https://amfa.netlify.app/';

export const amfaConfigs = {
    'entryUrl': `https://${clientName}-amfa.auth.${region}.amazoncognito.com/oauth2/authorize?response_type=code&state=amfa&identity_provider=amfa&redirect_uri=${appUrl}`,
    'apiUrl': `https://api.${clientName}.${rootDomain}`,
    'tenantOtpConfigUrl': `https://cdn.jsdelivr.net/gh/solariswu/free-cdn-source@latest/${clientName}-otp-config.json`,
}

// UI STRINGS
export const mfaPageTitle = 'Your login requires an additional verification';
