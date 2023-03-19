import { CfnOutput, Stack, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as path from 'path';

import { config } from './config';

import { Bucket, BucketAccessControl } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Distribution, OriginAccessIdentity } from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';

import { createUserPool, addHostedUIAppClient, addUserpoolDomain } from './userpool';

import { TenantApiGateway } from './httpapi';


export class AmfaStack extends Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id, {
      env: {
        account: config.awsaccount,
        region: config.region,
      },
    });

    // frontend

    // s3 bucket creation
    const bucket = new Bucket(this, '${config.awsaccount}Bucket', {
      bucketName: `${config.awsaccount}-amfa-${config.stage}`,
      accessControl: BucketAccessControl.PRIVATE,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // assign web release path to s3 deployment
    new BucketDeployment(this, 'BucketDeployment', {
      destinationBucket: bucket,
      sources: [Source.asset(path.resolve(__dirname, '../../build'))],
    });

    // config Cloudfront read to S3
    const originAccessIdentity = new OriginAccessIdentity(
      this,
      'OriginAccessIdentity'
    );
    bucket.grantRead(originAccessIdentity);

    // set up cloudfront
    new Distribution(this, 'Distribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: new S3Origin(bucket, { originAccessIdentity }),
      },
    });

    //backend
    const userPool = createUserPool(this, config.stage);
    const hostedUIClient = addHostedUIAppClient(this, userPool);
    addUserpoolDomain(userPool, config.stage, config.subdomain);

    // const apigateway = createApiGateway(this, config.stage);
    // // 👇 create the Authorizer
    // const authorizer = new CognitoUserPoolsAuthorizer(
    //     this,
    //     'aidaAuthorizer',
    //     {
    //         cognitoUserPools: [userPool]
    //     }
    // );

    // createRESTApiEndpoints(this, apigateway, userPool, authorizer);

    const apigateway = new TenantApiGateway(this, config.tenantId);


    new CfnOutput(this, 'userPoolId', { value: userPool.userPoolId });
    new CfnOutput(this, 'userPoolWebClientId', { value: hostedUIClient.userPoolClientId });

  }
}
