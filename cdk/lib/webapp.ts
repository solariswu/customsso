
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { ARecord, PublicHostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";

import { Bucket, BucketAccessControl } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { Distribution, OriginAccessIdentity } from 'aws-cdk-lib/aws-cloudfront';
import { S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';

import { RemovalPolicy, Duration } from "aws-cdk-lib";
import { Construct } from "constructs";

import { RootDomainName } from './const';
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
    tenantId: string;
    accountId: string | undefined;

    constructor(scope: Construct, certificate: Certificate, hostedZone: PublicHostedZone, 
        tenantId: string | undefined, accountId: string | undefined) {
        this.scope = scope;
        this.domainName = `${tenantId}.${RootDomainName}`;
        this.certificate = certificate;
        this.hostedZone = hostedZone;
        this.tenantId = tenantId?tenantId:'';
        this.accountId = accountId;

        this.distribution = this.createDistribution();
        this.aRecord = this.createRoute53ARecord();
    }

    private createS3Bucket() {
        return new Bucket(this.scope, 'amfaWebAppDeployBucket', {
            bucketName: `${this.accountId}-amfa-${this.tenantId.toLowerCase()}`,
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

        // config Cloudfront read to S3
        const originAccessIdentity = new OriginAccessIdentity(
            this.scope,
            'OriginAccessIdentity'
        );
        bucket.grantRead(originAccessIdentity);

        // set up cloudfront
        const distribution = new Distribution(this.scope, 'Distribution', {
            defaultRootObject: 'index.html',
            domainNames: [`${this.tenantId}.${RootDomainName}`],
            certificate: this.certificate,
            defaultBehavior: {
                origin: S3BucketOrigin.withOriginAccessControl(bucket),
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

        // assign web release path to s3 deployment
        new BucketDeployment(this.scope, 'BucketDeployment', {
            destinationBucket: bucket,
            sources: [Source.asset(path.resolve(__dirname, '../../build'))],
            distribution,
            distributionPaths: ['/*'],
        });

        return distribution;
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
