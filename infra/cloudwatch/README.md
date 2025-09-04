CloudWatch Alarms (Starter)

Inputs
- `region`: AWS region (e.g., ap-northeast-1)
- `project`: Tag/identifier (e.g., SaaS-Starter)
- `env`: dev|stg|prod
- `alb_arn_suffix`: From ALB ARN (the suffix part used by CW)
- `target_group_arn_suffix`: From Target Group ARN (suffix)
- `ec2_asg_name`: AutoScalingGroup name
- `rds_identifier`: DBInstanceIdentifier
- `alarm_topic_arn`: SNS Topic ARN for notifications

Alarms
- ALB 5xx rate: approximates >1% (use target metrics for precision)
- Target unhealthy > 0 (2 consecutive periods)
- EC2 CPU > 80% (5 minutes)
- RDS FreeStorage < threshold (uses absolute metric; adjust threshold to bytes if desired)

Usage (example)
```
terraform init
terraform apply \
  -var region=ap-northeast-1 \
  -var project=SaaS-Starter \
  -var env=dev \
  -var alb_arn_suffix=app/your-alb/xxxxxxxx \
  -var target_group_arn_suffix=targetgroup/your-tg/xxxxxxxx \
  -var ec2_asg_name=saas-dev-asg \
  -var rds_identifier=saas-dev-db-1 \
  -var alarm_topic_arn=arn:aws:sns:ap-northeast-1:123456789012:alerts
```

Notes
- RDS FreeStorageSpace uses bytes; the example uses a relative threshold conceptually (20%).
  For production, compute absolute bytes based on instance allocated storage.
- Consider adding p95 latency alarms for ALB TargetResponseTime.
- Tag resources with `Project` and `Env` for consistency.

