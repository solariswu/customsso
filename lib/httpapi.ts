import {
  RestApi,
  LambdaIntegration,
} from 'aws-cdk-lib/aws-apigateway';
import { Function, Code, Runtime } from 'aws-cdk-lib/aws-lambda';
import { ManagedPolicy } from 'aws-cdk-lib/aws-iam';
import { Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as path from 'path';

const defaultCorsPreflightOptions = {
  allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization'],
  allowMethods: ['OPTIONS', 'GET', 'POST'],
  allowCredentials: true,
  allowOrigins: ['*'],
};

export class TenantApiGateway {
  scope: Construct;
  tenantId: string;
  api: RestApi;

  constructor(scope: Construct, tenantId: string) {
    this.tenantId = tenantId;
    this.scope = scope;

    this.createApiGateway();
    this.createRESTApiEndpoints();
  }

  // create APIGateway
  private createApiGateway() {
    this.api = new RestApi(this.scope, 'TenantApiGateway', {
      description: 'api gateway for serverless',
      // 👇 enable CORS
      defaultCorsPreflightOptions,
    });
  };

  createTenantLambda(lambdaName: string) {
    const myLambda = new Function(this.scope, `Lambda-${lambdaName}`, {
      runtime: Runtime.NODEJS_18_X,
      handler: `${lambdaName}.handler`,
      code: Code.fromAsset(path.join(__dirname, `/../lambda/${lambdaName}`)),
      environment: {
        TENANT_ID: this.tenantId
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
  attachLambdaToApiGWService = (
    lambdaFunction: Function,
    path: string
  ) => {
    // 👇 add /lambda path to API Service resource
    const lambdaApi = this.api.root.addResource(path, {
      // 👇 enable CORS
      defaultCorsPreflightOptions,
    });

    lambdaApi.addMethod(
      'POST',
      new LambdaIntegration(lambdaFunction, { proxy: true }),
    );
  };

  createRESTApiEndpoints = () => {
    const lambdaFunctions = ['amfa'];

    lambdaFunctions.map(fnName => {

      const lambdaFn = this.createTenantLambda(fnName);

      this.attachLambdaToApiGWService(lambdaFn, fnName);

    });
  };
}