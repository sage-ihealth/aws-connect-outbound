# AWS connect outbound

## AWS - Invoke
sls invoke --function hello


## AWS - Invoke Local
https://www.serverless.com/framework/docs/providers/aws/cli-reference/invoke-local
serverless invoke local --function hello --path lib/outbound-data.json -e env=DEV
