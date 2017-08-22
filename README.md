# npm-ellipsis-aws-helper
An Npm package to help interacting with the AWS APIs.

# Installation
```bash
$ npm install ellipsis-aws-helper@latest --save
```

# Usage
```javascript

"use strict";

const EllipsisAws = require('ellipsis-aws-helper');
const awsHelper = new EllipsisAws.Helper();

var region = process.env.AWS_REGION;

awsHelper.validateRegion(region)
.then(valid => {
  console.log(`Unknown region '${region}'`);
  if (valid) return awsHelper.validateAccessToApi();
  else throw new Error("Invalid region");
})
.then((result) => {
  // do something awesome!
})
.catch(err => {
  // do something super awesome!
})
```

# Configuration
By default the Helper builds its own AWS object. If you prefer configuring and passing to it you can do so:

```javascript
"use strict";

var AWS = require('aws-sdk');
AWS.config.update({
  AWS_PROFILE = "my-profile-name",
  AWS_REGION = "us-east-1"
})

const EllipsisAws = require('ellipsis-aws-helper');
const awsHelper = new EllipsisAws.Helper({
  AWS: AWS
});
```
