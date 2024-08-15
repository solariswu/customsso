// DNS
export const RootHostedZoneDelegationRoleName = 'CrossAccountDnsDelegationRole-DO-NOT-DELETE';
export const RootHostedZoneDelegationRoleArn = `arn:aws:iam::${process.env.CDK_DEPLOY_ACCOUNT}:role/CrossAccountDnsDelegationRole-DO-NOT-DELETE`;

export const RootDomainName = process.env.ROOT_DOMAIN_NAME;
export const RootHostedZoneId = process.env.ROOT_HOSTED_ZONE_ID;

export const AMFAIdPName = 'apersona';

export const resourceName = 'amfa';
export const totpScopeName = 'totptoken';

export const AMFAUserPoolName = 'aPersona-AWS-aMFA-UserPool';