terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
    archive = { source = "hashicorp/archive", version = "~> 2.4" }
  }
}

provider "aws" {
  region = var.region
}

data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals { type = "Service" identifiers = ["lambda.amazonaws.com"] }
  }
}

resource "aws_iam_role" "lambda" {
  name               = "ssm-automation-slack-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

resource "aws_iam_role_policy_attachment" "basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_policy" "ssm_read" {
  name   = "ssm-automation-slack-ssm-read"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{ Effect = "Allow", Action = ["ssm:GetAutomationExecution"], Resource = "*" }]
  })
}

resource "aws_iam_role_policy_attachment" "ssm_read" {
  role       = aws_iam_role.lambda.name
  policy_arn = aws_iam_policy.ssm_read.arn
}

data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = "${path.module}/../../docs/templates/lambda-ssm-automation-slack.py"
  output_path = "${path.module}/lambda-ssm-automation-slack.zip"
}

resource "aws_lambda_function" "slack" {
  function_name = "ssm-automation-slack"
  role          = aws_iam_role.lambda.arn
  handler       = "lambda-ssm-automation-slack.lambda_handler"
  runtime       = "python3.11"
  filename      = data.archive_file.lambda_zip.output_path

  environment {
    variables = {
      SLACK_WEBHOOK_URL   = var.slack_webhook_url
      AWS_REGION          = var.region
      WAF_WEBACL_ARN      = var.waf_webacl_arn
      ALB_ARN             = var.alb_arn
      ATHENA_WORKGROUP    = var.athena_workgroup
      WAF_WEBACL_NAME     = var.waf_webacl_name
      ALB_NAME            = var.alb_name
      ENV_NAME            = var.env_name
      SYSTEM_NAME         = var.system_name
      APP_NAME            = var.app_name
    }
  }
}

resource "aws_cloudwatch_event_rule" "ssm_automation" {
  name        = "ssm-automation-status"
  description = "Trigger on SSM Automation status changes"
  event_pattern = jsonencode({
    source      = ["aws.ssm"],
    detail-type = [
      "EC2 Automation Step Status Change",
      "EC2 Automation Execution Status Change"
    ]
  })
}

resource "aws_cloudwatch_event_target" "lambda" {
  rule      = aws_cloudwatch_event_rule.ssm_automation.name
  target_id = "slack-lambda"
  arn       = aws_lambda_function.slack.arn
}

resource "aws_lambda_permission" "events" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.slack.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.ssm_automation.arn
}

output "lambda_name" { value = aws_lambda_function.slack.function_name }

