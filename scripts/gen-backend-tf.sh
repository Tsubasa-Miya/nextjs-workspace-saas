#!/usr/bin/env bash
set -euo pipefail

# Generate a backend.tf for Terraform using S3 backend with DynamoDB lock table.
# Usage:
#   scripts/gen-backend-tf.sh \
#     --example examples/slack-automation \
#     --bucket my-tfstate-bucket \
#     --table tfstate-locks \
#     --region ap-northeast-1 \
#     [--key examples/slack-automation/terraform.tfstate]

EXAMPLE=""
BUCKET=""
TABLE=""
REGION=""
KEY=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --example) EXAMPLE="$2"; shift 2;;
    --bucket)  BUCKET="$2"; shift 2;;
    --table)   TABLE="$2"; shift 2;;
    --region)  REGION="$2"; shift 2;;
    --key)     KEY="$2"; shift 2;;
    -h|--help)
      sed -n '2,15p' "$0"; exit 0;;
    *) echo "Unknown arg: $1" >&2; exit 2;;
  esac
done

if [[ -z "$EXAMPLE" || -z "$BUCKET" || -z "$TABLE" || -z "$REGION" ]]; then
  echo "Missing required args. See --help." >&2
  exit 1
fi

if [[ -z "$KEY" ]]; then
  KEY="$EXAMPLE/terraform.tfstate"
fi

cat > "$EXAMPLE/backend.tf" <<EOF
terraform {
  backend "s3" {
    bucket         = "$BUCKET"
    key            = "$KEY"
    region         = "$REGION"
    dynamodb_table = "$TABLE"
    encrypt        = true
  }
}
EOF

echo "Wrote $EXAMPLE/backend.tf"

