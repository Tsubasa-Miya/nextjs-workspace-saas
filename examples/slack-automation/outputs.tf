output "lambda_arn" {
  value = aws_lambda_function.slack.arn
}

output "lambda_name" {
  value = aws_lambda_function.slack.function_name
}

output "event_rule_arn" {
  value = aws_cloudwatch_event_rule.ssm_automation.arn
}

