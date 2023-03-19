#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AmfaStack } from '../lib/amfa-stack';

const app = new cdk.App();
new AmfaStack(app, 'AmfaStack');
