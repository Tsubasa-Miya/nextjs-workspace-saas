.PHONY: help quickcheck lambda-zip tf-fmt tf-validate tf-plan tf-validate-ci athena-ddl waf-create waf-associate qs-ds qs-dataset qs-dashboard

ENV ?= .env
TFVARS ?=
# Default example directories for bulk ops
EXAMPLES_DEFAULT := examples/slack-automation examples/wafv2 examples/vpc-endpoints examples/s3-alb-logs
-include $(ENV)

help:
	@echo "Available targets:"
	@echo "  quickcheck           Run local ingress quickcheck (PORT, HOST)"
	@echo "  lambda-zip           Zip Slack Lambda (outputs docs/templates/lambda-ssm-automation-slack.zip)"
	@echo "  tf-fmt               Terraform fmt (recursive)"
	@echo "  tf-validate          Terraform init/validate in docs/templates (no backend)"
	@echo "  tf-validate-ci       Run fmt/validate + tflint/checkov via GitHub Actions (on PR)"
	@echo "  athena-ddl           Print Athena DDL file path to create ALB logs table"
	@echo "  waf-create           Create WAF WebACL from template (requires AWS CLI)"
	@echo "  waf-associate        Associate WebACL to ALB (requires AWS CLI)"
	@echo "  qs-ds                Create QuickSight Athena data source (ACC, REGION, WG)"
	@echo "  qs-dataset           Create QuickSight dataset from template (ACC, REGION)"
	@echo "  qs-dashboard         Create QuickSight dashboard from template (ACC, REGION)"
	@echo "  ex-slack-apply       Apply examples/slack-automation (use TFVARS)"
	@echo "  ex-waf-apply         Apply examples/wafv2"
	@echo "  ex-vpce-apply        Apply examples/vpc-endpoints"
	@echo "  ex-s3logs-apply      Apply examples/s3-alb-logs"
	@echo "  ex-slack-destroy     Destroy examples/slack-automation (use TFVARS)"
	@echo "  ex-waf-destroy       Destroy examples/wafv2"
	@echo "  ex-vpce-destroy      Destroy examples/vpc-endpoints"
	@echo "  ex-s3logs-destroy    Destroy examples/s3-alb-logs"
	@echo "  ex-backend-apply     Apply examples/backend-bootstrap (S3+DynamoDB)"
	@echo "  ex-backend-destroy   Destroy examples/backend-bootstrap"
	@echo "  backend-tf           Generate backend.tf (STATE_BUCKET, LOCK_TABLE, REGION, EXAMPLE, [KEY])"
	@echo "  backend-bind         Use outputs from backend-bootstrap to write backend.tf for EXAMPLE"
	@echo "  backend-bind-all     Bind backend.tf for EXAMPLES (space-separated) or defaults"
	@echo "  destroy-confirm      Prompted terraform destroy (DIR, optional TFVARS)"
	@echo "  ex-apply-all         Apply all default EXAMPLES with confirmation"
	@echo "  ex-destroy-all       Destroy all default EXAMPLES with confirmation skipped"
	@echo "  scripts-prepare      chmod +x helper scripts (first-time setup)"
	@echo "  backend-tf           Generate backend.tf (STATE_BUCKET, LOCK_TABLE, REGION, EXAMPLE, [KEY])"
	@echo "  backend-bind         Use outputs from backend-bootstrap to write backend.tf for EXAMPLE"
	@echo "  destroy-confirm      Prompted terraform destroy (DIR, optional TFVARS)"

quickcheck:
	bash scripts/ec2-quickcheck.sh $${PORT:-80} $${HOST:-}

lambda-zip:
	@cd docs/templates && zip -j lambda-ssm-automation-slack.zip lambda-ssm-automation-slack.py && ls -lh lambda-ssm-automation-slack.zip

tf-fmt:
	terraform fmt -recursive || true

