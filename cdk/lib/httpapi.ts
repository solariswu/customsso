import { RestApi, IResource, LambdaIntegration, Cors, EndpointType, DomainName} from 'aws-cdk-lib/aws-apigateway';
import { Function, Code, Runtime } from 'aws-cdk-lib/aws-lambda';
import { ManagedPolicy, Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { UserPool, UserPoolClient } from 'aws-cdk-lib/aws-cognito';
import { Table, AttributeType, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { ARecord, PublicHostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { ApiGatewayDomain } from "aws-cdk-lib/aws-route53-targets";

import { Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { config } from './config';
import { DNS } from "./const";

import * as path from 'path';

const defaultCorsPreflightOptions = {
  allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization'],
  allowMethods: Cors.ALL_METHODS,
  allowCredentials: true,
  allowOrigins: Cors.ALL_ORIGINS,
};

export class TenantApiGateway {
  scope: Construct;
  api: RestApi;
  authCodeTable: Table;
  authSessionTable: Table;
  userpool: UserPool;
  certificate: Certificate;
  hostedZone: PublicHostedZone;

  constructor(scope: Construct, certificate: Certificate, hostedZone: PublicHostedZone) {
    this.scope = scope;
    this.certificate = certificate;
    this.hostedZone = hostedZone;

    this.createApiGateway();
  }

  // create APIGateway
  private createApiGateway() {
    const apiDomainName = new DomainName(this.scope, 'TenantApiGatewayDomain', {
      domainName: `api.${config.tenantId}.${DNS.RootDomainName}`,
      certificate: this.certificate,
      endpointType: EndpointType.EDGE
    });

    this.api = new RestApi(this.scope, 'TenantApiGateway', {
      description: 'api gateway for serverless',
      // 👇 enable CORS
      defaultCorsPreflightOptions,
    });

    apiDomainName.addBasePathMapping (this.api);

    new ARecord(this.scope, "apiDNS", {
      zone: this.hostedZone,
      recordName: "api",
      target: RecordTarget.fromAlias(
        new ApiGatewayDomain(apiDomainName)
      ),
    });
  };

  private createAmfaLambda(lambdaName: string, userpool: UserPool) {
    const myLambda = new Function(
      this.scope,
      `${lambdaName}lambda-${config.tenantId}`,
      {
        runtime: Runtime.NODEJS_18_X,
        handler: `${lambdaName}.handler`,
        code: Code.fromAsset(path.join(__dirname, `/../lambda/${lambdaName}`)),
        environment: {
          TENANT_ID: config.tenantId,
          USERPOOL_ID: userpool.userPoolId,
          DOMAIN_NAME: DNS.RootDomainName,
          TENANT_CONFIG_URL: config.tenantConfigUrl,
          AMFA_CONFIG_URL: config.amfaConfigUrl,
        },
        timeout: Duration.minutes(2),
      }
    );

    myLambda.role?.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName(
        'AWSLambdaExecute',
      ),
    );

    const policyStatement =
      new PolicyStatement({
        actions: ['cognito-idp:AdminListGroupsForUser', 'cognito-idp:ListUsers'],
        resources: [`arn:aws:cognito-idp:${config.region}:*:userpool/${userpool.userPoolId}`],
      });

    myLambda.role?.attachInlinePolicy(
      new Policy(this.scope, `amfa-${lambdaName}-lambda-policy`, {
        statements: [policyStatement],
      })
    );

    return myLambda;
  };

  // token endpoint of passworless login lambda function
  private attachLambdaToApiGWService(
    api: IResource,
    lambdaFunction: Function,
    path: string
  ) {
    // 👇 add /lambda path to API Service resource
    const lambdaApi = api.addResource(path, {
      // 👇 enable CORS
      defaultCorsPreflightOptions,
    });

    lambdaApi.addMethod(
      'POST',
      new LambdaIntegration(lambdaFunction, { proxy: true }),
    );
  };

  public createAmfaApiEndpoints = (userpool: UserPool) => {
    const amfaLambdaFunctions = ['amfa'];

    amfaLambdaFunctions.map(fnName => {
      const lambdaFn = this.createAmfaLambda(fnName, userpool);
      this.attachLambdaToApiGWService(this.api.root, lambdaFn, fnName);
    });
  };

  public createOAuthEndpointLambda(
    name: string,
    userpoolclient: UserPoolClient,
    authCodeTableName: string,
    authSessionTableName: string
  ) {
    const policyStatement =
      new PolicyStatement({
        actions: ['dynamodb:GetItem', 'dynamodb:PutItem', 'dynamodb:DeleteItem'],
        resources: ['*'],
      });

    const myLambda = new Function(this.scope, `amfa-customauth-${name}`, {
      runtime: name == 'token' ? Runtime.PYTHON_3_9 : Runtime.NODEJS_18_X,
      handler: name == 'token' ? `my${name}.handler` : `${name}.handler`,
      code: Code.fromAsset(path.join(__dirname, `/../lambda/${name}`)),
      environment: {
        APPCLIENT_ID: userpoolclient.userPoolClientId,
        APP_SECRET: userpoolclient.userPoolClientSecret.unsafeUnwrap(),
        AUTHCODE_TABLE: authCodeTableName,
        AUTHSESSION_TABLE: authSessionTableName,
      },
      timeout: Duration.minutes(5),
    });

    myLambda.role?.attachInlinePolicy(
      new Policy(this.scope, `amfa-customauth-${name}-lambda-policy`, {
        statements: [policyStatement],
      })
    );

    myLambda.role?.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName(
        'AWSLambdaExecute',
      ),
    );

    return myLambda;
  };

  private createAuthCodeTable() {
    const table = new Table(this.scope, `amfa-authcode-${config.tenantId}`, {
      partitionKey: { name: 'authcode', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });
    return table;
  };

  private createAuthSessionTable() {
    const table = new Table(this.scope, `amfa-authsession-${config.tenantId}`, {
      partitionKey: { name: 'username', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });
    return table;
  };

  public createOAuthEndpoints(customAuthClient: UserPoolClient) {
    const oauthEndpointsName = ['challenge', 'token', 'customlogin'];

    // DB for storing custom auth session data
    this.authCodeTable = this.createAuthCodeTable();
    this.authSessionTable = this.createAuthSessionTable();

    const rootPathAPI = this.api.root.addResource('oauth2', {
      // 👇 enable CORS
      defaultCorsPreflightOptions,
    });

    oauthEndpointsName.map((name) => {
      const mylambdaFunction = this.createOAuthEndpointLambda(
        name,
        customAuthClient,
        this.authCodeTable.tableName,
        this.authSessionTable.tableName
      );

      this.attachLambdaToApiGWService(rootPathAPI, mylambdaFunction, name);
    });
  };
}