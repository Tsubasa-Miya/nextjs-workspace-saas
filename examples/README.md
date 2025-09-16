# Terraform Examples

This directory contains minimal, ready-to-apply Terraform examples. They create real AWS resources. Use a sandbox account and proper AWS credentials.

Common
- Init/apply: `terraform init && terraform apply -auto-approve [-var-file=./tfvars-stg.tfvars]`
- Destroy: `terraform destroy -auto-approve [-var-file=./tfvars-stg.tfvars]`

Examples
- slack-automation: Deploys the SSM Automation Slack notifier Lambda with EventBridge and IAM. Configure `terraform.tfvars` with your `slack_webhook_url`.
- wafv2: Creates a minimal REGIONAL WebACL using AWS Managed Rule Groups.
- vpc-endpoints: Creates a minimal VPC with two subnets and several Interface/Gateway endpoints.
- s3-alb-logs: Creates an S3 bucket for ALB access logs (policy not included here; see docs/templates/s3-alb-logs-bucket-policy.json).

Makefile shortcuts (from repo root)
- `make ex-slack-apply TFVARS=examples/slack-automation/tfvars-stg.tfvars`
- `make ex-waf-apply   TFVARS=examples/wafv2/tfvars-stg.tfvars`
- `make ex-vpce-apply  TFVARS=examples/vpc-endpoints/tfvars-stg.tfvars`
- `make ex-s3logs-apply TFVARS=examples/s3-alb-logs/tfvars-stg.tfvars`
 - Bind remote state for all defaults: `make backend-bind-all REGION=ap-northeast-1`
 - Validate all examples: `make ex-validate-all`

Switch environment (prod)
- Use the corresponding `tfvars-prod.tfvars` file for each example, e.g.
  - `make ex-slack-apply TFVARS=examples/slack-automation/tfvars-prod.tfvars`