tf-validate:
	@echo "Initializing (no backend) and validating in docs/templates ..."
	@cd docs/templates && terraform init -backend=false || true
	@cd docs/templates && terraform validate || true

athena-ddl:
	@echo "Edit and run this DDL in Athena: docs/templates/alb_access_logs_ddl.sql"

waf-create:
	@[ -n "$$NAME" ] || (echo "Set NAME=<web-acl-name>" && exit 1)
	aws wafv2 create-web-acl --cli-input-json file://docs/templates/wafv2-web-acl.json --region $${REGION:?set REGION}

waf-associate:
	@[ -n "$$WEB_ACL_ARN" ] || (echo "Set WEB_ACL_ARN=<arn>" && exit 1)
	@[ -n "$$ALB_ARN" ] || (echo "Set ALB_ARN=<arn>" && exit 1)
	aws wafv2 associate-web-acl --web-acl-arn $$WEB_ACL_ARN --resource-arn $$ALB_ARN --region $${REGION:?set REGION}

qs-ds:
	@[ -n "$$ACC" ] || (echo "Set ACC=<account-id>" && exit 1)
	@[ -n "$$REGION" ] || (echo "Set REGION=<region>" && exit 1)
	@[ -n "$$WG" ] || (echo "Set WG=<athena-workgroup>" && exit 1)
	aws quicksight create-data-source --aws-account-id $$ACC --data-source-id athena-ds --name AthenaDataSource --type ATHENA --data-source-parameters AthenaParameters={WorkGroup=$$WG} --region $$REGION || true
	aws quicksight describe-data-source --aws-account-id $$ACC --data-source-id athena-ds --query 'DataSource.Arn' --output text --region $$REGION

qs-dataset:
	@[ -n "$$ACC" ] || (echo "Set ACC=<account-id>" && exit 1)
	@[ -n "$$REGION" ] || (echo "Set REGION=<region>" && exit 1)
	DS_ARN=$$(aws quicksight describe-data-source --aws-account-id $$ACC --data-source-id athena-ds --query 'DataSource.Arn' --output text --region $$REGION); \
	jq --arg acc "$$ACC" --arg ds "$$DS_ARN" '.AwsAccountId=$$acc | .PhysicalTableMap.MainTable.RelationalTable.DataSourceArn=$$ds' docs/templates/quicksight-dataset-alb.json > /tmp/quicksight-dataset.json; \
	aws quicksight create-data-set --cli-input-json file:///tmp/quicksight-dataset.json --region $$REGION || true

qs-dashboard:
	@[ -n "$$ACC" ] || (echo "Set ACC=<account-id>" && exit 1)
	@[ -n "$$REGION" ] || (echo "Set REGION=<region>" && exit 1)
	aws quicksight create-dashboard --aws-account-id $$ACC --dashboard-id alb-ops --name "ALB Ops" --source-entity file://docs/templates/quicksight-dashboard-template.json --permissions file://docs/templates/quicksight-permissions.json --region $$REGION || true

ex-slack-apply:
	cd examples/slack-automation && terraform init && terraform apply -auto-approve $(if $(TFVARS),-var-file=$(TFVARS),)

ex-waf-apply:
	cd examples/wafv2 && terraform init && terraform apply -auto-approve $(if $(TFVARS),-var-file=$(TFVARS),)

ex-vpce-apply:
	cd examples/vpc-endpoints && terraform init && terraform apply -auto-approve $(if $(TFVARS),-var-file=$(TFVARS),)

ex-s3logs-apply:
	cd examples/s3-alb-logs && terraform init && terraform apply -auto-approve $(if $(TFVARS),-var-file=$(TFVARS),)

ex-slack-destroy:
	cd examples/slack-automation && terraform destroy -auto-approve $(if $(TFVARS),-var-file=$(TFVARS),)

ex-waf-destroy:
	cd examples/wafv2 && terraform destroy -auto-approve $(if $(TFVARS),-var-file=$(TFVARS),)

