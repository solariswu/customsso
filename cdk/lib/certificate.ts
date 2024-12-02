import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { Certificate, CertificateValidation } from "aws-cdk-lib/aws-certificatemanager";
import { CrossAccountZoneDelegationRecord, PublicHostedZone } from "aws-cdk-lib/aws-route53";
import { IRole, Role } from "aws-cdk-lib/aws-iam";

import { RootDomainName, RootHostedZoneDelegationRoleArn, RootHostedZoneDelegationRoleName, RootHostedZoneId } from './const';


export class CertificateStack extends Stack {
	siteCertificate: Certificate;
	apiCertificate: Certificate;
	hostedZone: PublicHostedZone;

	constructor(scope: Construct, id: string, props: StackProps, tenantId: string | undefined) {
		super(scope, id, props);

		const certificateResources = new CertificateResources(this, 'certificate', tenantId);
		this.siteCertificate = certificateResources.acmcert;
		this.hostedZone = certificateResources.hostedZone;
		this.apiCertificate = certificateResources.wildcert;
	}
}

export class CertificateResources extends Construct {
	public readonly hostedZone: PublicHostedZone;
	public readonly acmcert: Certificate;
	public readonly wildcert: Certificate;

	constructor(scope: Construct, id: string, tenantId: string | undefined) {
		super(scope, id);

		const hostedZoneName = `${tenantId}-HostedZone`;
		this.hostedZone = new PublicHostedZone(this, hostedZoneName, {
			zoneName: `${tenantId}.${RootDomainName}` // <tenantId>.<rootDomainName>
		});
		this.hostedZone.applyRemovalPolicy(RemovalPolicy.RETAIN);

		// Delegate subdomain by injecting its record to parent domain
		new CrossAccountZoneDelegationRecord(this, `${hostedZoneName}DelegationRecord`, {
			parentHostedZoneId: RootHostedZoneId,
			delegationRole: this.getHostedZoneDelegationRole(this),
			delegatedZone: this.hostedZone
		});

		this.acmcert = new Certificate(this, `${tenantId}-ACMCertificate`, {
			validation: CertificateValidation.fromDns(this.hostedZone),
			domainName: `${tenantId}.${RootDomainName}`,
		});

		this.wildcert = new Certificate(this, `${tenantId}-ACMwildCertificate`, {
			validation: CertificateValidation.fromDns(this.hostedZone),
			domainName: `*.${tenantId}.${RootDomainName}`,
		});
	}

	private getHostedZoneDelegationRole(scope: Construct): IRole {
		return Role.fromRoleArn(scope, RootHostedZoneDelegationRoleName, RootHostedZoneDelegationRoleArn)
	}

}

