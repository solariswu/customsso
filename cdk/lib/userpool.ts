import { Construct } from 'constructs';
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
  UserPoolClientIdentityProvider,
  StringAttribute,
} from 'aws-cdk-lib/aws-cognito';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Duration } from 'aws-cdk-lib';


import { config } from './config';
import { DNS } from './const';
import { createAuthChallengeFn } from './lambda';

const AMFAIdPName = 'aPersona';

export class TenantUserPool {
  scope: Construct;
  userpool: UserPool;
  hostedUIClient: UserPoolClient;
  customAuthClient: UserPoolClient;
  secretClient: UserPoolClient;
  oidcProvider: UserPoolIdentityProviderOidc;
  api: RestApi;

  constructor(scope: Construct) {
    this.scope = scope;

    this.userpool = this.createUserPool();
    this.customAuthClient = this.addCustomAuthClient();
    this.addCustomAuthLambdaTriggers();
    this.oidcProvider = this.createOIDCProvider();
    this.hostedUIClient = this.addHostedUIAppClient();
    this.hostedUIClient.node.addDependency (this.oidcProvider);
    this.secretClient = this.addSecretClient();
    this.addHostedUIDomain();
  }

  private createUserPool = () => {
    return new UserPool(this.scope, `amfa-userpool}`, {
      userPoolName: `amfaUserPool`,
      // use self sign-in is disable by default
      selfSignUpEnabled: true,
      signInAliases: {
        // username sign-in
        username: true,
        // email as username
        email: true,
        phone: false,
      },
      // signInCaseSensitive: false,
      // user attributes
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
      },
      customAttributes: {
        "alter-email": new StringAttribute({ mutable: true }),
        "voice-number": new StringAttribute({ mutable: true }),
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
  }

  private addCustomAuthClient() {
    return new UserPoolClient(this.scope, 'customAuthClient', {
      userPool: this.userpool,
      generateSecret: true,
      preventUserExistenceErrors: true,
      authFlows: {
        // enable custom auth flow
        custom: true,
        userSrp: true,
        adminUserPassword: true,
      },
      userPoolClientName: 'customAuthClient',
    });
  };

  private addSecretClient() {
    return new UserPoolClient(this.scope, 'secretClient', {
      userPool: this.userpool,
      generateSecret: true,
      preventUserExistenceErrors: true,
      authFlows: {
        userSrp: true,
        adminUserPassword: true,
      },
      userPoolClientName: 'SecretClient',
    });
  };

  private addHostedUIAppClient() {
    return new UserPoolClient(this.scope, 'hostedUIClient', {
      userPool: this.userpool,
      generateSecret: false,
      authFlows: {
        userSrp: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [OAuthScope.OPENID, OAuthScope.PROFILE, OAuthScope.COGNITO_ADMIN],
        callbackUrls: [config.tenantAppUrl, 'http://localhost:3000'],
        logoutUrls: [config.tenantAppUrl, 'http://localhost:3000'],
      },
      userPoolClientName: 'hostedUIClient',
      supportedIdentityProviders: [UserPoolClientIdentityProvider.custom(AMFAIdPName)]
    });
  };

  private createOIDCProvider() {
    const issuerUrl = `https://cognito-idp.${config.region}.amazonaws.com/${this.userpool.userPoolId}`;
    const customauthUrl = `https://${config.tenantId}.${DNS.RootDomainName}`;
    const serviceApiUrl = `https://api.${config.tenantId}.${DNS.RootDomainName}`;

    return new UserPoolIdentityProviderOidc(
      this.scope,
      'Amfa-OIDCProvider',
      {
        clientId: this.customAuthClient.userPoolClientId,
        clientSecret: this.customAuthClient.userPoolClientSecret.unsafeUnwrap(),
        issuerUrl,
        userPool: this.userpool,
        // the properties below are optional
        attributeMapping: {
          email: ProviderAttribute.other('email'),
        },
        attributeRequestMethod: OidcAttributeRequestMethod.GET,
        endpoints: {
          authorization: `${customauthUrl}/oauth2/authorise`,
          jwksUri: `${issuerUrl}/.well-known/jwks.json`,
          token: `${serviceApiUrl}/oauth2/token`,
          userInfo: `https://${config.tenantId}-apersona.auth.${config.region}.amazoncognito.com/oauth2/userinfo`,
        },
        identifiers: ['amfa'],
        name: AMFAIdPName,
        scopes: ['openid email phone aws.cognito.signin.user.admin profile'],
      }
    );
  };

  private addCustomAuthLambdaTriggers() {
    const authChallengeFnsConfig = [
      { name: 'createauthchallenge', runtime: Runtime.PYTHON_3_9 },
      { name: 'defineauthchallenge', runtime: Runtime.NODEJS_18_X },
      { name: 'verifyauthchallenge', runtime: Runtime.NODEJS_18_X },
    ];
    const authChallengeFns = authChallengeFnsConfig.map((fn) =>
      createAuthChallengeFn(this.scope, fn.name, fn.runtime)
    );

    this.userpool.addTrigger(
      UserPoolOperation.CREATE_AUTH_CHALLENGE,
      authChallengeFns[0]
    );
    this.userpool.addTrigger(
      UserPoolOperation.DEFINE_AUTH_CHALLENGE,
      authChallengeFns[1]
    );
    this.userpool.addTrigger(
      UserPoolOperation.VERIFY_AUTH_CHALLENGE_RESPONSE,
      authChallengeFns[2]
    );
  };

  private addHostedUIDomain(
  ) {
    return this.userpool.addDomain('amfaHostedUI-domain', {
      cognitoDomain: {
        domainPrefix: `${config.tenantId}-apersona`,
      },
    });
  };

}
