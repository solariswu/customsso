#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { CertificateStack } from '../lib/certificate';
import { AmfaStack } from '../lib/amfa-stack';
import { config } from '../lib/config';


const app = new App();

const certEnv = {
	account: config.awsaccount,//process.env.CDK_DEFAULT_ACCOUNT,
	region: 'us-east-1',
};

const certStack = new CertificateStack(app, 'CertificateStack', {
	env: certEnv,
	crossRegionReferences: true,
});

const amfaEnv = {
	account: config.awsaccount,//process.env.CDK_DEFAULT_ACCOUNT,
	region: config.region,
}

new AmfaStack(app, 'AmfaStack', {
	siteCertificate: certStack.siteCertificate,
	hostedZone: certStack.hostedZone,
	env: amfaEnv,
	crossRegionReferences: true,
});

app.synth();
