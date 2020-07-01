## Dev Mode (local)

1. Install dependencies
```
npm ci
```

2. Configure s3local profile
```
aws configure --profile s3local
```

Set both the Access Key Id and the Secret Access Key to "S3RVER".

3. Set Livingdocs ENV variables
```
export LI_TOKEN='<your-project-token-with-import-rights>'
export LI_HOST='https://server.livingdocs.io'
```

Note: make sure to configure an API token that has write rights.

4. Start serverless with your profile
```
AWS_PROFILE=s3local sls offline start
```

5. Test the import (in a new cl window)
```
aws --endpoint http://localhost:4569 s3 cp ./test.json s3://local-bucket/test-transfered-foo.json --profile s3local
```

Note: the image urls of DPA feeds expire after a while. If the image upload fails you probably need to update the example with a recent one. DPA s3 push examples can be found directly from their website: https://api-portal.dpa-newslab.com/api/s3push