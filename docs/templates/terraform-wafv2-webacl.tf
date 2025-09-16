variable "name" { type = string }
variable "scope" { type = string  default = "REGIONAL" }

resource "aws_wafv2_web_acl" "this" {
  name  = var.name
  scope = var.scope
  default_action { allow {} }
  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = var.name
    sampled_requests_enabled   = true
  }

  rule {
    name     = "AWS-AWSManagedRulesCommonRuleSet"
    priority = 1
    statement { managed_rule_group_statement { vendor_name = "AWS" name = "AWSManagedRulesCommonRuleSet" } }
    visibility_config { cloudwatch_metrics_enabled = true metric_name = "common" sampled_requests_enabled = true }
    override_action { none {} }
  }

  rule {
    name     = "AWS-AWSManagedRulesKnownBadInputsRuleSet"
    priority = 2
    statement { managed_rule_group_statement { vendor_name = "AWS" name = "AWSManagedRulesKnownBadInputsRuleSet" } }
    visibility_config { cloudwatch_metrics_enabled = true metric_name = "kbi" sampled_requests_enabled = true }
    override_action { none {} }
  }

  rule {
    name     = "AWS-AWSManagedRulesAmazonIpReputationList"
    priority = 3
    statement { managed_rule_group_statement { vendor_name = "AWS" name = "AWSManagedRulesAmazonIpReputationList" } }
    visibility_config { cloudwatch_metrics_enabled = true metric_name = "reputation" sampled_requests_enabled = true }
    override_action { none {} }
  }

  rule {
    name     = "RateLimit-Per-IP"
    priority = 100
    statement { rate_based_statement { limit = 1000 aggregate_key_type = "IP" } }
    visibility_config { cloudwatch_metrics_enabled = true metric_name = "ratelimit" sampled_requests_enabled = true }
    action { block {} }
  }
}

