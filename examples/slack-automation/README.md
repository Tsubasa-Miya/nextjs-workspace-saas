# Example: SSM Automation Slack Notifier (Terraform)

What it creates
- Lambda function (Python) to send SSM Automation status to Slack
- EventBridge rule to trigger on SSM Automation status changes
- IAM role/policies for Lambda

How to use
- Copy `terraform.tfvars.example` to `terraform.tfvars` and edit values
- Apply: `terraform init && terraform apply -auto-approve`
- Destroy: `terraform destroy -auto-approve`

Notes
- Uses `archive_file` to zip `docs/templates/lambda-ssm-automation-slack.py` at apply time
- Set optional enrichments (e.g., `ALB_ARN`, `WAF_WEBACL_ARN`, `ENV_NAME`) to improve Slack messages

Variables
- Required
  - `region` (string): AWS region (e.g., `ap-northeast-1`)
  - `slack_webhook_url` (string): Slack Incoming Webhook URL
- Optional enrichments
  - `waf_webacl_arn` (string): Target WebACL ARN (for link/label)
  - `alb_arn` (string): Target ALB ARN (for link/label)
  - `athena_workgroup` (string): Athena WorkGroup name
  - `waf_webacl_name` (string): Override WAF display name
  - `alb_name` (string): Override ALB display name
  - `env_name`/`system_name`/`app_name` (string): Context labels

Diagram
```
SSM Automation  ──(EventBridge: status change)──▶  Lambda  ──▶  Slack Webhook
```

Optional: Remote backend (S3)
- Copy `../../backend.tf.example` into this directory as `backend.tf` and edit `bucket/key/region/dynamodb_table`.
