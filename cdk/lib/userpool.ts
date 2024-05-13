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
import { DNS, AMFAIdPName } from './const';
import { createAuthChallengeFn, createCustomMessageLambda } from './lambda';
import { Table } from 'aws-cdk-lib/aws-dynamodb';

export class TenantUserPool {
  scope: Construct;
  region: string | undefined;
  userpool: UserPool;
  hostedUIClient: UserPoolClient;
  customAuthClient: UserPoolClient;
  secretClient: UserPoolClient;
  oidcProvider: UserPoolIdentityProviderOidc;
  api: RestApi;
  tenantId: string;

  constructor(scope: Construct, configTable: Table, region:string | undefined, tenantId: string) {
    this.scope = scope;
    this.region = region;
    this.tenantId = tenantId;

    this.userpool = this.createUserPool();
    this.customAuthClient = this.addCustomAuthClient();
    this.addCustomAuthLambdaTriggers();
    this.oidcProvider = this.createOIDCProvider();
    this.hostedUIClient = this.addHostedUIAppClient();
    this.hostedUIClient.node.addDependency(this.oidcProvider);
    this.addHostedUIDomain();
    this.addCustomMessageLambdaTrigger(configTable);
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
        "totp-label": new StringAttribute({ mutable: true }),
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
        callbackUrls: config[this.tenantId].callbackUrls,
        logoutUrls: config[this.tenantId].logoutUrls,
      },
      userPoolClientName: 'hostedUIClient',
      supportedIdentityProviders: [UserPoolClientIdentityProvider.custom(AMFAIdPName)]
    });
  };

  private createOIDCProvider() {
    const issuerUrl = `https://cognito-idp.${this.region}.amazonaws.com/${this.userpool.userPoolId}`;
    const customauthUrl = `https://${this.tenantId}.${DNS.RootDomainName}`;
    const serviceApiUrl = `https://api.${this.tenantId}.${DNS.RootDomainName}`;

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
          phoneNumber: ProviderAttribute.other('phone_number'),
          familyName: ProviderAttribute.other('family_name'),
          givenName: ProviderAttribute.other('given_name'),
          nickname: ProviderAttribute.other('nickname'),
          custom: {
            email_verified: ProviderAttribute.other('email_verified'),
            phone_number_verified: ProviderAttribute.other('phone_number_verified'),
            'custom:alter-email': ProviderAttribute.other('custom:alter-email'),
            'custom:voice-number': ProviderAttribute.other('custom:voice-number')
          },
        },
        attributeRequestMethod: OidcAttributeRequestMethod.GET,
        endpoints: {
          authorization: `${customauthUrl}/oauth2/authorize`,
          jwksUri: `${issuerUrl}/.well-known/jwks.json`,
          token: `${serviceApiUrl}/oauth2/token`,
          userInfo: `https://${this.tenantId}-apersona.auth.${this.region}.amazoncognito.com/oauth2/userInfo`,
        },
        identifiers: ['apersona'],
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
      createAuthChallengeFn(this.scope, fn.name, fn.runtime, this.tenantId)
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

  private addCustomMessageLambdaTrigger(configTable) {
    const lambdaFn = createCustomMessageLambda(
      this.scope, configTable, this.tenantId
    );
    this.userpool.addTrigger(
      UserPoolOperation.CUSTOM_MESSAGE,
      lambdaFn
    );
  }

  private addHostedUIDomain(
  ) {
    return this.userpool.addDomain('amfaHostedUI-domain', {
      cognitoDomain: {
        domainPrefix: `${this.tenantId}-apersona`,
      },
    });
  };

}
