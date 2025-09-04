terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

provider "aws" {
  region = var.region
}

variable "region" { type = string }
variable "project" { type = string }
variable "env" { type = string }
variable "alb_arn_suffix" { type = string }
variable "target_group_arn_suffix" { type = string }
variable "ec2_asg_name" { type = string }
variable "rds_identifier" { type = string }
variable "alarm_topic_arn" { type = string }

locals {
  common_tags = {
    Project = var.project
    Env     = var.env
  }
}

resource "aws_cloudwatch_metric_alarm" "api_5xx" {
  alarm_name          = "${var.project}-${var.env}-alb-5xx-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  threshold           = 1
  metric_name         = "HTTPCode_ELB_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Sum"
  dimensions = {
    LoadBalancer = var.alb_arn_suffix
  }
  alarm_description = "ALB 5xx > 1% (approx; follow up with target metrics)"
  alarm_actions     = [var.alarm_topic_arn]
  tags              = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "target_unhealthy" {
  alarm_name          = "${var.project}-${var.env}-target-unhealthy"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  threshold           = 0
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Average"
  dimensions = {
    TargetGroup = var.target_group_arn_suffix
    LoadBalancer = var.alb_arn_suffix
  }
  alarm_description = "ALB target unhealthy > 0"
  alarm_actions     = [var.alarm_topic_arn]
  tags              = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "${var.project}-${var.env}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  threshold           = 80
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  dimensions = {
    AutoScalingGroupName = var.ec2_asg_name
  }
  alarm_description = "EC2 CPU > 80%"
  alarm_actions     = [var.alarm_topic_arn]
  tags              = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "rds_free_storage_low" {
  alarm_name          = "${var.project}-${var.env}-rds-free-storage-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  threshold           = 20
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  dimensions = {
    DBInstanceIdentifier = var.rds_identifier
  }
  alarm_description = "RDS free storage < 20% (approx; scale/cleanup)"
  alarm_actions     = [var.alarm_topic_arn]
  tags              = local.common_tags
}

