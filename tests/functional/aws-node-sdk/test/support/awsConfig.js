const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const { config } = require('../../../../../lib/Config');
const https = require('https');

function getAwsCredentials(profile, credFile) {
    const filename = path.join(process.env.HOME, credFile);

    try {
        fs.statSync(filename);
    } catch (e) {
        const msg = `AWS credential file does not exist: ${filename}`;
        throw new Error(msg);
    }

    return new AWS.SharedIniFileCredentials({ profile, filename });
}

function getRealAwsConfig(location) {
    const { awsEndpoint, gcpEndpoint, jsonEndpoint,
        credentialsProfile, credentials: locCredentials,
        bucketName, mpuBucketName, overflowBucketName } =
        config.locationConstraints[location].details;
    const params = {
        endpoint: gcpEndpoint ?
            `https://${gcpEndpoint}` : `https://${awsEndpoint}`,
        signatureVersion: 'v4',
    };
    if (config.locationConstraints[location].type === 'gcp') {
        params.mainBucket = bucketName;
        params.mpuBucket = mpuBucketName;
        params.overflowBucket = overflowBucketName;
        params.jsonEndpoint = `https://${jsonEndpoint}`;
        params.authParams = config.getGcpServiceParams(location);
    }
    if (credentialsProfile) {
        const credentials = getAwsCredentials(credentialsProfile,
            '/.aws/credentials');
        params.credentials = credentials;
        return params;
    }
    params.httpOptions = {
        agent: new https.Agent({
            keepAlive: true,
        }),
    };
    params.accessKeyId = locCredentials.accessKey;
    params.secretAccessKey = locCredentials.secretKey;
    return params;
}

module.exports = {
    getRealAwsConfig,
    getAwsCredentials,
};