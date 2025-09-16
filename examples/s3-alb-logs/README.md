# Example: S3 for ALB Access Logs (Terraform)

Creates a versioned S3 bucket name with a random suffix for ALB access logs.

Usage
- `terraform init && terraform apply -auto-approve`
- Add bucket policy to allow ALB delivery (see `docs/templates/s3-alb-logs-bucket-policy.json`)
- Enable access logs on ALB attributes to point to this bucket

Variables
- `region` (string): AWS region (default `ap-northeast-1`)
- `bucket_prefix` (string): Prefix for the bucket name; a random suffix is appended

Diagram
```
ALB ──(access logs)──▶ S3 bucket (this example)
   └─ Attributes: access_logs.s3.enabled=true, bucket=<this-bucket>
```

Optional: Remote backend (S3)
- Copy `../../backend.tf.example` into this directory as `backend.tf` and edit `bucket/key/region/dynamodb_table`.
