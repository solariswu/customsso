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
import { AmfaSecrets } from './secretmanager';


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
      const secrets = new AmfaSecrets (this, tenant.tenantAuthToken,
        tenant.mobileTokenSalt, tenant.mobileTokenKey, tenant.providerId, tenant.asmSalt,
        tenant.smtpHost, tenant.smtpUser, tenant.smtpPass, tenant.smtpPort, tenant.smtpSecure)
      const webapp = new WebApplication(this, props.siteCertificate, props.hostedZone, tenant.tenantId, tenant.awsaccount, false);
      const ddb = new AmfaServcieDDB(this, tenant.awsaccount, tenant.region, tenant.tenantId);

      const apigateway = new TenantApiGateway(this, props.apiCertificate,
        props.hostedZone, tenant.awsaccount, tenant.region, tenant.tenantId, ddb, secrets);
      const tenantUserPool = new TenantUserPool(this, apigateway.configTable,
        tenant.region, tenant.tenantId, tenant.magicstring,
        tenant.callbackUrls,
        tenant.logoutUrls,
        tenant.spPortalUrl,
        process.env.ROOT_DOMAIN_NAME,
        secrets.smtpSecret);
      apigateway.createOAuthEndpoints(tenantUserPool.customAuthClient, tenantUserPool.userpool/*, tenant.samlproxyinstanceid*/);
      apigateway.createAmfaApiEndpoints(tenantUserPool.userpool, tenantUserPool.customAuthClient,
        tenantUserPool.clientCredentialsClient, tenantUserPool.hostedUIClient.userPoolClientId,
        tenantUserPool.userpoolDomain, tenant.magicstring);
      apigateway.createTotpTokenDBEndpoints(tenantUserPool.userpool);

      createPostDeploymentLambda(this, apigateway.configTable, apigateway.tenantTable,
        tenantUserPool.userpool.userPoolId, tenant.region, tenant.tenantId, tenant.tenantName);

      const oauthFullDomain = `https://${tenantUserPool.userpoolDomain.domainName}.auth.${process.env.CDK_DEPLOY_REGION}.amazoncognito.com`;

      const spPortalWebApp = new WebApplication(this, props.apiCertificate, props.hostedZone, tenant.tenantId, tenant.awsaccount, true);
      // output
      new CfnOutput(this, 'Amfa_UserPoolId', { value: tenantUserPool.userpool.userPoolId, exportName: 'useridppoolid', });
      new CfnOutput(this, 'Amfa_UserPoolClientId', { value: tenantUserPool.hostedUIClient.userPoolClientId, });
      new CfnOutput(this, 'Amfa_OauthDomain', { value: oauthFullDomain, });
      new CfnOutput(this, 'Amfa_StaticIPaddress', { value: apigateway.eip.attrPublicIp, });
      new CfnOutput(this, 'Amfa_mobileTokenApiClientId', { value: tenantUserPool.clientCredentialsClient.userPoolClientId, });
      new CfnOutput(this, 'Amfa_mobileTokenApiClientSecret', { value: tenantUserPool.clientCredentialsClient.userPoolClientSecret.unsafeUnwrap(), });
      new CfnOutput(this, 'Amfa_mobileTokenAuthEndpointUri', { value: `${oauthFullDomain}/oauth2/token`, });
      new CfnOutput(this, 'Amfa_mobileTokenApiEndpointUri', { value: `https://api.${process.env.TENANT_ID}.${process.env.ROOT_DOMAIN_NAME}/totptoken`, });
      new CfnOutput(this, 'Amfa_TotpTokenTable', { value: ddb.totpTokenTable.tableName, });
      new CfnOutput(this, 'Amfa_PwdHashTable', { value: ddb.pwdHashTable.tableName, });
      new CfnOutput(this, 'Amfa_SPPortalDistributionId', { value: spPortalWebApp.distribution.distributionId, });
      new CfnOutput(this, 'Amfa_AdminPortalDistributionId', { value: webapp.distribution.distributionId, });

    })


  }
}
