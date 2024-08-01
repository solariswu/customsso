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
    config.map(tenant => {

      const webapp = new WebApplication(this, props.siteCertificate, props.hostedZone, tenant.tenantId, tenant.awsaccount);
      const ddb = new AmfaServcieDDB(this, tenant.awsaccount, tenant.region, tenant.tenantId);

      const apigateway = new TenantApiGateway(this, props.apiCertificate,
        props.hostedZone, tenant.awsaccount, tenant.region, tenant.tenantId, ddb);
      const tenantUserPool = new TenantUserPool(this, apigateway.configTable,
        tenant.region, tenant.tenantId, tenant.magicstring,
        tenant.callbackUrls,
        tenant.logoutUrls,
        tenant.spPortalUrl, tenant.serviceName);
      apigateway.createOAuthEndpoints(tenantUserPool.customAuthClient, tenantUserPool.userpool, tenant.samlproxyinstanceid);
      apigateway.createAmfaApiEndpoints(tenantUserPool.userpool, tenantUserPool.customAuthClient,
        tenantUserPool.clientCredentialsClient, tenantUserPool.hostedUIClient.userPoolClientId,
        tenantUserPool.userpoolDomain, tenant.magicstring);
      apigateway.createTotpTokenDBEndpoints(tenantUserPool.userpool);

      createPostDeploymentLambda(this, apigateway.configTable, apigateway.tenantTable, tenantUserPool.userpool.userPoolId, tenant.region, tenant.tenantId);

      // output
      new CfnOutput(this, 'userPoolId', { value: tenantUserPool.userpool.userPoolId, });

      // new CfnOutput(this, 'NoSecret AppClientId', { value: tenantUserPool.hostedUIClient.userPoolClientId, });
      // // new CfnOutput(this, 'Secret AppClientId', { value: tenantUserPool.secretClient.userPoolClientId, });
      // // new CfnOutput(this, 'AppClientSecret', { value: tenantUserPool.secretClient.userPoolClientSecret.unsafeUnwrap(), });
      // new CfnOutput(this, 'Authorization Endpoint', { value: `https://${config.tenant.tenantId}-apersona.auth.${config.region}.amazoncognito.com/oauth2/authorize?identity_provider=${AMFAIdPName}`, });
      // new CfnOutput(this, 'Token Endpoint', { value: `https://${config.tenant.tenantId}-apersona.auth.${config.region}.amazoncognito.com/oauth2/token`, });
      // new CfnOutput(this, 'UserInfo Endpoint', { value: `https://${config.tenant.tenantId}-apersona.auth.${config.region}.amazoncognito.com/oauth2/userInfo`, });

    })

    // userpool hostedui customauth-oidc customauth-lambda triggers.

    // create custom auth oauth endpoints


  }
}
