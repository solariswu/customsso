import { RestApi, IResource, LambdaIntegration, Cors, } from 'aws-cdk-lib/aws-apigateway';
import { Function, Code, Runtime } from 'aws-cdk-lib/aws-lambda';
import { ManagedPolicy, Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { UserPoolClient } from 'aws-cdk-lib/aws-cognito';
import { Table, AttributeType, BillingMode } from 'aws-cdk-lib/aws-dynamodb';

import { Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { config } from './config';

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

  constructor(scope: Construct) {
    this.scope = scope;

    this.createApiGateway();
    this.createAmfaApiEndpoints(); // create REST API endpoints for amfa lambda functions
  }

  // create APIGateway
  private createApiGateway() {
    this.api = new RestApi(this.scope, 'TenantApiGateway', {
      description: 'api gateway for serverless',
      // 👇 enable CORS
      defaultCorsPreflightOptions,
    });
  };

  private createAmfaLambda(lambdaName: string) {
    const myLambda = new Function(this.scope, `${lambdaName}lambda-${config.tenantId}`, {
      runtime: Runtime.NODEJS_18_X,
      handler: `${lambdaName}.handler`,
      code: Code.fromAsset(path.join(__dirname, `/../lambda/${lambdaName}`)),
      environment: {
        TENANT_ID: config.tenantId
      },
      timeout: Duration.minutes(2),
    });

    myLambda.role?.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName(
        'AWSLambdaExecute',
      ),
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

  private createAmfaApiEndpoints = () => {
    const amfaLambdaFunctions = ['amfa'];

    amfaLambdaFunctions.map(fnName => {
      const lambdaFn = this.createAmfaLambda(fnName);
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