'use strict';

console.log('Loading function');
const doc = require('dynamodb-doc');
const dynamo = new doc.DynamoDB();

const AWS = require('aws-sdk');
const s3 = new AWS.S3(); 

exports.handler = (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    
    var writeResultsToS3 = (err, results) => {
        if ( err ) {
            console.log(err, err.stack);
            callback(err, 'There was an error');
        } else {
            var params = {Bucket: 'interviewschedulerhackathon17', Key: 'data.json', Body: JSON.stringify(results)};
            s3.upload(params, callback);
        }
    };
    
    dynamo.scan({ TableName: 'interview_tenant', ConsistentRead: true }, writeResultsToS3);
    
};
