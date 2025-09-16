# Example: Terraform Backend Bootstrap (S3 + DynamoDB)

Creates an S3 bucket for remote state and a DynamoDB table for state locking.

Usage
- `terraform init && terraform apply -auto-approve`
- Outputs:
  - `state_bucket`: S3 bucket name
  - `lock_table`: DynamoDB table name

Then configure backend in your example directory (copy and edit):
```
cp ../backend.tf.example ../slack-automation/backend.tf
# edit bucket/key/region/dynamodb_table accordingly
```

Variables
- `region` (string): AWS region (default `ap-northeast-1`)
- `bucket_name` (string): Optional explicit bucket name; if empty, random suffix is used
- `dynamodb_table_name` (string): Lock table name (default `tfstate-locks`)

