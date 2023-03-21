import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { PublicHostedZone } from 'aws-cdk-lib/aws-route53';

import { WebApplication } from './webapp';

import { TenantApiGateway } from './httpapi';
import { TenantUserPool } from './userpool';


export interface AmfaStackProps extends StackProps {
	siteCertificate: Certificate;
	hostedZone: PublicHostedZone;
}

export class AmfaStack extends Stack {
	constructor(scope: Construct, id: string, props: AmfaStackProps) {
		super(scope, id, props);

    // frontend
    // use the domain created above to create the frontend web app.
    const webApp = new WebApplication( this, props.siteCertificate, props.hostedZone);

    // backend
    // amfa apis
    const apigateway = new TenantApiGateway(this);

    // userpool hostedui customauth-oidc customauth-lambda triggers.
    const tenantUserPool = new TenantUserPool(this, apigateway.api);

    // create custom auth oauth endpoints
    apigateway.createOAuthEndpoints(tenantUserPool.customAuthClient);

    new CfnOutput(this, 'userPoolId', {
      value: tenantUserPool.userpool.userPoolId,
    });
    new CfnOutput(this, 'userPoolAppClientId', {
      value: tenantUserPool.hostedUIClient.userPoolClientId,
    });
  }
}
