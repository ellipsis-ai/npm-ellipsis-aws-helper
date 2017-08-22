'use strict';

const EllipsisAWS = require('../index');
var AWS = require('aws-sdk-mock');
const config = {};



describe("validateRegion", () => {
  it("returns true when region is valid", () => {
    const ah = new EllipsisAWS.Helper();
    expect(ah.validateRegion("us-east-1")).toBe(true);
    expect(ah.validateRegion("us-est-1")).toBe(false);
    expect(ah.validateRegion("")).toBe(false);
    expect(ah.validateRegion(1)).toBe(false);
    expect(ah.validateRegion("us-est-1-090asd")).toBe(false);
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
