variable "slack_webhook_url" { type = string }
variable "region" { type = string }

resource "aws_iam_role" "lambda" {
  name               = "slack-automation-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals { type = "Service" identifiers = ["lambda.amazonaws.com"] }
  }
}

resource "aws_iam_role_policy_attachment" "basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_policy" "ssm_read" {
  name   = "slack-automation-ssm-read"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Action = ["ssm:GetAutomationExecution"],
      Resource = "*"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ssm_read" {
  role       = aws_iam_role.lambda.name
  policy_arn = aws_iam_policy.ssm_read.arn
}

resource "aws_lambda_function" "slack" {
  function_name = "ssm-automation-slack"
  role          = aws_iam_role.lambda.arn
  handler       = "lambda-ssm-automation-slack.lambda_handler"
  runtime       = "python3.11"
  filename      = "lambda-ssm-automation-slack.zip" # zip the file in CI

  environment {
    variables = {
      SLACK_WEBHOOK_URL = var.slack_webhook_url
      AWS_REGION        = var.region
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

