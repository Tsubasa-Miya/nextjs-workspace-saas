import json
import os
import urllib.request
import boto3

WEBHOOK = os.environ["SLACK_WEBHOOK_URL"]

def post(msg):
    data = json.dumps(msg).encode("utf-8")
    req = urllib.request.Request(WEBHOOK, data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        return resp.read()

def format_text(detail):
    exec_id = detail.get("executionId", "-")
    status = detail.get("status", "-")
    doc = detail.get("documentName", "-")
    step = detail.get("stepName", "-")
    return f"SSM Automation {status} (doc={doc}, step={step}, exec={exec_id})"

def resolve_target_names(region: str):
    names = {}
    # Prefer explicit env-provided names
    explicit_waf = os.environ.get("WAF_WEBACL_NAME")
    explicit_alb = os.environ.get("ALB_NAME")
    explicit_athena = os.environ.get("ATHENA_WORKGROUP")
    if explicit_waf:
        names["waf"] = explicit_waf
    if explicit_alb:
        names["alb"] = explicit_alb
    if explicit_athena:
        names["athena_wg"] = explicit_athena

    # Resolve from ARNs or APIs if not provided
    waf_arn = os.environ.get("WAF_WEBACL_ARN")
    if waf_arn and "waf" not in names and region:
        try:
            waf = boto3.client("wafv2", region_name=region)
            tag = waf.list_tags_for_resource(ResourceARN=waf_arn)
            tags = {t["Key"]: t["Value"] for t in tag.get("TagInfoForResource", {}).get("TagList", [])}
            n = tags.get("Name")
            if n:
                names["waf"] = n
        except Exception:
            pass

    alb_arn = os.environ.get("ALB_ARN")
    if alb_arn and "alb" not in names and region:
        try:
            elb = boto3.client("elbv2", region_name=region)
            d = elb.describe_load_balancers(LoadBalancerArns=[alb_arn])
            if d.get("LoadBalancers"):
                names["alb"] = d["LoadBalancers"][0]["LoadBalancerName"]
            # Prefer Name tag if exists
            t = elb.describe_tags(ResourceArns=[alb_arn])
            tagdescs = t.get("TagDescriptions", [])
            if tagdescs and tagdescs[0].get("Tags"):
                tags = {x["Key"]: x["Value"] for x in tagdescs[0]["Tags"]}
                names["alb"] = tags.get("Name", names.get("alb"))
        except Exception:
            pass

    if "athena_wg" not in names and explicit_athena and region:
        try:
            athena = boto3.client("athena", region_name=region)
            g = athena.get_work_group(WorkGroup=explicit_athena)
            names["athena_wg"] = g.get("WorkGroup", {}).get("Name", explicit_athena)
        except Exception:
            names["athena_wg"] = explicit_athena

    return names

def resolve_context(region: str):
    """Resolve Env/System/App from env vars or resource tags (ALB/WAF)."""
    # Explicit env overrides
    ctx = {
        "env": os.environ.get("ENV_NAME"),
        "system": os.environ.get("SYSTEM_NAME"),
        "app": os.environ.get("APP_NAME"),
    }

    def pick(tags: dict, candidates):
        for k in candidates:
            v = tags.get(k)
            if v:
                return v
        return None

    # Merge tags from ALB and WAF if available
    tags_all = {}
    region = region or os.environ.get("AWS_REGION", "")
    alb_arn = os.environ.get("ALB_ARN")
    if alb_arn and region:
        try:
            elb = boto3.client("elbv2", region_name=region)
            t = elb.describe_tags(ResourceArns=[alb_arn])
            tagdescs = t.get("TagDescriptions", [])
            if tagdescs and tagdescs[0].get("Tags"):
                tags_all.update({x["Key"]: x["Value"] for x in tagdescs[0]["Tags"]})
        except Exception:
            pass
    waf_arn = os.environ.get("WAF_WEBACL_ARN")
    if waf_arn and region:
        try:
            waf = boto3.client("wafv2", region_name=region)
            tag = waf.list_tags_for_resource(ResourceARN=waf_arn)
            tags = {t["Key"]: t["Value"] for t in tag.get("TagInfoForResource", {}).get("TagList", [])}
            tags_all.update(tags)
        except Exception:
            pass

    # Fill if not set via env
    if not ctx.get("env"):
        ctx["env"] = pick(tags_all, ["Environment", "Env", "Stage"])
    if not ctx.get("system"):
        ctx["system"] = pick(tags_all, ["System", "Subsystem", "Product"])  # domain/system tags
    if not ctx.get("app"):
        ctx["app"] = pick(tags_all, ["App", "Application", "Service", "Name"])  # Name last

    # Drop Nones
    return {k: v for k, v in ctx.items() if v}

def lambda_handler(event, context):
    # EventBridge: SSM Automation Execution/Step Change
    detail = event.get("detail", {})
    text = format_text(detail)
    blocks = [
        {"type": "header", "text": {"type": "plain_text", "text": "SSM Automation Report"}},
        {"type": "section", "text": {"type": "mrkdwn", "text": text}},
    ]

    # Include summary report if available
    exec_id = detail.get("executionId")
    if exec_id:
        try:
            ssm = boto3.client("ssm")
            resp = ssm.get_automation_execution(AutomationExecutionId=exec_id)
            outputs = resp.get("AutomationExecution", {}).get("Outputs", {})
            # Our document exposes Summary.Report as a stringified JSON
            report_list = outputs.get("Summary.Report") or outputs.get("Summary") or []
            if report_list:
                report = report_list[0]
                blocks.append({
                    "type": "section",
                    "text": {"type": "mrkdwn", "text": f"```{report}```"}
                })
        except Exception as e:
            blocks.append({"type": "context", "elements": [{"type": "mrkdwn", "text": f"fetch outputs error: {e}"}]})

    # Targets summary (names via env or tags)
    region = event.get("region") or os.environ.get("AWS_REGION", "")
    target_names = resolve_target_names(region)
    parts = []
    if target_names.get("waf"):
        parts.append(f"WAF: {target_names['waf']}")
    if target_names.get("alb"):
        parts.append(f"ALB: {target_names['alb']}")
    if target_names.get("athena_wg"):
        parts.append(f"Athena WG: {target_names['athena_wg']}")
    if parts:
        blocks.append({"type": "section", "text": {"type": "mrkdwn", "text": " | ".join(parts)}})

    # High-level context (Env/System/App)
    ctx = resolve_context(region)
    if ctx:
        ctx_parts = []
        if ctx.get("env"):
            ctx_parts.append(f"Env: {ctx['env']}")
        if ctx.get("system"):
            ctx_parts.append(f"System: {ctx['system']}")
        if ctx.get("app"):
            ctx_parts.append(f"App: {ctx['app']}")
        if ctx_parts:
            blocks.append({"type": "context", "elements": [{"type": "mrkdwn", "text": " | ".join(ctx_parts)}]})

    # Console link to SSM Automation execution (if available)
    region = event.get("region") or os.environ.get("AWS_REGION", "")
    if exec_id and region:
      url = f"https://{region}.console.aws.amazon.com/systems-manager/automation/execution/{exec_id}?region={region}"
      blocks.append({
          "type": "actions",
          "elements": [
              {"type": "button", "text": {"type": "plain_text", "text": "Open in Console"}, "url": url}
          ]
      })

    # Optional extra console links via env vars
    extras = []
    for label, env in [("WAF Console", "WAF_CONSOLE_URL"), ("ALB Console", "ALB_CONSOLE_URL"), ("Athena", "ATHENA_CONSOLE_URL")]:
        url = os.environ.get(env)
        if url:
            extras.append({"type": "button", "text": {"type": "plain_text", "text": label}, "url": url})

    # Build console links from ARNs if provided
    region = event.get("region") or os.environ.get("AWS_REGION", "")
    waf_webacl_arn = os.environ.get("WAF_WEBACL_ARN")
    alb_arn = os.environ.get("ALB_ARN")
    athena_wg = os.environ.get("ATHENA_WORKGROUP")
    if waf_webacl_arn and region:
        extras.append({
            "type": "button",
            "text": {"type": "plain_text", "text": "WAF WebACL"},
            "url": f"https://{region}.console.aws.amazon.com/wafv2/homev2/web-acls?region={region}#/web-acls"
        })
    if alb_arn and region:
        extras.append({
            "type": "button",
            "text": {"type": "plain_text", "text": "ALB"},
            "url": f"https://{region}.console.aws.amazon.com/ec2/v2/home?region={region}#LoadBalancers:search={alb_arn.split('/')[-1]}"
        })
    if athena_wg and region:
        extras.append({
            "type": "button",
            "text": {"type": "plain_text", "text": "Athena WG"},
            "url": f"https://{region}.console.aws.amazon.com/athena/home?region={region}#/workgroups/{athena_wg}"
        })
    if extras:
        blocks.append({"type": "actions", "elements": extras})

    payload = {"blocks": blocks}
    post(payload)
    return {"ok": True}
