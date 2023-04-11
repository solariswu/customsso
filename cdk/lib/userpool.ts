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
} from 'aws-cdk-lib/aws-cognito';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Duration } from 'aws-cdk-lib';


import { config } from './config';
import { DNS } from './const';
import { createAuthChallengeFn } from './lambda';


export class TenantUserPool {
  scope: Construct;
  userpool: UserPool;
  hostedUIClient: UserPoolClient;
  customAuthClient: UserPoolClient;
  oidcProvider: UserPoolIdentityProviderOidc;
  api: RestApi;

  constructor(scope: Construct, apiGateway: RestApi) {
    this.scope = scope;
    this.api = apiGateway;

    this.userpool = this.createUserPool();
    this.customAuthClient = this.addCustomAuthClient();
    this.addCustomAuthLambdaTriggers();
    this.hostedUIClient = this.addHostedUIAppClient();
    this.oidcProvider = this.createOIDCProvider();
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
      // user attributes
      standardAttributes: {
        email: {
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
  }

  private addCustomAuthClient() {
    return new UserPoolClient(this.scope, 'customAuthClient', {
      userPool: this.userpool,
      generateSecret: true,
      authFlows: {
        // enable custom auth flow
        custom: true,
        userSrp: true,
        adminUserPassword: true,
      },
      userPoolClientName: 'customAuthClient',
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
    });
  };

  private createOIDCProvider() {
    const issuerUrl = `https://cognito-idp.${config.region}.amazonaws.com/${this.userpool.userPoolId}`;
    const customauthUrl = `https://${config.tenantId}.${DNS.RootDomainName}`;

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
          token: `${this.api.url}oauth2/token`,
          userInfo: `https://${config.tenantId}-amfa.auth.${config.region}.amazoncognito.com/oauth2/userinfo`,
        },
        identifiers: ['amfa'],
        name: 'amfa',
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
        domainPrefix: `${config.tenantId}-amfa`,
      },
    });
  };

}
