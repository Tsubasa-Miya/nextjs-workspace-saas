resource "aws_s3_bucket" "alb_logs" {
  bucket = var.alb_logs_bucket
}

data "aws_caller_identity" "current" {}

resource "aws_s3_bucket_policy" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id
  policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AWSALBLogsDelivery",
      "Effect": "Allow",
      "Principal": { "AWS": ["arn:aws:iam::127311923021:root"] },
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::${aws_s3_bucket.alb_logs.bucket}/AWSLogs/${data.aws_caller_identity.current.account_id}/*"
    }
  ]
}
POLICY
}

resource "aws_lb" "this" {
  # ... your ALB config ...
}

resource "aws_lb_attribute" "access_logs" {
  load_balancer_arn = aws_lb.this.arn
  key               = "access_logs.s3.enabled"
  value             = "true"
}

resource "aws_lb_attribute" "access_logs_bucket" {
  load_balancer_arn = aws_lb.this.arn
  key               = "access_logs.s3.bucket"
  value             = aws_s3_bucket.alb_logs.bucket
}

resource "aws_lb_attribute" "access_logs_prefix" {
  load_balancer_arn = aws_lb.this.arn
  key               = "access_logs.s3.prefix"
  value             = "alb/"
}

variable "alb_logs_bucket" { type = string }

