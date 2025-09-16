terraform {
  required_version = ">= 1.5.0"
  required_providers { aws = { source = "hashicorp/aws", version = "~> 5.0" } }
}

provider "aws" { region = var.region }

resource "random_id" "suffix" { byte_length = 4 }

resource "aws_s3_bucket" "alb_logs" {
  bucket = "${var.bucket_prefix}-${random_id.suffix.hex}"
}

output "bucket_name" { value = aws_s3_bucket.alb_logs.bucket }