ex-vpce-destroy:
	cd examples/vpc-endpoints && terraform destroy -auto-approve $(if $(TFVARS),-var-file=$(TFVARS),)

ex-s3logs-destroy:
	cd examples/s3-alb-logs && terraform destroy -auto-approve $(if $(TFVARS),-var-file=$(TFVARS),)

ex-backend-apply:
	cd examples/backend-bootstrap && terraform init && terraform apply -auto-approve $(if $(TFVARS),-var-file=$(TFVARS),)

ex-backend-destroy:
	cd examples/backend-bootstrap && terraform destroy -auto-approve $(if $(TFVARS),-var-file=$(TFVARS),)

backend-tf:
	@[ -n "$$STATE_BUCKET" ] || (echo "Set STATE_BUCKET=<s3-bucket>" && exit 1)
	@[ -n "$$LOCK_TABLE" ] || (echo "Set LOCK_TABLE=<dynamodb-table>" && exit 1)
	@[ -n "$$REGION" ] || (echo "Set REGION=<aws-region>" && exit 1)
	@[ -n "$$EXAMPLE" ] || (echo "Set EXAMPLE=<path-to-example>" && exit 1)
	bash scripts/gen-backend-tf.sh --example $$EXAMPLE --bucket $$STATE_BUCKET --table $$LOCK_TABLE --region $$REGION $(if $(KEY),--key $(KEY),)

backend-bind:
	@[ -n "$$EXAMPLE" ] || (echo "Set EXAMPLE=<path-to-example>" && exit 1)
	@[ -n "$$REGION" ] || (echo "Set REGION=<aws-region>" && exit 1)
	STATE_BUCKET=$$(terraform -chdir=examples/backend-bootstrap output -raw state_bucket); \
	LOCK_TABLE=$$(terraform -chdir=examples/backend-bootstrap output -raw lock_table); \
	bash scripts/gen-backend-tf.sh --example $$EXAMPLE --bucket $$STATE_BUCKET --table $$LOCK_TABLE --region $$REGION $(if $(KEY),--key $(KEY),)

backend-bind-all:
	@[ -n "$$REGION" ] || (echo "Set REGION=<aws-region>" && exit 1)
	STATE_BUCKET=$$(terraform -chdir=examples/backend-bootstrap output -raw state_bucket); \
	LOCK_TABLE=$$(terraform -chdir=examples/backend-bootstrap output -raw lock_table); \
	LIST="$(if $(EXAMPLES),$(EXAMPLES),$(EXAMPLES_DEFAULT))"; \
	for ex in $$LIST; do \
	  echo "Binding backend for $$ex"; \
	  bash scripts/gen-backend-tf.sh --example $$ex --bucket $$STATE_BUCKET --table $$LOCK_TABLE --region $$REGION; \
	done

# Validate all examples quickly (no backend)
.PHONY: ex-validate-all
ex-validate-all:
	@for ex in $(EXAMPLES_DEFAULT); do \
	  echo "Validating $$ex"; \
	  (cd $$ex && terraform init -backend=false >/dev/null 2>&1 || true && terraform validate || true); \
	done

.PHONY: ex-destroy-all
ex-destroy-all:
	@for ex in $(if $(EXAMPLES),$(EXAMPLES),$(EXAMPLES_DEFAULT)); do \
	  echo "Destroying $$ex"; \
	  bash scripts/destroy-confirm.sh --dir $$ex --yes || true; \
	done

.PHONY: scripts-prepare
scripts-prepare:
	chmod +x scripts/gen-backend-tf.sh scripts/destroy-confirm.sh || true
	chmod +x scripts/ec2-quickcheck.sh || true

destroy-confirm:
	@[ -n "$$DIR" ] || (echo "Set DIR=<example-dir>" && exit 1)
	bash scripts/destroy-confirm.sh --dir $$DIR $(if $(TFVARS),--var-file $(TFVARS),)
