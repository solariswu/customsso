import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { PublicHostedZone } from 'aws-cdk-lib/aws-route53';

import { WebApplication } from './webapp';

import { TenantApiGateway } from './httpapi';
import { TenantUserPool } from './userpool';

import { config } from './config';


export interface AmfaStackProps extends StackProps {
  siteCertificate: Certificate;
  apiCertificate: Certificate
  hostedZone: PublicHostedZone;
}

export class AmfaStack extends Stack {
  constructor(scope: Construct, id: string, props: AmfaStackProps) {
    super(scope, id, props);

    // frontend
    // use the domain created above to create the frontend web app.
    const webapp = new WebApplication(this, props.siteCertificate, props.hostedZone);

    // backend
    // amfa apis
    const apigateway = new TenantApiGateway(this, props.apiCertificate, props.hostedZone);

    // userpool hostedui customauth-oidc customauth-lambda triggers.
    const tenantUserPool = new TenantUserPool(this);

    // create custom auth oauth endpoints
    apigateway.createOAuthEndpoints(tenantUserPool.customAuthClient, tenantUserPool.userpool);
    apigateway.createAmfaApiEndpoints(tenantUserPool.userpool, tenantUserPool.customAuthClient, tenantUserPool.hostedUIClient.userPoolClientId);

    new CfnOutput(this, 'userPoolId', { value: tenantUserPool.userpool.userPoolId, });

    new CfnOutput(this, 'NoSecret AppClientId', { value: tenantUserPool.hostedUIClient.userPoolClientId, });
    new CfnOutput(this, 'Secret AppClientId', { value: tenantUserPool.secretClient.userPoolClientId, });
    new CfnOutput(this, 'AppClientSecret', { value: tenantUserPool.secretClient.userPoolClientSecret.unsafeUnwrap(), });
    new CfnOutput(this, 'Authorization Endpoint', { value: `https://${config.tenantId}-apersona.auth.${config.region}.amazoncognito.com/oauth2/authorize?identity_provider=apersona`, });
    new CfnOutput(this, 'Token Endpoint', { value: `https://${config.tenantId}-apersona.auth.${config.region}.amazoncognito.com/oauth2/token`, });
    new CfnOutput(this, 'UserInfo Endpoint', { value: `https://${config.tenantId}-apersona.auth.${config.region}.amazoncognito.com/oauth2/userinfo`, });

    new CfnOutput(this, 'cloudFrontId', {value: webapp.distribution.distributionId});
  }
}
