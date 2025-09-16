variable "name" { type = string }
variable "scope" { type = string  default = "REGIONAL" }

resource "aws_wafv2_web_acl" "exceptions" {
  name  = var.name
  scope = var.scope
  default_action { allow {} }
  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "exceptions"
    sampled_requests_enabled   = true
  }

  rule {
    name     = "ManagedCommonWithExclusions"
    priority = 1
    statement {
      managed_rule_group_statement {
        vendor_name  = "AWS"
        name         = "AWSManagedRulesCommonRuleSet"
        excluded_rule { name = "SizeRestrictions_BODY" }
        excluded_rule { name = "GenericLFI_QUERYARGUMENTS" }
      }
    }
    override_action { none {} }
    visibility_config { cloudwatch_metrics_enabled = true metric_name = "common-ex" sampled_requests_enabled = true }
  }

  rule {
    name     = "AllowHealthPaths"
    priority = 10
    statement {
      byte_match_statement {
        field_to_match { uri_path {} }
        positional_constraint = "STARTS_WITH"
        search_string         = "/healthz"
        text_transformation { priority = 0 type = "NONE" }
      }
    }
    action { allow {} }
    visibility_config { cloudwatch_metrics_enabled = true metric_name = "allow-health" sampled_requests_enabled = true }
  }

  rule {
    name     = "ObserveOnlyBadInputs"
    priority = 100
    statement { managed_rule_group_statement { vendor_name = "AWS" name = "AWSManagedRulesKnownBadInputsRuleSet" } }
    override_action { count {} }
    visibility_config { cloudwatch_metrics_enabled = true metric_name = "kbi-count" sampled_requests_enabled = true }
  }
}

