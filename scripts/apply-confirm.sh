#!/usr/bin/env bash
set -euo pipefail

DIR=""
VAR_FILE=""
YES=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dir) DIR="$2"; shift 2;;
    --var-file) VAR_FILE="$2"; shift 2;;
    --yes) YES=1; shift 1;;
    -h|--help)
      echo "Usage: $0 --dir <terraform-dir> [--var-file <tfvars>] [--yes]"; exit 0;;
    *) echo "Unknown arg: $1" >&2; exit 2;;
  esac
done

[[ -n "$DIR" ]] || { echo "--dir is required" >&2; exit 1; }

echo "About to APPLY Terraform resources in: $DIR"
if [[ -z "$YES" ]]; then
  read -r -p "Type 'apply' to continue: " CONFIRM
  if [[ "$CONFIRM" != "apply" ]]; then
    echo "Confirmation mismatch. Aborting." >&2
    exit 1
  fi
else
  echo "--yes provided; skipping prompt"
fi

cd "$DIR"
terraform init -input=false || true

# Auto-detect tfvars if not provided
if [[ -z "$VAR_FILE" ]]; then
  if [[ -f terraform.tfvars ]]; then VAR_FILE="terraform.tfvars"; fi
  if [[ -z "$VAR_FILE" && -f tfvars-stg.tfvars ]]; then VAR_FILE="tfvars-stg.tfvars"; fi
  if [[ -z "$VAR_FILE" && -f tfvars-prod.tfvars ]]; then VAR_FILE="tfvars-prod.tfvars"; fi
fi

if [[ -n "$VAR_FILE" ]]; then
  terraform apply -auto-approve -var-file="$VAR_FILE"
else
  terraform apply -auto-approve
fi

