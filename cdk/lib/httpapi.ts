import { RestApi, IResource, LambdaIntegration, Cors, EndpointType, DomainName, CognitoUserPoolsAuthorizer, AuthorizationType } from 'aws-cdk-lib/aws-apigateway';
import { Function, Code, Runtime } from 'aws-cdk-lib/aws-lambda';
import { ManagedPolicy, Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { UserPool, UserPoolClient } from 'aws-cdk-lib/aws-cognito';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { ARecord, PublicHostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { ApiGatewayDomain } from "aws-cdk-lib/aws-route53-targets";
import { Vpc, SubnetType, IpAddresses } from 'aws-cdk-lib/aws-ec2';

import { Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { config } from './config';
import { DNS } from "./const";

import * as path from 'path';
import { ISecret, Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { AmfaServcieDDB } from './dynamodb';

const defaultCorsPreflightOptions = {
  allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization'],
  allowMethods: Cors.ALL_METHODS,
  allowCredentials: true,
  allowOrigins: Cors.ALL_ORIGINS,
};

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

  constructor(scope: Construct, certificate: Certificate, hostedZone: PublicHostedZone,
    account: string | undefined, region: string | undefined, tenantId: string, ddb: AmfaServcieDDB) {
    this.scope = scope;
    this.certificate = certificate;
    this.hostedZone = hostedZone;
    this.account = account;
    this.region = region;
    this.tenantId = tenantId;

    this.secret = Secret.fromSecretNameV2(scope, `${tenantId}-secret`, `amfa/${tenantId}/secret`);
    this.smtpSecret = Secret.fromSecretNameV2(scope, `${tenantId}-smtpsecret`, `amfa/${tenantId}/smtp`);

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
      domainName: `api.${this.tenantId}.${DNS.RootDomainName}`,
      certificate: this.certificate,
      endpointType: EndpointType.EDGE
    });

    this.api = new RestApi(this.scope, 'TenantApiGateway', {
      description: 'api gateway for serverless',
      // 👇 enable CORS
      defaultCorsPreflightOptions,
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
    this.vpc = new Vpc(this.scope, 'lambda-vpc', {
      ipAddresses: IpAddresses.cidr('10.0.0.0/16'),
      natGateways: 1,
      maxAzs: 1,
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
    const myLambda = new Function(
      this.scope,
      `${lambdaName}-${tenantId}`,
      {
        runtime: Runtime.NODEJS_18_X,
        handler: `${lambdaName}.handler`,
        code: Code.fromAsset(path.join(__dirname, `/../lambda/${lambdaName}`)),
        environment: {
          USERPOOL_ID: userpool.userPoolId,
          SESSION_ID_TABLE: sessionIdTable.tableName,
          PWD_HISTORY_TABLE: pwdHashTable.tableName,
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
              userpool.userPoolArn,
            ],
            actions: [
              'cognito-idp:AdminSetUserPassword',
              'cognito-idp:AdminGetUser',
            ],
          }),
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
          new PolicyStatement({
            resources: [
              pwdHashTable.tableArn,
            ],
            actions: [
              'dynamodb:Scan',
              'dynamodb:Query',
              'dynamodb:PutItem',
              'dynamodb:DeleteItem',
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
          })
        ],
      })
    );

    return myLambda;
  }

  private createFeConfigLambda(configTable: Table) {
    const lambdaName = 'feconfig';
    const myLambda = new Function(
      this.scope,
      `${lambdaName}-${this.tenantId}`,
      {
        runtime: Runtime.NODEJS_18_X,
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
        runtime: Runtime.NODEJS_18_X,
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

  private createReloadSamlProxyLambda(tenantId: string) {
    const lambdaName = 'reloadsamlproxy';
    const myLambda = new Function(
      this.scope,
      `${lambdaName}-${this.tenantId}`,
      {
        runtime: Runtime.NODEJS_18_X,
        handler: `${lambdaName}.handler`,
        code: Code.fromAsset(path.join(__dirname, `/../lambda/${lambdaName}`)),
        environment: {
          SAMLPROXY_INSTANCE_ID: config[tenantId].samlproxyinstanceid,
        },
        timeout: Duration.minutes(5),
      }
    );

    myLambda.role?.attachInlinePolicy(
      new Policy(this.scope, `${this.tenantId}-${lambdaName}-policy`, {
        statements: [
          new PolicyStatement({
            actions: [
              'ssm:SendCommand',
            ],
            resources: [
              `arn:aws:ec2:${this.region}:${config[tenantId].awsaccount}:instance/${config[tenantId].samlproxyinstanceid}`,
              `arn:aws:ssm:${this.region}::document/AWS-RunShellScript`
            ],
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
        runtime: Runtime.NODEJS_18_X,
        handler: `${lambdaName}.handler`,
        code: Code.fromAsset(path.join(__dirname, `/../lambda/${lambdaName}`)),
        environment: {
          RECAPTCHA_SECRET: '',
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
    authCodeTable: Table,
    hostedClientId: string,
    sessionIdTable: Table,
    configTable: Table,
    totpTokenTable: Table,
    pwdhashTable: Table) {

    const myLambda = new Function(
      this.scope,
      `${lambdaName}lambda-${this.tenantId}`,
      {
        runtime: Runtime.NODEJS_18_X,
        handler: `${lambdaName}.handler`,
        code: Code.fromAsset(path.join(__dirname, `/../lambda/${lambdaName}/dist`)),
        environment: {
          TENANT_ID: this.tenantId,
          USERPOOL_ID: userpool.userPoolId,
          DOMAIN_NAME: DNS.RootDomainName,
          AUTHCODE_TABLE: authCodeTable.tableName,
          APPCLIENT_ID: userPoolClient.userPoolClientId,
          APP_SECRET: userPoolClient.userPoolClientSecret.unsafeUnwrap(),
          MAGIC_STRING: config[this.tenantId].magicstring,
          HOSTED_CLIENT_ID: hostedClientId,
          SESSION_ID_TABLE: sessionIdTable.tableName,
          AMFACONFIG_TABLE: configTable.tableName,
          TOTPTOKEN_TABLE: totpTokenTable.tableName,
          PWD_HISTORY_TABLE: pwdhashTable.tableName,
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
        ],
        resources: [`arn:aws:cognito-idp:${this.region}:*:userpool/${userpool.userPoolId}`],
      });


    const policyStatementDB =
      new PolicyStatement({
        actions: [
          'dynamodb:GetItem',
          'dynamodb:PutItem',
          'dynamodb:DeleteItem',
        ],
        resources: [
          authCodeTable.tableArn,
          sessionIdTable.tableArn,
          configTable.tableArn,
          totpTokenTable.tableArn,
        ],
      });

    const policyKms =
      new PolicyStatement({
        actions: ['secretsmanager:GetSecretValue'],
        resources: [
          this.secret.secretArn + '*',
          this.smtpSecret.secretArn + '*',
        ],
      });


    myLambda.role?.attachInlinePolicy(
      new Policy(this.scope, `amfa-${lambdaName}-lambda-policy`, {
        statements: [policyStatementCognito, policyStatementDB, policyKms],
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
        runtime: Runtime.NODEJS_18_X,
        handler: `${lambdaName}.handler`,
        code: Code.fromAsset(path.join(__dirname, `/../lambda/${lambdaName}`)),
        environment: {
          SESSION_ID_TABLE: sessionIdTable.tableName,
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
      defaultCorsPreflightOptions,
    });

    lambdaApi.addMethod(
      isPost ? 'POST' : 'GET',
      new LambdaIntegration(lambdaFunction, { proxy: true }),
    );
  };

  public createAmfaApiEndpoints = (userpool: UserPool, userPoolClient: UserPoolClient, hostedClientId: string) => {
    const amfaLambdaFunctions = ['amfa'];

    amfaLambdaFunctions.map(fnName => {
      const lambdaFn = this.createAmfaLambda(fnName, userpool,
        userPoolClient, this.authCodeTable, hostedClientId,
        this.sessionIdTable, this.configTable, this.totpTokenTable, this.pwdHashTable);
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
      runtime: name === 'token' ? Runtime.PYTHON_3_9 : Runtime.NODEJS_18_X,
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
      runtime: Runtime.NODEJS_18_X,
      handler: `${fnName}.handler`,
      code: Code.fromAsset(path.join(__dirname, `/../lambda/${fnName}/dist`)),
      environment: {
        TOTPTOKEN_TABLE: totpTokenTable.tableName,
        TENANT_ID: this.tenantId,
        USERPOOL_ID: userpool.userPoolId,
        AMFACONFIG_TABLE: this.configTable.tableName
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
    const totpTokenLambdaFunctions = ['totptoken'];

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
        defaultCorsPreflightOptions,
      });

      const lambdaApi = tokenApi.addResource('{id}', {
        defaultCorsPreflightOptions,
      });

      lambdaApi.addMethod(
        'DELETE',
        new LambdaIntegration(lambdaFn, { proxy: true }),
        {
          authorizationType: AuthorizationType.COGNITO,
          authorizer: this.cognitoAuthorizer,
          authorizationScopes: ['amfa/totptoken'],
        }
      );

      lambdaApi.addMethod(
        'GET',
        new LambdaIntegration(lambdaFn, { proxy: true }),
        {
          authorizationType: AuthorizationType.COGNITO,
          authorizer: this.cognitoAuthorizer,
          authorizationScopes: ['amfa/totptoken'],
        }
      );

      return lambdaApi;
    });
  }

  public createOAuthEndpoints(customAuthClient: UserPoolClient, userpool: UserPool) {
    const oauthEndpointsName = ['token', 'admininitauth'];

    const rootPathAPI = this.api.root.addResource('oauth2', {
      // 👇 enable CORS
      defaultCorsPreflightOptions,
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
    this.attachLambdaToApiGWService(rootPathAPI, this.createReloadSamlProxyLambda(this.tenantId), 'reloadsamlproxy', false);
  }
}