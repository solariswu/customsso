
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { ARecord, PublicHostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";

import { Bucket, BucketAccessControl } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { Distribution, OriginAccessIdentity } from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';

import { RemovalPolicy, Duration } from "aws-cdk-lib";
import { Construct } from "constructs";

import { config } from "./config";
import { DNS } from './const';
import * as path from 'path';

export class WebApplication {
	scope: Construct
	name: string;
	domainName: string;
	certificate: Certificate;
	hostedZone: PublicHostedZone;
	aRecord: ARecord;
	s3bucket: Bucket;
	distribution: Distribution;

	constructor(scope: Construct, certificate: Certificate, hostedZone: PublicHostedZone) {
		this.scope = scope;
		this.domainName = `${config.tenantId}.${DNS.RootDomainName}`;
		this.certificate = certificate;
		this.hostedZone = hostedZone;

		this.distribution = this.createDistribution();
		this.aRecord = this.createRoute53ARecord();
	}

	private createS3Bucket() {
		return new Bucket(this.scope, 'amfaWebAppDeployBucket', {
			bucketName: `${config.awsaccount}-amfa-${config.tenantId.toLowerCase()}`,
			accessControl: BucketAccessControl.PRIVATE,
			removalPolicy: RemovalPolicy.DESTROY,
		});

	}

	// private createACMCert() {
	// 	const cert: Certificate = new Certificate(this.scope, `AMfa${config.tenantId}-Certificate`, {
	// 		domainName: this.domainName,
	// 		validation: CertificateValidation.fromDns(this.hostedZone),
	// 	});
	// 	return cert;
	// }

	private createDistribution(bucket: Bucket = this.createS3Bucket()) {
		// assign web release path to s3 deployment
		new BucketDeployment(this.scope, 'BucketDeployment', {
			destinationBucket: bucket,
			sources: [Source.asset(path.resolve(__dirname, '../../build'))],
		});

		// config Cloudfront read to S3
		const originAccessIdentity = new OriginAccessIdentity(
			this.scope,
			'OriginAccessIdentity'
		);
		bucket.grantRead(originAccessIdentity);

		// set up cloudfront
		return new Distribution(this.scope, 'Distribution', {
			defaultRootObject: 'index.html',
			domainNames: [`${config.tenantId}.${DNS.RootDomainName}`],
			certificate: this.certificate,
			defaultBehavior: {
				origin: new S3Origin(bucket, { originAccessIdentity }),
			},
			errorResponses: [{
				httpStatus: 403,
				responseHttpStatus: 403,
				responsePagePath: '/index.html',
				ttl: Duration.minutes(30),
			}, {
				httpStatus: 404,
				responseHttpStatus: 404,
				responsePagePath: '/index.html',
				ttl: Duration.minutes(30),
			}],
		});
	}

	private createRoute53ARecord(distribution: Distribution = this.distribution, hostedZone: PublicHostedZone = this.hostedZone): ARecord {
		return new ARecord(this.scope, 'Route53ARecordSet', {
			recordName: this.domainName,
			zone: this.hostedZone,
			target: RecordTarget.fromAlias(
				new CloudFrontTarget(distribution)
			),
		});
	}

}
