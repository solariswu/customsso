import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { PublicHostedZone } from 'aws-cdk-lib/aws-route53';

import { WebApplication } from './webapp';

import { TenantApiGateway } from './httpapi';
import { TenantUserPool } from './userpool';

import { config } from './config';
import { createPostDeploymentLambda } from './postdeployment';
import { AmfaServcieDDB } from './dynamodb';


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

    // backend
    // amfa apis
    for (var tenantId in config) {
      const webapp = new WebApplication(this, props.siteCertificate, props.hostedZone, tenantId);
      const ddb = new AmfaServcieDDB(this, props.env?.account, props.env?.region, tenantId);

      const apigateway = new TenantApiGateway(this, props.apiCertificate,
        props.hostedZone, props.env?.account, props.env?.region, tenantId, ddb);
      const tenantUserPool = new TenantUserPool(this, apigateway.configTable, props.env?.region, tenantId);
      apigateway.createOAuthEndpoints(tenantUserPool.customAuthClient, tenantUserPool.userpool);
      apigateway.createAmfaApiEndpoints(tenantUserPool.userpool, tenantUserPool.customAuthClient,
        tenantUserPool.clientCredentialsClient, tenantUserPool.hostedUIClient.userPoolClientId,
        tenantUserPool.userpoolDomain);
      apigateway.createTotpTokenDBEndpoints(tenantUserPool.userpool);

      createPostDeploymentLambda(this, apigateway.configTable, apigateway.tenantTable, tenantUserPool.userpool.userPoolId, tenantId);

      // output
      new CfnOutput(this, 'Tenant ID: ', { value: tenantId, });
      new CfnOutput(this, 'userPoolId', { value: tenantUserPool.userpool.userPoolId, });

      // new CfnOutput(this, 'NoSecret AppClientId', { value: tenantUserPool.hostedUIClient.userPoolClientId, });
      // // new CfnOutput(this, 'Secret AppClientId', { value: tenantUserPool.secretClient.userPoolClientId, });
      // // new CfnOutput(this, 'AppClientSecret', { value: tenantUserPool.secretClient.userPoolClientSecret.unsafeUnwrap(), });
      // new CfnOutput(this, 'Authorization Endpoint', { value: `https://${config.tenantId}-apersona.auth.${config.region}.amazoncognito.com/oauth2/authorize?identity_provider=${AMFAIdPName}`, });
      // new CfnOutput(this, 'Token Endpoint', { value: `https://${config.tenantId}-apersona.auth.${config.region}.amazoncognito.com/oauth2/token`, });
      // new CfnOutput(this, 'UserInfo Endpoint', { value: `https://${config.tenantId}-apersona.auth.${config.region}.amazoncognito.com/oauth2/userInfo`, });

    }

    // userpool hostedui customauth-oidc customauth-lambda triggers.

    // create custom auth oauth endpoints


  }
}
