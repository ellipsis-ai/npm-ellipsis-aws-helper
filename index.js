"use strict";

var AWS = require('aws-sdk');
const HelperError = require('./aws_helper_error');
const moment = require('moment-timezone');

const validRegions = {
  "us-east-1": "US East (N. Virginia)",
  "us-east-2": "US East (Ohio)",
  "us-west-1": "US West (N. California)",
  "us-west-2": "US West (Oregon)",
  "ca-central-1": "Canada (Central)",
  "eu-west-1": "EU (Ireland)",
  "eu-central-1": "EU (Frankfurt)",
  "eu-west-2": "EU (London)",
  "ap-northeast-1": "Asia Pacific (Tokyo)",
  "ap-northeast-2": "Asia Pacific (Seoul)",
  "ap-southeast-1": "Asia Pacific (Singapore)",
  "ap-southeast-2": "Asia Pacific (Sydney)",
  "ap-south-1": "Asia Pacific (Mumbai)",
  "sa-east-1": "South America (São Paulo)"
};

function _handleApiError(response, errorType, message) {
  const errors = [];
  if (response.statusCode == 403) {
    errors.push("Invalid Crendentials, check the AWS_ACCESS_KEY and AWS_SECRET_KEY.");
  } else {
    if (response.message) {
      errors.push(response.message);
    }
  }
  throw new HelperError(errorType, message, errors);
}

class Helper {

  constructor(config={}) {
    this.config = config;
    this.AWS = config.AWS || AWS ;
    this.userTimeZone = config.userTimeZone || "UTC";
  }

  validateRegion(region) {
    return Promise.resolve(!!(region in validRegions));
  }

  validateAccessToApi() {
    const iam = new this.AWS.IAM();
    return iam.getUser({}).promise()
            .then((data) => {
               if (data && data.User) {
                 return true;
               } else return false;
            })
            .catch((error) => {
              console.log(error);
              _handleApiError(error, "AWS_API_ERROR", "I cannot connect to the AWS API.");
            });
  }

  certsFromIAM() {
    const iam = new this.AWS.IAM();
    return iam.listServerCertificates({}).promise()
             .then((data) => {
               return data.ServerCertificateMetadataList
                  .map((ea) => {
                    //   Path: '/',
                    //   ServerCertificateName: 'www.smallbusinessbiggame.com_last',
                    //   ServerCertificateId: 'ASCAJPWXQE3XHOHX3ZUUG',
                    //   Arn: 'arn:aws:iam::439567033621:server-certificate/www.smallbusinessbiggame.com_last',
                    //   UploadDate: 2017-07-18T00:03:29.000Z,
                    //   Expiration: 2018-07-18T23:59:59.000Z }
                    return {
                      identifier: ea.ServerCertificateName,
                      arn: ea.Arn,
                      name: ea.ServerCertificateName,
                      valid_to: ea.Expiration,
                      is_expired: moment(ea.Expiration) < moment.utc(),
                      serial_number: ea.ServerCertificateId,
                      source: "AWS/IAM"
                     };
                  });
              })
              .catch((error) => {
                _handleApiError(error, "AWS_API_ERROR", "I cannot connect to the AWS API.");
              });
  }

  certArnsFromACM(acm) {
    return acm.listCertificates({}).promise()
             .then((data) => {
               return data.CertificateSummaryList
                        .map((ea) => {
                          return ea.CertificateArn;
                        });
             })
             .catch((error) => {
               _handleApiError(error, "AWS_API_ERROR", "I cannot connect to the AWS API.");
             });
  }

  certInfoFromArn(arn, acm) {
    return acm.describeCertificate({ CertificateArn: arn }).promise()
          .then( (data) => {
            var r = {};
            if (data.Certificate) {
              r = {
                identifier: data.Certificate.DomainName,
                arn: data.Certificate.CertificateArn,
                domain: data.Certificate.DomainName,
                valid_from: data.Certificate.NotBefore,
                valid_to: data.Certificate.NotAfter,
                source: "AWS/ACM",
                in_use_by_aws: !!data.Certificate.InUseBy.length
              };
            }
            return r;
          })
          .catch((error) => {
            _handleApiError(error, "AWS_API_ERROR", "I cannot connect to the AWS API.");
          });
  }

  certsFromACM() {
    const acm = new this.AWS.ACM();
    return this.certArnsFromACM(acm)
            .then((arns) => {
              return Promise.all(
                arns.map((arn) => this.certInfoFromArn(arn, acm))
              );
            })
            .catch((error) => {
              _handleApiError(error, "AWS_API_ERROR", "I cannot connect to the AWS API.");
            });
  }

  certsFromAWS() {
    return Promise.all([this.certsFromIAM(), this.certsFromACM()])
              .then((certLists) => {
                const flattened = [].concat.apply([], certLists);
                const refined = flattened.map((ea) => {
                  ea.is_expired = moment.utc(ea.valid_to) < moment.utc();
                  const dateFormat = "ddd, MMM Do YYYY, h:mm:ss a z";
                  const dateM = moment.utc(ea.valid_to);
                  ea.valid_to_string_utc = dateM.format(dateFormat);
                  ea.valid_to_string_local = dateM.tz(this.userTimeZone).format(dateFormat);
                  return ea;
                });
                return refined.sort((a, b) => a.valid_to-b.valid_to);;
              })
              .catch((error) => {
                _handleApiError(error, "AWS_API_ERROR", "I cannot connect to the AWS API.");
              });
  }

}

module.exports = {
  Helper : Helper,
  HelperError : HelperError
}
