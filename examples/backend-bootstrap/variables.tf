variable "region" { type = string default = "ap-northeast-1" }
variable "bucket_name" { type = string default = "" description = "Optional explicit S3 bucket name; if empty, a random suffix bucket is created" }
variable "dynamodb_table_name" { type = string default = "tfstate-locks" }

