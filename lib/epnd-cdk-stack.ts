import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { TenantApiGateway } from './httpapi';
import { Tenant_ID } from "./const";
export class EpndCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const apigateway = new TenantApiGateway(this, Tenant_ID);

    new cdk.CfnOutput(this, 'api endpoint url:', { value: apigateway.api.url });
  }
}
