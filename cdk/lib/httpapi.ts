import { RestApi, IResource, LambdaIntegration, Cors, EndpointType, DomainName, CognitoUserPoolsAuthorizer, AuthorizationType, CorsOptions } from 'aws-cdk-lib/aws-apigateway';
import { Function, Code, Runtime } from 'aws-cdk-lib/aws-lambda';
import { ManagedPolicy, Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { UserPool, UserPoolClient, UserPoolDomain } from 'aws-cdk-lib/aws-cognito';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { ARecord, PublicHostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { ApiGatewayDomain } from "aws-cdk-lib/aws-route53-targets";
import { Vpc, SubnetType, IpAddresses, NatGatewayProvider, CfnEIP } from 'aws-cdk-lib/aws-ec2';

import { Duration, aws_ec2 } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { RootDomainName, resourceName, totpScopeName } from "./const";

import * as path from 'path';
import { ISecret } from 'aws-cdk-lib/aws-secretsmanager';
import { AmfaServcieDDB } from './dynamodb';
import { AmfaSecrets } from './secretmanager';

export class TenantApiGateway {
  scope: Construct;
  account: string | undefined;
  region: string | undefined;
  api: RestApi;
  tenantId: string;
  authCodeTable: Table;
  sessionIdTable: Table;
  configTable: Table;
  tenantTable: Table;
  totpTokenTable: Table;
  pwdHashTable: Table;
  userpool: UserPool;
  certificate: Certificate;
  hostedZone: PublicHostedZone;
  cognitoAuthorizer: CognitoUserPoolsAuthorizer;
  vpc: Vpc;
  secret: ISecret;
  smtpSecret: ISecret;
  asmSecret: ISecret;
  CorsPreflightOptions: CorsOptions;
  eip: CfnEIP;
  // serviceName: string;
  // samlproxyinstanceid: string;

  constructor(scope: Construct, certificate: Certificate, hostedZone: PublicHostedZone,
    account: string | undefined, region: string | undefined, tenantId: string | undefined,
    ddb: AmfaServcieDDB, amfaSecrets: AmfaSecrets) {
    this.scope = scope;
    this.certificate = certificate;
    this.hostedZone = hostedZone;
    this.account = account;
    this.region = region;
    this.tenantId = tenantId ? tenantId : '';
    // this.serviceName = serviceName;

    this.CorsPreflightOptions = {
      allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization'],
      allowMethods: Cors.ALL_METHODS,
      allowCredentials: true,
      allowOrigins: [`https://${this.tenantId}.${RootDomainName}`, `https://*.${this.tenantId}.${RootDomainName}`],
    };

    this.secret = amfaSecrets.secret;
    this.smtpSecret = amfaSecrets.smtpSecret;
    this.asmSecret = amfaSecrets.asmSecret;

    // DB for storing custom auth session data
    this.authCodeTable = ddb.authCodeTable;
    this.configTable = ddb.configTable;
    this.sessionIdTable = ddb.sessionIdTable;
    this.tenantTable = ddb.tenantTable;
    this.totpTokenTable = ddb.totpTokenTable;
    this.pwdHashTable = ddb.pwdHashTable;

    this.createApiGateway();
    this.createVpc();
  }

  // create APIGateway
  private createApiGateway() {
    const apiDomainName = new DomainName(this.scope, 'TenantApiGatewayDomain', {
      domainName: `api.${this.tenantId}.${RootDomainName}`,
      certificate: this.certificate,
      endpointType: EndpointType.EDGE
    });

    this.api = new RestApi(this.scope, 'TenantApiGateway', {
      description: 'api gateway for serverless',
      // 👇 enable CORS
      defaultCorsPreflightOptions: this.CorsPreflightOptions,
    });

    apiDomainName.addBasePathMapping(this.api);

    new ARecord(this.scope, "apiDNS", {
      zone: this.hostedZone,
      recordName: "api",
      target: RecordTarget.fromAlias(
        new ApiGatewayDomain(apiDomainName)
      ),
    });
  };

  private createVpc() {
    this.eip = new CfnEIP(this.scope, 'lambda-natgw-eip');

    this.vpc = new Vpc(this.scope, 'lambda-vpc', {
      ipAddresses: IpAddresses.cidr('10.0.0.0/16'),
      natGateways: 1,
      maxAzs: 1,
      natGatewayProvider: new NatGatewayProvider(/* all optional props */ {
        eipAllocationIds: [this.eip.attrAllocationId],
      }),
      subnetConfiguration: [
        {
          name: 'private-subnet-1',
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'public-subnet-1',
          subnetType: SubnetType.PUBLIC,
          cidrMask: 24,
        },
      ],
    });
  }

  private createPwdResetLambda(tenantId: string, userpool: UserPool, sessionIdTable: Table, pwdHashTable: Table, configTable: Table) {
    const lambdaName = 'passwordreset';
    const pwdResetLambda = new Function(
      this.scope,
      `${lambdaName}-${tenantId}`,
      {
        runtime: Runtime.NODEJS_20_X,
        handler: `${lambdaName}.handler`,
        code: Code.fromAsset(path.join(__dirname, `/../lambda/${lambdaName}/dist`)),
        environment: {
          USERPOOL_ID: userpool.userPoolId,
          SESSION_ID_TABLE: sessionIdTable.tableName,
          PWD_HISTORY_TABLE: pwdHashTable.tableName,
          AMFACONFIG_TABLE: configTable.tableName,
          TENANT_ID: this.tenantId ? this.tenantId : '',
          ALLOW_ORIGIN: `${this.tenantId}.${RootDomainName}`,
          SECRET_NAME: this.secret.secretName,
          ASMSECRET_NAME: this.asmSecret.secretName,
          SMTPSECRET_NAME: this.smtpSecret.secretName,
        },
        timeout: Duration.minutes(5),
        vpc: this.vpc,
        // 👇 place lambda in Private Subnets
        vpcSubnets: {
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
        },
      }
    );

    pwdResetLambda.role?.attachInlinePolicy(
      new Policy(this.scope, `${lambdaName}-iampolicy`, {
        statements: [
          new PolicyStatement({
            resources: [
              userpool.userPoolArn,
            ],
            actions: [
              'cognito-idp:AdminSetUserPassword',
              'cognito-idp:AdminGetUser',
            ],
          }),
          new PolicyStatement({
            resources: [
              pwdHashTable.tableArn,
              sessionIdTable.tableArn,
            ],
            actions: [
              'dynamodb:Scan',
              'dynamodb:Query',
              'dynamodb:GetItem',
              'dynamodb:PutItem',
              'dynamodb:DeleteItem',
              'dynamodb:BatchWriteItem',
            ],
          }),
          new PolicyStatement({
            resources: [
              configTable.tableArn,
            ],
            actions: [
              'dynamodb:Scan',
              'dynamodb:GetItem',
            ],
          }),
          new PolicyStatement({
            actions: ['secretsmanager:GetSecretValue'],
            resources: [
              this.smtpSecret.secretArn + '*',
              this.asmSecret.secretArn + '*',
            ],
          }),
        ],
      })
    );

    return pwdResetLambda;
  }

  private createFeConfigLambda(configTable: Table) {
    const lambdaName = 'feconfig';
    const myLambda = new Function(
      this.scope,
      `${lambdaName}-${this.tenantId}`,
      {
        runtime: Runtime.NODEJS_20_X,
        handler: `${lambdaName}.handler`,
        code: Code.fromAsset(path.join(__dirname, `/../lambda/${lambdaName}`)),
        environment: {
          AMFACONFIG_TABLE: configTable.tableName,
        },
        timeout: Duration.minutes(5),
      }
    );

    myLambda.role?.attachInlinePolicy(
      new Policy(this.scope, `${lambdaName}-policy`, {
        statements: [
          new PolicyStatement({
            resources: [
              configTable.tableArn,
            ],
            actions: [
              'dynamodb:Scan',
              'dynamodb:GetItem',
            ],
          }),
        ],
      })
    );

    return myLambda;
  }

  private createCheckUserLambda(userpool: UserPool) {
    const lambdaName = 'checkuser';
    const myLambda = new Function(
      this.scope,
      `${lambdaName}-${this.tenantId}`,
      {
        runtime: Runtime.NODEJS_20_X,
        handler: `${lambdaName}.handler`,
        code: Code.fromAsset(path.join(__dirname, `/../lambda/${lambdaName}`)),
        environment: {
          USERPOOL_ID: userpool.userPoolId,
        },
        timeout: Duration.minutes(5),
      }
    );

    myLambda.role?.attachInlinePolicy(
      new Policy(this.scope, `${this.tenantId}-${lambdaName}-policy`, {
        statements: [
          new PolicyStatement({
            actions: [
              'cognito-idp:AdminGetUser',
            ],
            resources: [`arn:aws:cognito-idp:${this.region}:*:userpool/${userpool.userPoolId}`],
          }),
        ],
      })
    );

    return myLambda;
  }

  private createVerifyCaptchaLambda() {
    const lambdaName = 'verifyrecaptcha';
    const myLambda = new Function(
      this.scope,
      `${lambdaName}-${this.tenantId}`,
      {
        runtime: Runtime.NODEJS_20_X,
        handler: `${lambdaName}.handler`,
        code: Code.fromAsset(path.join(__dirname, `/../lambda/${lambdaName}`)),
        environment: {
          RECAPTCHA_SECRET: process.env.RECAPTCHA_SECRET ? process.env.RECAPTCHA_SECRET : '',
        },
        timeout: Duration.minutes(5),
      }
    );

    return myLambda;
  }

  private createAmfaLambda(
    lambdaName: string,
    userpool: UserPool,
    userPoolClient: UserPoolClient,
    clientCredentialsClient: UserPoolClient,
    userpoolDomain: UserPoolDomain,
    authCodeTable: Table,
    hostedClientId: string,
    sessionIdTable: Table,
    configTable: Table,
    totpTokenTable: Table,
    pwdhashTable: Table,
    magicstring: string) {

    const myLambda = new Function(
      this.scope,
      `${lambdaName}lambda-${this.tenantId}`,
      {
        runtime: Runtime.NODEJS_20_X,
        handler: `${lambdaName}.handler`,
        code: Code.fromAsset(path.join(__dirname, `/../lambda/${lambdaName}/dist`)),
        environment: {
          TENANT_ID: this.tenantId,
          USERPOOL_ID: userpool.userPoolId,
          DOMAIN_NAME: RootDomainName ? RootDomainName : '',
          AUTHCODE_TABLE: authCodeTable.tableName,
          APPCLIENT_ID: userPoolClient.userPoolClientId,
          APP_SECRET: userPoolClient.userPoolClientSecret.unsafeUnwrap(),
          CLIENTCREDENTIALS_ID: clientCredentialsClient.userPoolClientId,
          CLIENTCREDENTIALS_SECRET: clientCredentialsClient.userPoolClientSecret.unsafeUnwrap(),
          MAGIC_STRING: magicstring,
          HOSTED_CLIENT_ID: hostedClientId,
          SESSION_ID_TABLE: sessionIdTable.tableName,
          AMFACONFIG_TABLE: configTable.tableName,
          TOTPTOKEN_TABLE: totpTokenTable.tableName,
          PWD_HISTORY_TABLE: pwdhashTable.tableName,
          USERPOOL_DOMAIN: userpoolDomain.domainName,
          SECRET_NAME: this.secret.secretName,
          ASMSECRET_NAME: this.asmSecret.secretName,
          SMTPSECRET_NAME: this.smtpSecret.secretName,
        },
        timeout: Duration.minutes(5),
        // 👇 place lambda in the VPC
        vpc: this.vpc,
        // 👇 place lambda in Private Subnets
        vpcSubnets: {
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
        },
      }
    );

    myLambda.role?.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName(
        'AWSLambdaExecute',
      ),
    );

    const policyStatementCognito =
      new PolicyStatement({
        actions: [
          'cognito-idp:AdminListGroupsForUser',
          'cognito-idp:ListUsers',
          'cognito-idp:AdminInitiateAuth',
          'cognito-idp:AdminUpdateUserAttributes',
          'cognito-idp:AdminCreateUser',
          'cognito-idp:AdminAddUserToGroup',
          'cognito-idp:AdminLinkProviderForUser',
          'cognito-idp:AdminSetUserPassword',
          'cognito-idp:AdminResetUserPassword',
        ],
        resources: [`arn:aws:cognito-idp:${this.region}:*:userpool/${userpool.userPoolId}`],
      });


    const policyStatementDB =
      new PolicyStatement({
        actions: [
          'dynamodb:GetItem',
          'dynamodb:PutItem',
          'dynamodb:DeleteItem',
          'dynamodb:Query',
          'dynamodb:BatchWriteItem',
        ],
        resources: [
          authCodeTable.tableArn,
          sessionIdTable.tableArn,
          configTable.tableArn,
          totpTokenTable.tableArn,
          pwdhashTable.tableArn,
        ],
      });

    const policyKmsRead =
      new PolicyStatement({
        actions: ['secretsmanager:GetSecretValue', 'secretsmanager:UpdateSecret'],
        resources: [
          this.secret.secretArn + '*',
          this.smtpSecret.secretArn + '*',
        ],
      });

      const policyKmsWrite =
      new PolicyStatement({
        actions: ['secretsmanager:UpdateSecret'],
        resources: [
          this.smtpSecret.secretArn + '*',
        ],
      });

    myLambda.role?.attachInlinePolicy(
      new Policy(this.scope, `amfa-${lambdaName}-lambda-policy`, {
        statements: [policyStatementCognito, policyStatementDB, policyKmsRead, policyKmsWrite],
      })
    );

    return myLambda;
  };

  private createLogoutLambda(sessionIdTable: Table) {
    const lambdaName = 'signout';
    const myLambda = new Function(
      this.scope,
      `${lambdaName}-${this.tenantId}`,
      {
        runtime: Runtime.NODEJS_20_X,
        handler: `${lambdaName}.handler`,
        code: Code.fromAsset(path.join(__dirname, `/../lambda/${lambdaName}`)),
        environment: {
          SESSION_ID_TABLE: sessionIdTable.tableName,
          ALLOW_ORIGIN: `${this.tenantId}.${RootDomainName}`,
        },
        timeout: Duration.minutes(5),
      }
    );

    myLambda.role?.attachInlinePolicy(
      new Policy(this.scope, `${this.tenantId}-${lambdaName}-policy`, {
        statements: [
          new PolicyStatement({
            resources: [
              sessionIdTable.tableArn,
            ],
            actions: [
              'dynamodb:Scan',
              'dynamodb:GetItem',
              'dynamodb:DeleteItem',
            ],
          }),
        ],
      })
    );

    return myLambda;
  }

  // token endpoint of passworless login lambda function
  private attachLambdaToApiGWService(
    api: IResource,
    lambdaFunction: Function,
    path: string,
    isPost: boolean = true,
  ) {
    // 👇 add /lambda path to API Service resource
    const lambdaApi = api.addResource(path, {
      // 👇 enable CORS
      defaultCorsPreflightOptions: this.CorsPreflightOptions,
    });

    lambdaApi.addMethod(
      isPost ? 'POST' : 'GET',
      new LambdaIntegration(lambdaFunction, { proxy: true }),
    );
  };

  public createAmfaApiEndpoints = (userpool: UserPool, userPoolClient: UserPoolClient,
    clientCredentialsClient: UserPoolClient, hostedClientId: string, userpoolDomain: UserPoolDomain, magicString: string) => {
    const amfaLambdaFunctions = ['amfa'];

    amfaLambdaFunctions.map(fnName => {
      const lambdaFn = this.createAmfaLambda(fnName, userpool,
        userPoolClient, clientCredentialsClient, userpoolDomain, this.authCodeTable, hostedClientId,
        this.sessionIdTable, this.configTable, this.totpTokenTable, this.pwdHashTable, magicString);
      this.attachLambdaToApiGWService(this.api.root, lambdaFn, fnName);
      return fnName;
    });
  };

  public createOAuthEndpointLambda(
    name: string,
    userpool: UserPool,
    userpoolclient: UserPoolClient,
    authCodeTable: Table,
    sessionIdTable: Table,
  ) {

    const policyStatementCognito =
      new PolicyStatement({
        actions: [
          'cognito-idp:AdminInitiateAuth',
        ],
        resources: [`arn:aws:cognito-idp:${this.region}:*:userpool/${userpool.userPoolId}`],
      });

    const policyStatementDB =
      new PolicyStatement({
        actions: [
          'dynamodb:GetItem',
          'dynamodb:PutItem',
          'dynamodb:DeleteItem',
          'dynamodb:Scan',
        ],
        resources: [
          authCodeTable.tableArn,
          sessionIdTable.tableArn,
        ],
      });

    const myLambda = new Function(this.scope, `amfa-customauth-${name}-${this.tenantId}`, {
      runtime: name === 'token' ? Runtime.PYTHON_3_12 : Runtime.NODEJS_20_X,
      handler: name === 'token' ? `my${name}.handler` : `${name}.handler`,
      code: Code.fromAsset(path.join(__dirname, `/../lambda/${name}`)),
      environment: {
        APPCLIENT_ID: userpoolclient.userPoolClientId,
        APP_SECRET: userpoolclient.userPoolClientSecret.unsafeUnwrap(),
        AUTHCODE_TABLE: authCodeTable.tableName,
        SESSION_ID_TABLE: sessionIdTable.tableName,
        USERPOOL_ID: userpool.userPoolId,
      },
      timeout: Duration.minutes(5),
    });

    myLambda.role?.attachInlinePolicy(
      new Policy(this.scope, `amfa-customauth-${name}-lambda-policy-${this.tenantId}`, {
        statements: [policyStatementCognito, policyStatementDB],
      })
    );

    myLambda.role?.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName(
        'AWSLambdaExecute',
      ),
    );

    return myLambda;
  };

  private createTotpTokenLambda(fnName: string, totpTokenTable: Table, userpool: UserPool) {
    const policyStatementDB =
      new PolicyStatement({
        actions: [
          'dynamodb:GetItem',
          'dynamodb:PutItem',
          'dynamodb:DeleteItem',
          'dynamodb:Scan',
        ],
        resources: [
          totpTokenTable.tableArn,
        ],
      });

    const policyStatementDB2 =
      new PolicyStatement({
        actions: [
          'dynamodb:GetItem',
        ],
        resources: [
          this.configTable.tableArn,
        ],
      });

    const policyStatementKms =
      new PolicyStatement({
        actions: ['secretsmanager:GetSecretValue'],
        resources: [
          this.secret.secretArn + '*',
          this.smtpSecret.secretArn + '*',
        ],
      });

    const policyCognito =
      new PolicyStatement({
        actions: [
          'cognito-idp:AdminUpdateUserAttributes',
        ],
        resources: [
          userpool.userPoolArn,
        ]
      })

    const myLambda = new Function(this.scope, `amfa-totptoken-${fnName}-${this.tenantId}`, {
      runtime: Runtime.NODEJS_20_X,
      handler: `${fnName}.handler`,
      code: Code.fromAsset(path.join(__dirname, `/../lambda/${fnName}/dist`)),
      environment: {
        TOTPTOKEN_TABLE: totpTokenTable.tableName,
        TENANT_ID: this.tenantId,
        USERPOOL_ID: userpool.userPoolId,
        AMFACONFIG_TABLE: this.configTable.tableName,
        // SERVICE_NAME: this.serviceName,
      },
      timeout: Duration.minutes(5),
    });

    myLambda.role?.attachInlinePolicy(
      new Policy(this.scope, `amfa-totptoken-${fnName}-lambda-policy-${this.tenantId}`, {
        statements: [policyStatementDB, policyStatementDB2, policyStatementKms, policyCognito],
      })
    );
    return myLambda;
  }

  public createTotpTokenDBEndpoints(userPool: UserPool) {
    const totpTokenLambdaFunctions = [totpScopeName];

    this.cognitoAuthorizer = new CognitoUserPoolsAuthorizer(this.scope, "Authorizer", {
      cognitoUserPools: [userPool],
      identitySource: 'method.request.header.Authorization',
      authorizerName: 'amfa-totp-authorizer',
    });

    totpTokenLambdaFunctions.map(fnName => {
      const lambdaFn = this.createTotpTokenLambda(fnName, this.totpTokenTable, userPool);

      // 👇 add /lambda path to API Service resource
      const tokenApi = this.api.root.addResource(`${fnName}`, {
        // 👇 enable CORS
        defaultCorsPreflightOptions: this.CorsPreflightOptions,
      });

      const lambdaApi = tokenApi.addResource('{id}', {
        defaultCorsPreflightOptions: this.CorsPreflightOptions,
      });

      lambdaApi.addMethod(
        'DELETE',
        new LambdaIntegration(lambdaFn, { proxy: true }),
        {
          authorizationType: AuthorizationType.COGNITO,
          authorizer: this.cognitoAuthorizer,
          authorizationScopes: [resourceName + '/' + totpScopeName],
        }
      );

      lambdaApi.addMethod(
        'GET',
        new LambdaIntegration(lambdaFn, { proxy: true }),
        {
          authorizationType: AuthorizationType.COGNITO,
          authorizer: this.cognitoAuthorizer,
          authorizationScopes: [resourceName + '/' + totpScopeName],
        }
      );

      return lambdaApi;
    });
  }

  public createOAuthEndpoints(customAuthClient: UserPoolClient, userpool: UserPool /*, samlproxyinstanceid: string | undefined*/) {
    const oauthEndpointsName = ['token', 'admininitauth'];

    const rootPathAPI = this.api.root.addResource('oauth2', {
      // 👇 enable CORS
      defaultCorsPreflightOptions: this.CorsPreflightOptions,
    });

    oauthEndpointsName.map(name => {
      const mylambdaFunction = this.createOAuthEndpointLambda(
        name,
        userpool,
        customAuthClient,
        this.authCodeTable,
        this.sessionIdTable,
      );

      this.attachLambdaToApiGWService(rootPathAPI, mylambdaFunction, name);
      return name;
    });

    // create password reset endpoint
    const mylambdaFunction = this.createPwdResetLambda(this.tenantId, userpool, this.sessionIdTable, this.pwdHashTable, this.configTable);
    this.attachLambdaToApiGWService(rootPathAPI, mylambdaFunction, 'passwordreset');

    this.attachLambdaToApiGWService(rootPathAPI, this.createFeConfigLambda(this.configTable), 'feconfig', false);
    this.attachLambdaToApiGWService(rootPathAPI, this.createCheckUserLambda(userpool), 'checkuser');
    this.attachLambdaToApiGWService(rootPathAPI, this.createVerifyCaptchaLambda(), 'verifyrecaptcha');
    this.attachLambdaToApiGWService(rootPathAPI, this.createLogoutLambda(this.sessionIdTable), 'signout');
    // moved to samlproxy apigateway
    // this.attachLambdaToApiGWService(rootPathAPI, this.createReloadSamlProxyLambda(this.tenantId, samlproxyinstanceid), 'reloadsamlproxy', false);
  }
}