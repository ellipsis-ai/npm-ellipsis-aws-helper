'use strict';

const EllipsisAWS = require('../index');
var AWS = require('aws-sdk-mock');
const config = {};



describe("validateRegion", () => {
  it("returns true when region is valid", () => {
    const ah = new EllipsisAWS.Helper();
    ah.validateRegion("us-east-1").then(result => expect(result).toBe(true));
    ah.validateRegion("us-est-1").then(result => expect(result).toBe(false));
    ah.validateRegion("").then(result => expect(result).toBe(false));
    ah.validateRegion(1).then(result => expect(result).toBe(false));
    ah.validateRegion("us-east-1sadasd").then(result => expect(result).toBe(false));
  });
});

describe("validateAccessToApi", () => {
  it("returns true when the IAM service returns User data", () => {
    AWS.mock('IAM', 'getUser', function(params, callback) {
      callback(null, { User: {Key: 'Value'} });
    });

    const ah = new EllipsisAWS.Helper(config);
    return ah.validateAccessToApi().then(data => {
      expect(data).toEqual(true);
      AWS.restore('IAM');
    });
  });
  it("throws an AwsHelperError when it cannot connect to the API", () => {
    AWS.mock('IAM', 'getUser', function(params, callback) {
      callback({message: "You are offline"}, null);
    });
    const ah = new EllipsisAWS.Helper(config);
    return ah.validateAccessToApi().catch(error => {
      expect(error).toEqual({
        "errors": ["You are offline"],
        "message": "I cannot connect to the AWS API.",
        "type": "AWS_API_ERROR"
      });
      AWS.restore('IAM');
    });
  });
});
