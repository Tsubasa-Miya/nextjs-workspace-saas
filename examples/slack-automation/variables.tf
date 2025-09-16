variable "region" { type = string default = "ap-northeast-1" }
variable "slack_webhook_url" { type = string }
variable "waf_webacl_arn" { type = string default = "" }
variable "alb_arn" { type = string default = "" }
variable "athena_workgroup" { type = string default = "" }
variable "waf_webacl_name" { type = string default = "" }
variable "alb_name" { type = string default = "" }
variable "env_name" { type = string default = "" }
variable "system_name" { type = string default = "" }
variable "app_name" { type = string default = "" }

