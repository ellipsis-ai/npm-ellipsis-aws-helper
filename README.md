# npm-ellipsis-aws-helper
An Npm package to help interacting with the AWS APIs.

# Usage
```javascript

"use strict";

const EllipsisAws = require('ellipsis-aws-helper');
const awsHelper = new EllipsisAws.Helper();

var region = process.env.AWS_REGION;

if (!awsHelper.validateRegion(region)) {
  console.log(`Unknown region '${region}'`);
}

awsHelper.validateAccessToApi()
.then((result) => {
  // do something awesome!
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
