'use strict';

const doc = require('dynamodb-doc');

const dynamo = new doc.DynamoDB();


/**
 * Demonstrates a simple HTTP endpoint using API Gateway. You have full
 * access to the request and response payload, including headers and
 * status code.
 *
 * To scan a DynamoDB table, make a GET request with the TableName as a
 * query string parameter. To put, update, or delete an item, make a POST,
 * PUT, or DELETE request respectively, passing in the payload to the
 * DynamoDB API as a JSON body.
 */
exports.handler = (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    console.log("Context: %j", context)

    const determineStatusCode = (event, res) => {
        switch(event.httpMethod) {
            case 'GET': return "200";
            case 'POST': return "201";
            default: return "201";
        }
    };
    
    const done = (err, res) => callback(null, {
        statusCode: err ? '400' : determineStatusCode(event, res),
        body: err ? err.message : JSON.stringify(res),
        headers: {
            'Content-Type': 'application/json',
        },
    });

    console.log("Event: %j", event);
    
    switch (event.httpMethod) {
        case 'DELETE':
            dynamo.deleteItem(event.body, done);
            break;
        case 'GET':
            if (!event.queryStringParameters) {
                if (!event.TableName) {
                    done(new Error(`Invalid GET request: must provide TableName if no queryStringParameters."` + JSON.stringify(event, null, 2) +`"`));
                } else {
                    if (!event.Key) {
                        dynamo.scan({ TableName: event.TableName }, done);
                    } else {
                        dynamo.getItem({ TableName: event.TableName, Key: event.Key }, done);

                    }
                }
            } else {
                if (!event.queryStringParameters.TableName) {
                    done(new Error(`Invalid GET request: must provide TableName in queryStringParameters."` + JSON.stringify(event, null, 2) +`"`));
                } else {
                    if (!event.queryStringParameters.Key) {
                        if (!event.queryStringParameters.TenantId) {
                            dynamo.scan({ TableName: event.queryStringParameters.TableName }, done);
                        } else {
                            var tenantId = event.queryStringParameters.TenantId + ":"
                            var params = { TableName: event.queryStringParameters.TableName, 
                                ExpressionAttributeValues: { ':tenantId': tenantId },
                                FilterExpression: 'begins_with(tenantIdMeetingId, :tenantId)' };
                            console.log("Scan Params: %j", params);
                            dynamo.scan(params, done);
                        }
                    } else {
                        dynamo.getItem({ TableName: event.queryStringParameters.TableName, Key: event.queryStringParameters.Key }, done);

                    }
                }
            }
            break;
        case 'POST':
            dynamo.putItem(event.body, done);
            break;
        case 'PUT':
            dynamo.updateItem(event.body, done);
            break;
        default:
            if (!event.httpMethod) {
                dynamo.scan({ TableName: "interview_tenant"}, done);
            } else {
                done(new Error(`Unsupported method "${event.method}" in event "` + JSON.stringify(event, null, 2) +`"`));
            }
    }
};
