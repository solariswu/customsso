import {Construct} from 'constructs';
import {
  UserPool,
  UserPoolClient,
  OAuthScope,
  AccountRecovery,
  UserPoolIdentityProviderOidc,
  ProviderAttribute,
  OidcAttributeRequestMethod,
  UserPoolOperation,
  Mfa,
} from 'aws-cdk-lib/aws-cognito';
import {Runtime} from 'aws-cdk-lib/aws-lambda';
import {RestApi} from 'aws-cdk-lib/aws-apigateway';
import {Duration} from 'aws-cdk-lib';


import {config} from './config';
import {createAuthChallengeFn} from './lambda';

export const addHostedUIAppClient = (scope: Construct, userpool: UserPool) => {
  return new UserPoolClient(scope, 'hostedUIClient', {
    userPool: userpool,
    generateSecret: false,
    authFlows: {
      userSrp: true,
    },
    oAuth: {
      flows: {
        authorizationCodeGrant: true,
      },
      scopes: [OAuthScope.OPENID, OAuthScope.PROFILE, OAuthScope.COGNITO_ADMIN],
      callbackUrls: [config.redirectUrl, 'http://localhost:3000'],
      logoutUrls: [config.redirectUrl, 'http://localhost:3000'],
    },
    userPoolClientName: 'hostedUIClient',
  });
};

export const addCustomAuthClient = (scope: Construct, userpool: UserPool) => {
  return new UserPoolClient(scope, 'customAuthClient', {
    userPool: userpool,
    generateSecret: true,
    authFlows: {
      // enable custom auth flow
      custom: true,
      userSrp: true,
    },
    userPoolClientName: 'customAuthClient',
  });
};

export const createOIDCProvider = (
  scope: Construct,
  userPool: UserPool,
  hostedUIDomain: string,
  appclient: UserPoolClient,
  api: RestApi,
  customauthUrl: string
) => {
  const issuerUrl = `https://cognito-idp.${userPool.env.region}.amazonaws.com/${userPool.userPoolId}`;

  return new UserPoolIdentityProviderOidc(
    scope,
    'MyUserPoolIdentityProviderOidc',
    {
      clientId: appclient.userPoolClientId,
      clientSecret: appclient.userPoolClientSecret.unsafeUnwrap(),
      issuerUrl,
      userPool,
      // the properties below are optional
      attributeMapping: {
        email: ProviderAttribute.other('email'),
      },
      attributeRequestMethod: OidcAttributeRequestMethod.GET,
      endpoints: {
        authorization: `${customauthUrl}/oauth2/authorise`,
        jwksUri: `https://cognito-idp.${userPool.env.region}.amazonaws.com/${userPool.userPoolId}/.well-known/jwks.json`,
        token: `${api.url}oauth2/token`,
        userInfo: `https://${hostedUIDomain}.auth.${userPool.env.region}.amazoncognito.com/oauth2/userinfo`,
      },
      identifiers: ['customauth'],
      name: 'customauth',
      scopes: ['openid email phone aws.cognito.signin.user.admin profile'],
    }
  );
};

export const addCustomAuthLambdaTriggers = (
  scope: Construct,
  userpool: UserPool
) => {
  const authChallengeFnsConfig = [
    {name: 'createauthchallenge', runtime: Runtime.PYTHON_3_9},
    {name: 'defineauthchallenge', runtime: Runtime.NODEJS_18_X},
    {name: 'verifyauthchallenge', runtime: Runtime.NODEJS_18_X},
  ];
  const authChallengeFns = authChallengeFnsConfig.map((fn) =>
    createAuthChallengeFn(scope, fn.name, fn.runtime)
  );

  userpool.addTrigger(
    UserPoolOperation.CREATE_AUTH_CHALLENGE,
    authChallengeFns[0]
  );
  userpool.addTrigger(
    UserPoolOperation.DEFINE_AUTH_CHALLENGE,
    authChallengeFns[1]
  );
  userpool.addTrigger(
    UserPoolOperation.VERIFY_AUTH_CHALLENGE_RESPONSE,
    authChallengeFns[2]
  );
};

export const createUserPool = (scope: Construct, stageName: string) => {

  const userpool = new UserPool(scope, `amfa-userpool-${stageName}`, {
    userPoolName: `amfa-${stageName}`,
    // use self sign-in is disable by default
    selfSignUpEnabled: true,
    signInAliases: {
      // username sign-in
      username: false,
      // email as username
      email: true,
      phone: false,
    },
    // user attributes
    standardAttributes: {
      email: {
        required: true,
        mutable: true,
      },
      phoneNumber: {
        required: true,
        mutable: true,
      },
    },
    // temporary password lives for 30 days
    passwordPolicy: {
      tempPasswordValidity: Duration.days(30),
      requireSymbols: true,
      requireDigits: true,
      requireLowercase: true,
      requireUppercase: true,
    },
    // no customer attribute
    // MFA optional
    mfa: Mfa.OPTIONAL,
    // forgotPassword recovery method, phone by default
    accountRecovery: AccountRecovery.EMAIL_ONLY,
  });

  return userpool;
};

export const addUserpoolDomain = (
  userpool: UserPool,
  stage: string,
  domainName: string
) => {
  return userpool.addDomain('amfaHostedUI-domain', {
    cognitoDomain: {
      domainPrefix: stage == 'dev' ? `${domainName}-${stage}` : domainName,
    },
  });
};
