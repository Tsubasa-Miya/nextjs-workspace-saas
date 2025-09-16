# Example: VPC Endpoints (Terraform)

Creates a minimal VPC with two private subnets and Interface/Gateway endpoints.

Usage
- `terraform init && terraform apply -auto-approve`
- Adjust `region` and `vpc_cidr` in `variables.tf` or via `-var`/tfvars
- For S3 Gateway endpoint, set `route_table_ids` to your private route tables in a real VPC

Variables
- `region` (string): AWS region (default `ap-northeast-1`)
- `vpc_cidr` (string): Base CIDR for the new VPC (e.g., `10.100.0.0/16`)

Diagram
```
         +---------------------- VPC ----------------------+
 Subnet A (private)         Subnet B (private)
    │  Interface EPs           │  Interface EPs
    └──────────────┐           └──────────────┐
                   │                           │
                (AWS services via PrivateLink)

S3 Gateway Endpoint (attach to private route tables for S3 access)
```

Optional: Remote backend (S3)
- Copy `../../backend.tf.example` into this directory as `backend.tf` and edit `bucket/key/region/dynamodb_table`.
