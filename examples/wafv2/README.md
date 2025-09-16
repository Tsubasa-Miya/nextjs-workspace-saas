# Example: WAFv2 WebACL (Terraform)

Creates a minimal REGIONAL WebACL with AWS Managed Rule Groups.

Usage
- `terraform init && terraform apply -auto-approve`
- Output: `web_acl_arn`
- Associate with ALB: `aws wafv2 associate-web-acl --web-acl-arn <arn> --resource-arn <alb-arn> --region <region>`

Variables
- `region` (string): AWS region (default `ap-northeast-1`)
- `name` (string): WebACL name (e.g., `web-alb-waf`)

Diagram
```
Client ──▶ ALB ──(evaluates)──▶ WAF WebACL rules ──▶ Target Group / EC2
```

Optional: Remote backend (S3)
- Copy `../../backend.tf.example` into this directory as `backend.tf` and edit `bucket/key/region/dynamodb_table`.
