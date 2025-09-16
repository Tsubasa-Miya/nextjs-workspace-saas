# EC2 公開トラブルシュート＆設定ランブック

**メタ情報**
- Owner: Platform/SRE
- 最終更新: 2025-09-11
- 対象: EC2 上の HTTP/HTTPS 公開（直公開/ALB 経由/IPv6 含む）

**目次**
- [目的（何を達成したいか）](#目的何を達成したいか)
- [確認順序（レイヤー順に絞り込み）](#確認順序レイヤー順に絞り込み)
- [15分クイックチェック（最短経路）](#15分クイックチェック最短経路)
- [詳細チェック](#詳細チェック)
- [症状別の当たり所](#症状別の当たり所)
- [代表的な修正例（コマンド）](#代表的な修正例コマンド)
- [外部検証手順](#外部検証手順)
- [よくある落とし穴](#よくある落とし穴)
- [セキュリティ仕上げ（動いた後に必ず）](#セキュリティ仕上げ動いた後に必ず)
- [収束レポート（テンプレ）](#収束レポートテンプレ)
- [コマンド速攻メモ](#コマンド速攻メモ)
- [AWS ツール活用](#aws-ツール活用)
- [ALB ヘルス Cookbook](#alb-ヘルス-cookbook)
- [貼り付け式チェックリスト（最短復旧用）](#貼り付け式チェックリスト最短復旧用)
- [AWS CLI / IaC 検証コマンド集](#aws-cli--iac-検証コマンド集)
- [パブリック IP なし運用（SSM / ALB パターン）](#パブリック-ip-なし運用ssm--alb-パターン)
- [IPv6 到達性ガイド](#ipv6-到達性ガイド)
- [ALB 502/504 深掘り](#alb-502504-深掘り)
- [監視と再発防止](#監視と再発防止)
- [5分ディシジョンツリー（テキスト版）](#5分ディシジョンツリーテキスト版)
- [Nginx リバプロ最小テンプレ（安全寄り）](#nginx-リバプロ最小テンプレ安全寄り)
- [ALB vs NLB 選定メモ](#alb-vs-nlb-選定メモ)
- [TLS/HTTP 検証レシピ（現地/外部）](#tlshttp-検証レシピ現地外部)
- [緊急時の迅速遮断（最小影響で）](#緊急時の迅速遮断最小影響で)
- [ブルー/グリーン切替（ALB/TG 最小手順）](#ブルーグリーン切替albtg-最小手順)
- [HTTPS 終端（Nginx / ALB）](#https-終端nginx--alb)
- [SELinux / firewalld（RHEL/CentOS/Amazon Linux）](#selinux--firewalldrhelcentosamazon-linux)
- [Terraform 最小例（SG/ALB/TG/リスナー）](#terraform-最小例sgalbtgリスナー)
- [ripgrep 非導入環境の代替](#ripgrep-非導入環境の代替)
- [systemd Unit 最小例](#systemd-unit-最小例)
- [監視テンプレ（CloudWatch JSON）](#監視テンプレcloudwatch-json)
- [変更履歴](#変更履歴)
- [CI チェック（例）](#ci-チェック例)
- [図解（ASCII トポロジ）](#図解ascii-トポロジ)
- [CDN/プロキシ併用時の注意](#cdnプロキシ併用時の注意)
- [VPC Flow Logs 上級クエリ](#vpc-flow-logs-上級クエリ)
- [ALB ウェイト付きルーティング](#alb-ウェイト付きルーティング)
- [コスト最適化の勘所](#コスト最適化の勘所)
- [Nginx セキュリティヘッダ・プリセット](#nginx-セキュリティヘッダプリセット)
- [OS コマンド差分（AL2023/Ubuntu 22.04）](#os-コマンド差分al2023ubuntu-2204)
- [IAM ポリシー最小セット](#iam-ポリシー最小セット)
- [クイックチェック・スクリプト](#クイックチェックスクリプト)
- [公式リファレンス](#公式リファレンス)
- [WAF プリセット（WebACL）](#waf-プリセットwebacl)
- [Athena での ALB アクセスログ分析](#athena-での-alb-アクセスログ分析)
- [SSM Automation 一括診断](#ssm-automation-一括診断)
- [ChatOps 連携（Slack / AWS Chatbot）](#chatops-連携slack--aws-chatbot)
  - [WAF 例外・緩和テンプレ](#waf-例外緩和テンプレ)
  - [Athena 最適化（CTAS/パーティション）](#athena-最適化ctasパーティション)
  - [WAF 移行（Count→Block）](#waf-移行countblock)
  - [Athena 可視化（QuickSight）](#athena-可視化quicksight)
  - [Automation 成果のSlack整形通知](#automation-成果のslack整形通知)
  - [WAF 運用 Runbook](#waf-運用-runbook)
- [QuickSight ダッシュボードの共有/復元](#quicksight-ダッシュボードの共有復元)
  - [QuickSight パーミッション雛形](#quicksight-パーミッション雛形)
  - [Slack 通知のコンソールリンク](#slack-通知のコンソールリンク)
  - [変更管理テンプレート](#変更管理テンプレート)
  - [PR 自動チェック（GitHub Actions）](#pr-自動チェックgithub-actions)
  - [Makefile 一括タスク](#makefile-一括タスク)
  - [ALB アクセスログ有効化](#alb-アクセスログ有効化)
  - [Lambda 配備 IaC（Slack通知）](#lambda-配備-iacslack通知)
  - [QuickSight ダッシュボード CLI 作成](#quicksight-ダッシュボード-cli-作成)
  - [Route53 運用（TTL/加重/CNAME）](#route53-運用ttl加重cname)
  - [Synthetics カナリア](#synthetics-カナリア)
  - [VPC エンドポイント標準セット](#vpc-エンドポイント標準セット)
  - [WAF Terraform 例](#waf-terraform-例)
  - [レビュー/サインオフ手順](#レビューサインオフ手順)

最短で原因切り分け→恒久対策→再発防止までをひとまとめにした実用ランブック。HTTP(80/443)想定だが、任意ポートにも応用可。

---

## 目的（何を達成したいか）
- EC2 上のサービスをインターネットから安定して到達可能にする
- 問題発生時にレイヤー順で素早く原因を特定する
- 対処後にセキュリティ・可用性を担保する

---

## 確認順序（レイヤー順に絞り込み）
1) 経路: クライアント → DNS/ALB → SG/NACL → ルート/IGW → EC2 → OS FW → アプリ
2) 症状タイプ: タイムアウト/無応答、接続拒否、4xx/5xx、ALB ヘルスチェック失敗

---

## 15分クイックチェック（最短経路）
- サービス稼働: `sudo ss -lntp` で対象ポートが LISTEN し、`0.0.0.0:<PORT>` または `[::]:<PORT>` で待受
- ローカル疎通: `curl -v http://127.0.0.1:<PORT>` が 200 などで成功
- OS ファイアウォール: `sudo ufw status` が inactive か、`Nginx Full`/対象ポート許可
- サブネット/ルート: ルートテーブルに `0.0.0.0/0 → igw-...` がある（パブリックサブネット）
- パブリック IP: インスタンスに `Public IPv4` または EIP が付与
- SG: Inbound TCP 80/443（または対象ポート）`0.0.0.0/0` で一時開放（検証後に絞る）
- 外部疎通: 別端末から `curl -v --connect-timeout 5 http://<Public-IP or DNS>`

---

## 詳細チェック

### A. AWS 側
- パブリック到達性
  - EC2 に Public IPv4/EIP が付与
  - サブネットのルート: `0.0.0.0/0 → igw-...`（IPv6 は `::/0 → egress-only-igw or igw`）
- セキュリティグループ（SG）
  - Inbound: TCP 80/443（または対象ポート）許可。ALB 経由の場合は ALB の SG をソースに指定
  - Outbound: `0.0.0.0/0` 許可（少なくともエフェメラル 1024-65535）
- NACL（使う場合）
  - Inbound: 80/443、1024-65535
  - Outbound: 0.0.0.0/0（最低限 1024-65535）
- ALB/NLB を使う場合
  - Listener/Target Group の Port/Protocol がアプリと一致
  - ターゲットヘルスが Healthy（Path/Interval/Threshold 適切）
  - SG の参照関係: `ALB SG → EC2 SG` を Inbound で許可

### B. EC2/OS 側
- 待受ポート
  - `sudo ss -lntp sport = :80`（80 以外は置換）で `Local Address` に `0.0.0.0` または `[::]`
- ローカル疎通
  - `curl -v http://127.0.0.1:<PORT>` 成功
- OS ファイアウォール
  - Ubuntu: `sudo ufw status` → 必要なら `sudo ufw allow 'Nginx Full'`
  - RHEL/CentOS: `sudo firewall-cmd --list-all` → 必要ポートを `--permanent` で許可
- サービス状態
  - `sudo systemctl status <svc>` と `journalctl -u <svc> -e` でエラー確認

### C. アプリ/ミドルウェア側
- バインドアドレス
  - アプリは `0.0.0.0` で待受（`127.0.0.1` だと外部不可）
  - 例: Node/Next/Vite は `HOST=0.0.0.0`、Django は `ALLOWED_HOSTS` 設定、Rails は `-b 0.0.0.0`
- Nginx（使用時）
  - `listen 80;`（`listen 127.0.0.1:80` は不可）
  - `server_name` と `proxy_pass http://127.0.0.1:<APP_PORT>;` の整合
  - テスト/反映: `sudo nginx -t && sudo systemctl reload nginx`
- Docker（使用時）
  - コンテナ起動に `-p 0.0.0.0:<HOST_PORT>:<CONTAINER_PORT>`（`expose` だけでは公開されない）

---

## 症状別の当たり所
- タイムアウト（応答なし）
  - SG/NACL/ルート/IGW、ALB→ターゲットの経路、アプリ未起動、127.0.0.1 バインド
- 接続拒否（Connection refused）
  - プロセス未待受、ポート違い、OSFW 拒否、Nginx 未起動
- 4xx/5xx
  - Nginx/アプリ設定不整合、アプリ例外、権限/SELinux、ヘッダやリダイレクト設定
- ALB ヘルスチェック失敗
  - Path/Port/Protocol 不一致、SG の相互許可漏れ、ホストヘッダ依存のアプリ

---

## 代表的な修正例（コマンド）
- Nginx を 0.0.0.0 で待受
  - サーバブロックで `listen 80;` と `listen [::]:80;` を設定
  - `sudo nginx -t && sudo systemctl reload nginx`
- UFW 開放（Ubuntu）
  - `sudo ufw allow 'Nginx Full'` または `sudo ufw allow 80/tcp && sudo ufw allow 443/tcp`
- アプリを 0.0.0.0 にバインド
  - 例: Node `HOST=0.0.0.0 PORT=3000 node server.js`
  - Django `ALLOWED_HOSTS=['*']`（検証時のみ。運用は FQDN 限定）
- Docker 公開
  - `docker run -p 0.0.0.0:80:80 <image>`

---

## 外部検証手順
- 直接アクセス: `curl -v --connect-timeout 5 http://<Public-IP or DNS>`
- DNS 解決: `dig +short A <domain>` / `nslookup <domain>`
- HTTPS 検証: `curl -vkI https://<domain>`（証明書・リダイレクト確認）

---

## よくある落とし穴
- プライベートサブネット（IGW なし）に EC2 を置いている
- SG は開けたが NACL が厳格
- アプリが `127.0.0.1` にバインド
- ALB ヘルスチェック Path/Port が不一致
- Docker で `expose` のみ（`-p` 未指定）
- SELinux/OSFW にブロックされる
- Cloudflare のオレンジ雲有効で、直アクセス検証が混乱

---

## セキュリティ仕上げ（動いた後に必ず）
- SG を最小化
  - 直公開を避け、可能なら ALB 経由にし、EC2 SG の Inbound を `ALB SG` 参照に限定
  - 管理系ポートは特定 CIDR のみに制限
- HTTPS 対応
  - 証明書の配備/更新自動化（Let’s Encrypt + cron/systemd timer）
  - 強い TLS 設定、HTTP→HTTPS リダイレクト
- OSFW/SELinux 方針の見直しと恒久設定

---

## 収束レポート（テンプレ）
- 事象: 例）外部から 80/TCP がタイムアウト
- 影響範囲: 例）全ユーザ/特定 AZ/特定経路
- 原因: 例）Nginx が `127.0.0.1:80` にバインド
- 恒久対策: 例）`listen 80;` に修正し、CI で `nginx -t` 検証追加
- 再発防止: 例）ヘルスチェック/監視項目追加（ポート開放/レスポンス）
- タイムライン: 発生〜検知〜復旧〜恒久化

---

## コマンド速攻メモ
- ポート待受: `sudo ss -lntp | rg ':80|:443|:3000'`
- ローカル疎通: `curl -v http://127.0.0.1:<PORT>`
- 外部疎通: `curl -v --connect-timeout 5 http://<Public-IP or DNS>:<PORT>`
- Nginx 設定ダンプ: `sudo nginx -T | rg -i 'listen|server_name|proxy_pass'`
- サービス確認: `sudo systemctl status <svc>` / `journalctl -u <svc> -e`
- Docker ポート: `docker ps` → `docker port <CONTAINER_ID>`

---

## AWS ツール活用

- Reachability Analyzer（経路可視化）
  - 目的: ALB → EC2（ENI）間など VPC 内の到達性を網羅的に検証
  - 手順: VPC → Reachability Analyzer → Create and analyze path
    - Source: `ALB の ENI`（または別 EC2 の ENI）
    - Destination: `EC2 の ENI`（ターゲット）
    - Protocol/Port: アプリのポート（例: TCP/80）
  - 典型検出: SG/NACL の拒否、ルート欠落、AZ/サブネット誤り
  - メモ: 直インターネット ↔ EC2 の可視化は制約あり。ALB 経由構成での検証が有効

- VPC Flow Logs（CloudWatch Logs Insights クエリ例）
  - 有効化: VPC/サブネット/ENI 単位で有効化（`all` もしくは必要フィールド）
  - REJECT をポート別集計
    - クエリ:
      ```
      filter action = "REJECT"
      | stats count() as rejects by dstPort, protocol, @logStream
      | sort rejects desc
      ```
  - 80/443 向け INBOUND の ACCEPT/REJECT を把握
      ```
      filter dstPort in [80,443] and (action="ACCEPT" or action="REJECT")
      | stats count() as hits by action, srcAddr, dstAddr
      | sort hits desc
      ```
  - 特定 ENI の拒否元上位
      ```
      filter interfaceId = 'eni-xxxxxxxx' and action = "REJECT"
      | stats count() as c by srcAddr
      | sort c desc
      | limit 50
      ```

---

## ALB ヘルス Cookbook

- 推奨ヘルス設定（HTTP サービス例）
  - Protocol/Port: `HTTP` / `traffic-port`
  - Path: `/healthz`（認証不要・軽量）
  - Success codes: `200-399`
  - Interval/Timeout: `15s` / `5s`、Healthy/Unhealthy threshold: `2` / `2-5`
  - Host header: アプリが Host 必須なら設定（ターゲットグループの拡張設定）

- ターゲットグループ運用
  - Deregistration delay: `30-60s`（接続のドレイン）
  - Slow start: 必要に応じて新規ターゲットの保護
  - Cross-zone: 有効化で分散性/可用性向上

  - 典型不一致
  - EC2 が `127.0.0.1` で待受、ポート/プロトコル不一致
  - SG の参照漏れ: `ALB SG → EC2 SG` を Inbound で許可していない
  - `/healthz` が認証保護/リダイレクト（HTTPS 強制や Host 依存）

---

## 貼り付け式チェックリスト（最短復旧用）

事前に変数を設定（必要に応じて編集）:

```
export PORT=80
export PUBLIC="<Public-IP-or-DNS>"    # 例: 203.0.113.10 or app.example.com
export LOCAL="http://127.0.0.1:$PORT"
```

- [ ] プロセス待受: `sudo ss -lntp "sport = :$PORT"`
- [ ] ローカル疎通: `curl -sv --max-time 3 "$LOCAL"`
- [ ] OSFW 確認: `sudo ufw status` / `sudo firewall-cmd --list-all`
- [ ] Nginx 構文: `sudo nginx -t`（使用時）
- [ ] サービス状態: `sudo systemctl status <svc>` / `journalctl -u <svc> -e`
- [ ] Docker 公開: `docker ps` と `docker port <CID>`（使用時、`-p` 指定必須）
- [ ] サブネット/ルート: パブリックサブネット（`0.0.0.0/0 → igw-...`）を確認
- [ ] パブリック IP/EIP: EC2 に Public IPv4 が付与
- [ ] SG 最小開放（検証）: Inbound `tcp $PORT` from `0.0.0.0/0`（検証後に絞る）
- [ ] 外部疎通: `curl -sv --connect-timeout 5 "http://$PUBLIC:$PORT"`

ALB 経由の場合（必要なときだけ）:

- [ ] TG ヘルス: `aws elbv2 describe-target-health --target-group-arn <tg-arn>`
- [ ] Host 依存性: `curl -s -H "Host: <domain>" http://127.0.0.1:$PORT/healthz`
- [ ] SG 参照: `EC2 SG` Inbound に `ALB SG` を指定

---

## AWS CLI / IaC 検証コマンド集

インスタンス/ネットワークの実態と意図（IaC）を突き合わせてドリフト検知。

### EC2 基本属性

```
aws ec2 describe-instances \
  --instance-ids i-xxxxxxxxxxxxxxxxx \
  --query 'Reservations[].Instances[].{Id:InstanceId,State:State.Name,Pub:PublicIpAddress,Priv:PrivateIpAddress,Subnet:SubnetId,SG:SecurityGroups[].GroupId}' \
  --output table
```

### ルートテーブル（サブネット紐付けで確認）

```
aws ec2 describe-route-tables \
  --filters Name=association.subnet-id,Values=subnet-xxxxxxxx \
  --query 'RouteTables[].Routes[].{Dest:DestinationCidrBlock??DestinationIpv6CidrBlock,Target:GatewayId??NatGatewayId??TransitGatewayId}' \
  --output table
```

### セキュリティグループ（最小権限を確認）

```
aws ec2 describe-security-groups \
  --group-ids sg-xxxxxxxx \
  --query 'SecurityGroups[].{Name:GroupName,In:IpPermissions,Out:IpPermissionsEgress}'
```

### NACL（サブネット単位）

```
aws ec2 describe-network-acls \
  --filters Name=association.subnet-id,Values=subnet-xxxxxxxx \
  --query 'NetworkAcls[].Entries[]'
```

### ALB / ターゲットグループ

```
aws elbv2 describe-load-balancers --names <alb-name>
aws elbv2 describe-listeners --load-balancer-arn <alb-arn>
aws elbv2 describe-target-groups --load-balancer-arn <alb-arn>
aws elbv2 describe-target-health --target-group-arn <tg-arn>
```

ヘルス詳細の理由コードを確認（`Reason`/`Description`）。Host ヘッダ依存のアプリはターゲットテストでも Host を付与。

### Terraform（ドリフト/意図の確認）

- 計画のみ更新（差分検出）: `terraform plan -refresh-only`
- 具体値の確認: `terraform state show aws_security_group.<name>`
- CI に `nginx -t` 等の構文検証を組込み、変更時に早期検知

---

## パブリック IP なし運用（SSM / ALB パターン）

パブリックに直公開せず、ALB 経由または SSM で保守する安全な構成。

### 前提
- EC2 に SSM Agent（デフォルト AMI は同梱が多い）
- IAM ロール: `AmazonSSMManagedInstanceCore`
- アウトバウンド: NAT GW もしくは VPC エンドポイント（SSM/EC2Messages/SSMMessages）

### SSM ポートフォワード（現地確認用）

```
aws ssm start-session \
  --target i-xxxxxxxxxxxxxxxxx \
  --document-name AWS-StartPortForwardingSession \
  --parameters 'portNumber=["80"],localPortNumber=["8080"]'

# 以降はローカル 8080 → EC2 80 に転送
curl -sv http://127.0.0.1:8080/healthz
```

### ALB 経由公開
- インターネット公開は ALB のみ。`ALB SG → EC2 SG` を Inbound 参照
- ターゲットはプライベートサブネットで OK（ALB はパブリック）
- ヘルスチェック Path は認証不要/軽量に

---

## IPv6 到達性ガイド

### インバウンド IPv6 を許可する場合
- サブネットに IPv6 アドレス割当、インスタンスに IPv6 を付与
- ルートテーブル: `::/0 → igw-...`（インターネット GW）
- SG: Inbound `tcp 80/443` from `::/0`（検証後に絞る）
- NACL: Inbound `80/443`、エフェメラル `1024-65535`、Outbound 対応ポート
- DNS: AAAA レコードを発行、検証は `curl -6` / `dig AAAA`

### アウトバウンドのみ（受信拒否）
- `::/0 → egress-only-igw-...` をルート（受信は不可）
- 公開は ALB/NLB（デュアルスタック）経由で実施

### ALB と IPv6
- ALB はフロントで IPv6 を受け、ターゲットへは IPv4 で接続可能（一般的）
- デュアルスタック有効化と SG/NACL の双方の整合を確認

---

## ALB 502/504 深掘り

### 現象と典型原因
- 502 Bad Gateway: ターゲットが不正応答/プロトコル不一致、ヘッダ破損、バックエンド落ち
- 504 Gateway Timeout: ターゲット応答遅延、経路遮断、アイドルタイムアウト超過

### 切り分け手順
- ターゲット直叩き: `curl -sv -H "Host: <domain>" http://127.0.0.1:<PORT>/healthz`
- ターゲットヘルス: `aws elbv2 describe-target-health --target-group-arn <tg-arn>` の `Reason`
- SG 参照関係: `ALB SG → EC2 SG` を Inbound で許可
- アイドルタイムアウト: 長処理は ALB `idle_timeout` とアプリ/リバプロのタイムアウトを整合
- ヘッダ/サイズ: 大きい Cookie/ヘッダはアプリ/リバプロの制限に抵触しないか
- HTTP/バージョン: keep-alive/HTTP1.1/2 の整合（不要な `Connection: close` を避ける）

### 代表的対処
- ヘルスチェック Path を `/healthz` など軽量・無認証に変更
- アプリのタイムアウト/DB タイムアウトを業務要件に合わせて調整
- ALB `idle_timeout` を延長（例: 60→120s）、もしくはストリーミング/非同期化
- Nginx: `proxy_read_timeout`/`proxy_send_timeout`/`client_header_buffer_size` 等の見直し

---

## 監視と再発防止

### メトリクス/アラーム
- Application ELB: `HTTPCode_ELB_5XX_Count`、`HTTPCode_Target_5XX_Count`、`TargetResponseTime`、`HealthyHostCount`
- EC2: `StatusCheckFailed`、アプリのプローブ結果（CloudWatch Agent で収集）
- しきい値例: 5xx が 5 分平均で > X、HealthyHostCount < N を通知

### ヘルス監視
- Route 53 Health Check（/healthz を監視、フェイルオーバールーティング）
- ALB ターゲットヘルスの変動を EventBridge で通知

### 構成ドリフト/ポリシー
- AWS Config: `restricted-ssh`、`restricted-common-ports`、`vpc-default-security-group-closed` 等を有効化
- EventBridge: SG 変更イベント（Authorize/Revoke）を検知し通知

### 運用ガードレール
- CI に Nginx 構文検証/アプリ起動テストを追加（`nginx -t`、ポート待受）
- 合意済み SG テンプレート化（Terraform Module）で最小権限を標準化
- 外形監視（合成トランザクション）で早期検知

---

## 5分ディシジョンツリー（テキスト版）

1) `curl -sv http://127.0.0.1:<PORT>` は成功するか？
   - No → アプリ/OSFW/Nginx を修正（上記 A/B/C を参照）
   - Yes → 2 へ
2) `curl -sv --connect-timeout 5 http://<Public-IP or DNS>:<PORT>` は？
   - タイムアウト → 経路/SG/NACL/IGW（AWS 側）を重点確認
   - Connection refused → プロセス待受/OSFW/Nginx bind を確認
   - 4xx/5xx → Nginx/アプリ設定・ログで原因特定
3) ALB 経由なら TG ヘルスは Healthy？
   - No → Path/SG 参照/Host 依存/プロトコル不一致を修正
   - Yes → 502/504 深掘りへ（上記セクション）

---

## Nginx リバプロ最小テンプレ（安全寄り）

```
server {
    listen 80;
    listen [::]:80;
    server_name _;

    # 基本ヘルス
    location = /healthz { return 200 'ok\n'; add_header Content-Type text/plain; }

    # アプリへプロキシ
    location / {
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_pass http://127.0.0.1:3000;
        proxy_read_timeout 60s;
    }

    # 最低限のセキュリティヘッダ（必要に応じて拡張）
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options SAMEORIGIN always;
}

# 反映
# sudo nginx -t && sudo systemctl reload nginx
```

---

## ALB vs NLB 選定メモ

- ALB: HTTP/HTTPS レイヤ7、Host/Path ルーティング、WAF 連携、HTTP/2。一般的な Web に推奨
- NLB: L4 高スループット/低遅延、固定 IP/EIP、TLS パススルー可、ヘルスは TCP/HTTP いずれか
- 迷ったら: 基本は ALB、TCP/独自プロトコルや超高スループットが必要なら NLB
- SG: ALB/NLB それぞれの SG と EC2 SG の参照関係を明示

---

## TLS/HTTP 検証レシピ（現地/外部）

- 外部 HTTPS ヘッダ: `curl -vkI https://<domain>`
- SNI/Host 指定: `curl -vk --resolve <domain>:443:<IP> https://<domain>/`（DNS 迂回）
- HTTP/2 確認: `curl -I --http2 https://<domain>`
- サーバ証明書詳細: `echo | openssl s_client -connect <domain>:443 -servername <domain> 2>/dev/null | openssl x509 -noout -text`
- ALPN/プロトコル: `openssl s_client -connect <domain>:443 -alpn h2,http/1.1 -servername <domain>`

---

## 緊急時の迅速遮断（最小影響で）

- SG 一時封鎖（IP/CIDR 単位）
  - 追加拒否はできないため、許可リストから除外する設計に（デフォルト拒否）
- NACL 即時遮断
  - Inbound/Outbound に `Rule #100` など低番で `DENY` を追加（/32 単位で対象）
- WAF レート制限
  - `Rate-based rule` を ALB にアタッチ、しきい値を段階的に調整
- 監査
  - VPC Flow Logs/ALB アクセスログ/CloudFront ログで加害元を抽出

---

## ブルー/グリーン切替（ALB/TG 最小手順）

1) 新バージョンを別ターゲットグループ（Green）に登録、ヘルス Healthy まで待機
2) ALB リスナーのルール/デフォルトアクションを Blue→Green に切替
3) トラフィック監視（5xx/レイテンシ）し、問題なければ Blue を Deregister
4) Rollback はリスナーを元に戻すだけで即時可

---

## HTTPS 終端（Nginx / ALB）

### Nginx での TLS（Let’s Encrypt 自動更新）

1) 80 を確実に待受（HTTP-01 用）し、`/.well-known/acme-challenge/` を通す
   - Nginx 例（最小）:
     ```
     server {
       listen 80; listen [::]:80; server_name example.com;
       location /.well-known/acme-challenge/ { root /var/www/html; }
       location / { return 301 https://$host$request_uri; }
     }
     ```
2) 証明書取得（webroot）
   ```
   sudo mkdir -p /var/www/html
   sudo certbot certonly --webroot -w /var/www/html -d example.com -d www.example.com
   ```
3) TLS サーバブロック
   ```
   server {
     listen 443 ssl http2; listen [::]:443 ssl http2; server_name example.com;
     ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
     ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
     ssl_protocols TLSv1.2 TLSv1.3;
     ssl_ciphers HIGH:!aNULL:!MD5;
     add_header Strict-Transport-Security "max-age=31536000" always;

     location = /healthz { return 200 'ok\n'; add_header Content-Type text/plain; }
     location / { proxy_pass http://127.0.0.1:3000; proxy_set_header Host $host; proxy_http_version 1.1; proxy_set_header Connection ""; }
   }
   ```
4) 自動更新
   - 動作確認: `sudo certbot renew --dry-run`
   - systemd timer 既定（snap/apt により自動化）。Nginx reload が必要な場合は `--deploy-hook 'systemctl reload nginx'`

注意: 本番は `server_name` を FQDN に限定し、HSTS は導入基準を満たしてから有効化。

### ALB での TLS 終端

- ACM 証明書（同一リージョン）を用意し、ALB リスナー 443 にアタッチ
- 80→443 へリダイレクト（ALB リスナールール）。ターゲットは通常 `HTTP : traffic-port`
- セキュリティポリシーは最新（例: `ELBSecurityPolicy-TLS13-1-2-2021-06`）を選択

CLI 例（要置換）:
```
aws elbv2 create-listener \
  --load-balancer-arn <alb-arn> \
  --protocol HTTPS --port 443 \
  --certificates CertificateArn=<acm-arn> \
  --ssl-policy ELBSecurityPolicy-TLS13-1-2-2021-06 \
  --default-actions Type=forward,TargetGroupArn=<tg-arn>

aws elbv2 create-listener \
  --load-balancer-arn <alb-arn> \
  --protocol HTTP --port 80 \
  --default-actions Type=redirect,'RedirectConfig={Protocol=HTTPS,Port=443,StatusCode=HTTP_301}'
```

---

## SELinux / firewalld（RHEL/CentOS/Amazon Linux）

### SELinux
- 状態確認: `getenforce`（Enforcing/Permissive/Disabled）
- ネットワーク接続を許可（Nginx→上流など）:
  - `sudo setsebool -P httpd_can_network_connect on`
- カスタムポートを HTTP として許可（例: 8080）:
  - `sudo semanage port -a -t http_port_t -p tcp 8080`（存在時は `-m`）
- 直近ブロックの把握: `sudo ausearch -m AVC,USER_AVC -ts recent`
- 必要時のみポリシー生成: `sudo ausearch -m avc -ts recent | audit2allow -M mypol && sudo semodule -i mypol.pp`

### firewalld
- 現状確認: `sudo firewall-cmd --state && sudo firewall-cmd --list-all`
- 80/443 を恒久許可: `sudo firewall-cmd --permanent --add-service=http --add-service=https && sudo firewall-cmd --reload`
- 任意ポートを許可（例: 3000/tcp）: `sudo firewall-cmd --permanent --add-port=3000/tcp && sudo firewall-cmd --reload`

---

## Terraform 最小例（SG/ALB/TG/リスナー）

注意: 運用では CIDR を最小化し、ALB 経由を前提にする。

```hcl
resource "aws_security_group" "web" {
  name        = "web-sg"
  description = "Allow HTTP/HTTPS"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_lb" "this" {
  name               = "web-alb"
  load_balancer_type = "application"
  subnets            = var.public_subnet_ids
  security_groups    = [aws_security_group.web.id]
}

resource "aws_lb_target_group" "web" {
  name     = "web-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = var.vpc_id
  health_check {
    path = "/healthz"
  }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.this.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.acm_cert_arn
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web.arn
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.this.arn
  port              = 80
  protocol          = "HTTP"
  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}
```

---

## ripgrep 非導入環境の代替

- `rg` が無い場合の代替:
  - 再帰検索: `grep -RIn --color -e "pattern" .`
  - ファイル一覧: `find . -type f | sed -e 's#^./##'`
  - ポート待受の抽出: `sudo ss -lntp | grep -E ":(80|443|3000)"`

---

## systemd Unit 最小例

Web アプリを確実に自動起動・復旧するための最小 Unit 例。

```
# /etc/systemd/system/myapp.service
[Unit]
Description=My Web App
Wants=network-online.target
After=network-online.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/srv/myapp
Environment=HOST=0.0.0.0
Environment=PORT=3000
ExecStart=/usr/bin/env bash -lc 'node server.js'
Restart=always
RestartSec=3
TimeoutStartSec=30

[Install]
WantedBy=multi-user.target
```

操作コマンド:
- 反映: `sudo systemctl daemon-reload && sudo systemctl enable --now myapp`
- 状態/ログ: `systemctl status myapp` / `journalctl -u myapp -e`

Nginx 逆プロキシと併用する場合は `proxy_pass http://127.0.0.1:3000;` を設定。

---

## 監視テンプレ（CloudWatch JSON）

### アラーム例: ターゲット 5xx 増加

```json
{
  "AlarmName": "alb-target-5xx-sum-gt5-5m",
  "ComparisonOperator": "GreaterThanThreshold",
  "EvaluationPeriods": 5,
  "DatapointsToAlarm": 3,
  "MetricName": "HTTPCode_Target_5XX_Count",
  "Namespace": "AWS/ApplicationELB",
  "Period": 60,
  "Statistic": "Sum",
  "Threshold": 5,
  "TreatMissingData": "notBreaching",
  "Dimensions": [
    { "Name": "LoadBalancer", "Value": "app/my-alb/1234567890abcdef" },
    { "Name": "TargetGroup", "Value": "targetgroup/my-tg/abcdef1234567890" }
  ]
}
```

### アラーム例: HealthyHostCount 低下

```json
{
  "AlarmName": "alb-healthyhostcount-min-lt1-2m",
  "ComparisonOperator": "LessThanThreshold",
  "EvaluationPeriods": 2,
  "DatapointsToAlarm": 2,
  "MetricName": "HealthyHostCount",
  "Namespace": "AWS/ApplicationELB",
  "Period": 60,
  "Statistic": "Minimum",
  "Threshold": 1,
  "TreatMissingData": "breaching",
  "Dimensions": [
    { "Name": "LoadBalancer", "Value": "app/my-alb/1234567890abcdef" },
    { "Name": "TargetGroup", "Value": "targetgroup/my-tg/abcdef1234567890" }
  ]
}
```

CLI で作成:
```
aws cloudwatch put-metric-alarm --cli-input-json file://alarm-5xx.json
aws cloudwatch put-metric-alarm --cli-input-json file://alarm-hhc.json
```

### ダッシュボード例（抜粋）

```json
{
  "widgets": [
    {
      "type": "metric",
      "x": 0, "y": 0, "width": 12, "height": 6,
      "properties": {
        "metrics": [
          [ "AWS/ApplicationELB", "RequestCount", "LoadBalancer", "app/my-alb/1234567890abcdef" ],
          [ ".", "HTTPCode_ELB_5XX_Count", ".", ".", { "yAxis": "right" } ]
        ],
        "region": "ap-northeast-1",
        "stat": "Sum",
        "period": 60,
        "title": "ALB Requests & 5XX"
      }
    },
    {
      "type": "metric",
      "x": 12, "y": 0, "width": 12, "height": 6,
      "properties": {
        "metrics": [
          [ "AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", "app/my-alb/1234567890abcdef" ],
          [ ".", "HealthyHostCount", "TargetGroup", "targetgroup/my-tg/abcdef1234567890", "LoadBalancer", "app/my-alb/1234567890abcdef", { "stat": "Minimum" } ]
        ],
        "region": "ap-northeast-1",
        "stat": "Average",
        "period": 60,
        "title": "Latency & Healthy Hosts"
      }
    }
  ]
}
```

作成:
```
aws cloudwatch put-dashboard --dashboard-name web-ingress --dashboard-body file://dashboard.json
```

---

## ALB アクセスログ有効化

目的: 5xx/レイテンシ/分布分析のため ALB から S3 へアクセスログを出力。

1) S3 バケット作成とポリシー
- テンプレ: `docs/templates/s3-alb-logs-bucket-policy.json`
- バケットは ALB と同リージョンで作成し、リージョンのELBサービスアカウントを Principal に許可

2) ALB でアクセスログを有効化（CLI）
```
aws elbv2 modify-load-balancer-attributes \
  --load-balancer-arn <alb-arn> \
  --attributes Key=access_logs.s3.enabled,Value=true Key=access_logs.s3.bucket,Value=<bucket> Key=access_logs.s3.prefix,Value=alb/
```

3) Terraform 例
- テンプレ: `docs/templates/terraform-alb-logs.tf`

検証: S3 に `AWSLogs/<account-id>/elasticloadbalancing/<region>/` プレフィックスで出力されることを確認。

---

## Lambda 配備 IaC（Slack通知）

目的: Slack 通知 Lambda（`docs/templates/lambda-ssm-automation-slack.py`）を IaC で配備。

- Terraform 例: `docs/templates/terraform-slack-automation.tf`
- SAM 例: `docs/templates/sam-slack-automation.yaml`

構成: Lambda（環境変数/権限）+ EventBridge ルール + Lambda 権限 + IAM ロール/ポリシー。

---

## QuickSight ダッシュボード CLI 作成

目的: データセットからダッシュボードを CLI で作成。

- テンプレ: `docs/templates/quicksight-dashboard-template.json`
- 作成例:
```
aws quicksight create-dashboard \
  --aws-account-id $ACC \
  --dashboard-id alb-ops \
  --name "ALB Ops" \
  --source-entity file://docs/templates/quicksight-dashboard-template.json \
  --permissions file://docs/templates/quicksight-permissions.json \
  --region $REGION
```

---

## Route53 運用（TTL/加重/CNAME）

- TTL 戦略: 切替頻度が高いエイリアスは 60–120s、安定運用は 300–600s
- 加重ルーティング（Canary）: 1%→10%→100% の比率で 2 レコードを運用
  - テンプレ: `docs/templates/route53-weighted-change.json`
  - 反映: `aws route53 change-resource-record-sets --hosted-zone-id Zxxxxxxxx --change-batch file://docs/templates/route53-weighted-change.json`
- 伝播確認: `dig <name> +short`、`resolver`/`location` を変えて確認（8.8.8.8/1.1.1.1）

---

## Synthetics カナリア

目的: `/healthz` や主要ページの外形監視をエッジから実施。

- スクリプト: `docs/templates/synthetics-canary-hello.js`
- 導入: コードを S3 にアップロードし、CLI/Terraform/CFn で Canaries を作成
  - 参考テンプレ（CFn 抜粋）: `docs/templates/cfn-synthetics-canary.yaml`

---

## VPC エンドポイント標準セット

目的: NAT GW コスト削減と可用性向上のため、管理系/監視系のエンドポイントを標準化。

- Terraform: `docs/templates/terraform-vpc-endpoints.tf`
- 対象: SSM/EC2Messages/SSMMessages/CloudWatch/CloudWatchLogs/ECR(dkr/api)/S3(Gateway)

---

## WAF Terraform 例

目的: WebACL と例外/緩和を Terraform で一元管理。

- ベース: `docs/templates/terraform-wafv2-webacl.tf`
- 例外: `docs/templates/terraform-wafv2-exceptions.tf`

---

## レビュー/サインオフ手順

- テンプレ: `docs/templates/signoff-checklist.md`
- 手順: 変更申請 → PR（自動チェック有効）→ ステージで検証 → SRE/Sec/App レビュー会議 → 本番適用 → 事後レビュー

---

## 変更履歴

- 更新ルール: 重要な追加・変更は日付/編集者/要約を1行で残す

```
2025-09-11 SRE: HTTPS/Terraform/SELinux/CI/監視テンプレを追加
2025-09-10 SRE: 初版（基本チェック/ALBヘルス/IPv6/SSM）
```

テンプレ:
```
YYYY-MM-DD <Owner>: <要約（変更点/影響/参照Issueなど）>
```

---

## CI チェック（例）

### Nginx 構文検証（GitHub Actions）

リポジトリに `nginx.conf` などがある場合、Docker で `nginx -t` を実行して構文崩れを検知。

```yaml
# .github/workflows/nginx-lint.yml
name: nginx-lint
on: [push, pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Lint nginx.conf
        run: |
          docker run --rm \
            -v "$PWD/nginx.conf:/etc/nginx/nginx.conf:ro" \
            -v "$PWD/conf.d:/etc/nginx/conf.d:ro" \
            nginx:alpine nginx -t
```

### 簡易ポート/HTTP スモーク（アプリ起動できる場合）

```yaml
# .github/workflows/smoke.yml
name: smoke
on: [push, pull_request]
jobs:
  web:
    runs-on: ubuntu-latest
    env:
      HOST: 127.0.0.1
      PORT: 3000
    steps:
      - uses: actions/checkout@v4
      - name: Start app
        run: |
          nohup bash -lc "HOST=0.0.0.0 PORT=$PORT node server.js" >/tmp/app.log 2>&1 &
          sleep 3
      - name: Probe
        run: |
          curl -sv --max-time 5 "http://$HOST:$PORT/healthz" || (cat /tmp/app.log; exit 1)
```

### ローカル用ワンライナー/スクリプト

```
# scripts/verify-ingress.sh
set -euo pipefail
PORT="${1:-80}"
echo "[1/4] ss listen on :$PORT" && (ss -lntp 2>/dev/null | rg ":$PORT" || true)
echo "[2/4] localhost curl" && curl -sv --max-time 3 "http://127.0.0.1:$PORT" || true
echo "[3/4] nginx -t" && (command -v nginx && sudo nginx -t) || echo "nginx not installed"
echo "[4/4] ip a / route" && ip -brief a && ip route
```

---

## 図解（ASCII トポロジ）

直公開（パブリック EC2）
```
Internet ── Route53(DNS) ── IGW ── [Public Subnet] ── EC2(Public IP) ── App
             (A/AAAA)               (0.0.0.0/0→igw)   (SG: 80/443)
```

ALB 経由（推奨）
```
Internet ── Route53 ── ALB(SG) ── [Private Subnet] ── EC2(no public IP) ── App
                      (443終端)       (::/0不要)        (SG: from ALB SG)
```

デュアルスタック（IPv4/IPv6）
```
Clients(v4/v6) ── Route53 (A/AAAA) ── ALB(dualstack) ── EC2(IPv4)
                              \
                               └─ Outbound only(v6): ::/0 → egress-only-igw
```

---

## CDN/プロキシ併用時の注意

- バイパス検証
  - CloudFront: オリジン（ALB DNS）へ直接アクセス、または `--resolve <domain>:443:<ALB-IP>`
  - Cloudflare: オレンジ雲を一時グレー化、もしくはバイパス用 `origin.example.com` を用意
- Host/SNI/HTTPS
  - `curl -vk --resolve <domain>:443:<IP> https://<domain>/` で SNI/Host を維持したまま到達性確認
  - リダイレクトループは `X-Forwarded-Proto`/`X-Forwarded-Host` 取扱い不備が原因になりやすい
- クライアント IP
  - `X-Forwarded-For`/`CF-Connecting-IP` をアプリ/ログで記録、レート制御は CDN ルールと両面で
- キャッシュ/無効化
  - 5xx 切り分け時はキャッシュを一時無効化/パージ。`Cache-Control: no-store` でヘルスを除外
- WebSocket/長時間接続
  - ALB/CloudFront それぞれのアイドルタイムアウトとプロトコル対応を整合

---

## VPC Flow Logs 上級クエリ

前提: 必要に応じて拡張フィールド（例: `tcp-flags`）をログフォーマットに追加してから有効化。

- 時系列の受信/拒否（ポート別）
  ```
  filter dstPort in [80,443]
  | stats count() as hits by bin(5m), action, dstPort
  | sort bin(5m) asc
  ```

- 指定 ENI への上位送信元（ACCEPT のみ、直近 1 時間）
  ```
  filter @timestamp > ago(1h) and interfaceId = 'eni-xxxxxxxx' and action = 'ACCEPT'
  | stats count() as hits, sum(bytes) as bytes by srcAddr, dstPort
  | sort hits desc
  | limit 50
  ```

- REJECT の急増検知（上位ポート）
  ```
  filter action = 'REJECT'
  | stats count() as rejects by dstPort
  | sort rejects desc
  | limit 20
  ```

- 大容量フロー（バイト量上位、双方向合算ではなく片方向単位）
  ```
  stats sum(bytes) as B, sum(packets) as P by srcAddr, srcPort, dstAddr, dstPort, protocol
  | sort B desc
  | limit 50
  ```

- 例外的な宛先ポート（Well-known 以外の <1024）
  ```
  filter dstPort < 1024 and dstPort not in [22,80,443]
  | stats count() as c by dstPort
  | sort c desc
  ```

- TCP SYN が多い（DoS 兆候の参考、`tcp-flags` 記録時）
  ```
  filter action='ACCEPT' and ispresent(tcpFlags) and tcpFlags='S'
  | stats count() as syns by srcAddr
  | sort syns desc
  | limit 50
  ```

メモ: Flow Logs は L3/L4 の可視化。アプリ層の詳細は ALB アクセスログ/アプリログと併用。

---

## ALB ウェイト付きルーティング

段階的リリース（1%→10%→100%）をリスナーの `forward` で実現。

### CLI（JSON ファイルで安全に適用）

1) `forward.json` を用意
```json
{
  "Type": "forward",
  "ForwardConfig": {
    "TargetGroups": [
      { "TargetGroupArn": "arn:aws:elasticloadbalancing:...:targetgroup/blue/...",  "Weight": 99 },
      { "TargetGroupArn": "arn:aws:elasticloadbalancing:...:targetgroup/green/...", "Weight": 1 }
    ],
    "TargetGroupStickinessConfig": { "Enabled": true, "DurationSeconds": 300 }
  }
}
```

2) 適用
```
aws elbv2 modify-listener \
  --listener-arn <listener-arn> \
  --default-actions file://forward.json
```

重みを段階的に変更（1→10→100）。ロールバックは `Weight` を元に戻すだけ。

### Terraform（抜粋）

```hcl
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.this.arn
  port              = 443
  protocol          = "HTTPS"
  certificate_arn   = var.acm_cert_arn
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"

  default_action {
    type = "forward"
    forward {
      target_group {
        arn    = aws_lb_target_group.blue.arn
        weight = 99
      }
      target_group {
        arn    = aws_lb_target_group.green.arn
        weight = 1
      }
      stickiness {
        enabled  = true
        duration = 300
      }
    }
  }
}
```

注意: ステートフルなアプリはセッションピン留めや互換性の確認が必要。各段階で 5xx/レイテンシを監視。

---

## コスト最適化の勘所

- NAT Gateway の通過トラフィックを削減
  - SSM/CloudWatch Logs/CloudWatch/EC2Messages/SSMMessages/ECR などは VPC エンドポイント（Gateway/Interface）化
  - 監視/メトリクス送信はエンドポイント経由へ、OS/アプリの外向き依存は見直し
- ALB/NLB の使い分け
  - HTTP/HTTPS は ALB、L4/TLSパススルー大量接続は NLB（固定IP/EIP も利点）
  - 低トラフィック環境での ALB 常時コストに注意（CloudFront + S3 など静的代替の検討）
- 外向き帯域とログのライフサイクル
  - アクセスログ/Flow Logs/S3 の Storage/Lifecycle（30–90日で IA/Glacier）
  - Athena 分析はクエリ対象を絞る（日付/Prefix/列投影）
- 料金体系の前提
  - クロスAZは ALB/NLB ともにデータ処理/転送コストが増える（可用性とトレードオフ）
  - CloudFront 併用でエッジキャッシュによりALB/EC2の帯域・リクエストを抑制

---

## Nginx セキュリティヘッダ・プリセット

共通インクルードとして配置し、HTTPS 運用時に適用（HSTS/CSP は要検討）。

```
# /etc/nginx/conf.d/security-headers.conf
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
# 強力: 本番でのみ。サブドメインも HTTPS 前提なら includeSubDomains を検討
add_header Strict-Transport-Security "max-age=31536000; preload" always;

# 任意: CSP は段階導入推奨。まずはレポートオンリーから
# add_header Content-Security-Policy-Report-Only "default-src 'self'; img-src 'self' data:; object-src 'none'" always;
```

適用例（server ブロック内）:
```
include /etc/nginx/conf.d/security-headers.conf;
```

---

## OS コマンド差分（AL2023/Ubuntu 22.04）

- パッケージ管理
  - Amazon Linux 2023: `dnf install -y <pkg>`（旧 `yum` 互換あり）
  - Ubuntu 22.04: `apt-get update && apt-get install -y <pkg>`
- OS ファイアウォール
  - RHEL系/AL2023: `firewalld`（例: `firewall-cmd --permanent --add-service=http && --reload`）
  - Ubuntu: `ufw`（例: `ufw allow 'Nginx Full'`）
- SELinux/`semanage`
  - RHEL系/AL2023: `dnf install -y policycoreutils-python-utils`（RHEL7 は `policycoreutils-python`）
  - Ubuntu: `apt-get install -y policycoreutils-python-utils`（必要に応じて `selinux-utils`）
- ネットワーク可視化
  - 両者: `ss`, `ip`, `journalctl`, `systemctl` は共通

---

## IAM ポリシー最小セット

実運用では職務分離を前提に、閲覧系と変更系を分離。

### 閲覧（トラブルシュート用 ReadOnly）

```json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow", "Action": [
      "ec2:DescribeInstances", "ec2:DescribeNetworkInterfaces", "ec2:DescribeRouteTables",
      "ec2:DescribeSecurityGroups", "ec2:DescribeNetworkAcls", "ec2:DescribeSubnets",
      "elasticloadbalancing:Describe*", "logs:StartQuery", "logs:GetQueryResults",
      "logs:DescribeLogGroups", "logs:DescribeLogStreams", "cloudwatch:GetMetricData",
      "cloudwatch:ListMetrics", "acm:ListCertificates", "acm:DescribeCertificate"
    ], "Resource": "*" },
    { "Effect": "Allow", "Action": [
      "ssm:StartSession", "ssm:DescribeInstanceInformation", "ssm:DescribeSessions",
      "ssm:TerminateSession"
    ], "Resource": "*" }
  ]
}
```

### 変更（最小例・環境に合わせて限定）

```json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow", "Action": [
      "elasticloadbalancing:ModifyListener", "elasticloadbalancing:ModifyRule",
      "elasticloadbalancing:RegisterTargets", "elasticloadbalancing:DeregisterTargets"
    ], "Resource": "*" },
    { "Effect": "Allow", "Action": [
      "ec2:AuthorizeSecurityGroupIngress", "ec2:RevokeSecurityGroupIngress",
      "ec2:AuthorizeSecurityGroupEgress", "ec2:RevokeSecurityGroupEgress"
    ], "Resource": "*" }
  ]
}
```

備考: SSM 経由運用ではインスタンス側 IAM に `AmazonSSMManagedInstanceCore` を付与。

---

## クイックチェック・スクリプト

`scripts/ec2-quickcheck.sh` を用意（ポート/公開ホストを引数で指定）。

使い方:
```
bash scripts/ec2-quickcheck.sh 80 app.example.com
```

出力: 待受/ローカル疎通/OSFW/Nginx 構文/外部疎通（DNS解決）などのサマリ。必要に応じて `sudo` を要求。

---

## 公式リファレンス

- EC2 セキュリティグループ: https://docs.aws.amazon.com/vpc/latest/userguide/security-groups.html
- VPC ルート/IGW: https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Internet_Gateway.html
- NACL: https://docs.aws.amazon.com/vpc/latest/userguide/vpc-network-acls.html
- ALB ターゲットヘルス/理由コード: https://docs.aws.amazon.com/elasticloadbalancing/latest/application/target-group-health-checks.html
- ALB リスナー/ルール: https://docs.aws.amazon.com/elasticloadbalancing/latest/application/listener-update-rules.html
- VPC Reachability Analyzer: https://docs.aws.amazon.com/vpc/latest/reachability/what-is-reachability-analyzer.html
- VPC Flow Logs: https://docs.aws.amazon.com/vpc/latest/userguide/flow-logs.html
- AWS Systems Manager Session Manager: https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html
- AWS Certificate Manager: https://docs.aws.amazon.com/acm/latest/userguide/acm-overview.html
- CloudWatch (ELB metrics): https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-cloudwatch-metrics.html

---

## WAF プリセット（WebACL）

- 目的: まずはマネージドルール＋レート制限で基本防御を標準化。必要に応じて国別/パス別の拡張。
- テンプレート: `docs/templates/wafv2-web-acl.json`（REGIONAL, Default Allow, AWS MRGs + RateLimit）
- 適用手順（ALB に関連付け）:
  - 作成: `aws wafv2 create-web-acl --cli-input-json file://docs/templates/wafv2-web-acl.json`
  - 紐付け: `aws wafv2 associate-web-acl --web-acl-arn <web-acl-arn> --resource-arn <alb-arn>`
- 運用Tips: 初期は `Count` モードで誤検知を観測→除外ルールを設定→`Block` へ昇格。

### WAF 例外・緩和テンプレ

- テンプレ: `docs/templates/wafv2-exception-examples.json`
- 代表パターン:
  - マネージドルールの特定ルールを除外（`ExcludedRules`）
  - 特定パス（例: `/healthz`/`/status`）は常に許可（ScopeDown + Allow）
  - 一時的に `Count` で観測（運用切替の安全弁）
- 適用メモ: 例外追加時は CloudWatch メトリクス/サンプルリクエストを必ず監視。

### WAF 移行（Count→Block）

安全に `Count` から `Block` へ切替えるためのステップ。

1) 観測フェーズ（Count）
- 対象ルール/ルールグループを `OverrideAction: Count` に設定
- 監視: `AllowedRequests`/`BlockedRequests` メトリクス、`SampledRequests` で誤検知を確認

2) 除外/緩和の適用
- 誤検知に対し `ExcludedRules` や Path 限定 Allow をテンプレで追加

3) 切替（Block）
- `get-web-acl` で現行設定取得と `LockToken` 確認
  ```
  aws wafv2 get-web-acl --name <name> --scope REGIONAL --id <id> > webacl.json
  ```
- 対象ルールの `OverrideAction` を `None` に変更（= ベンダ既定アクションを適用）
- `update-web-acl` で反映（`--lock-token` 必須）
  ```
  aws wafv2 update-web-acl \
    --name <name> --scope REGIONAL --id <id> \
    --lock-token <token-from-get> \
    --cli-input-json file://webacl-updated.json
  ```

4) 検証
- 直後 15–30 分は `BlockedRequests` とアプリ5xxを注視。必要に応じて例外を追加

備考: 一括適用前にステージング ALB で先行検証するのが安全。

---

## Athena での ALB アクセスログ分析

- 目的: 5xx 上位・遅延 URL・UA/国別分布などを即時把握。
- テンプレート: `docs/templates/alb_access_logs_ddl.sql` を編集し実行（S3バケット/リージョン置換）。
- 代表クエリ例:
  - 5xx 上位 URL
    ```
    SELECT request_url, count(*) c
    FROM alb_logs
    WHERE elb_status_code BETWEEN 500 AND 599
    GROUP BY 1 ORDER BY c DESC LIMIT 50;
    ```
  - レイテンシ上位（ターゲット処理時間）
    ```
    SELECT request_url, avg(target_processing_time) avg_t, count(*) c
    FROM alb_logs
    GROUP BY 1 HAVING c > 10 ORDER BY avg_t DESC LIMIT 50;
    ```
  - クライアントIP上位
    ```
    SELECT client_ip, count(*) c FROM alb_logs GROUP BY 1 ORDER BY c DESC LIMIT 50;
    ```

### Athena 最適化（CTAS/パーティション）

- 目的: クエリ速度・コストの最適化（スキャン量削減）
- CTAS（列指向/圧縮）サンプル:
  ```
  CREATE TABLE alb_logs_parquet
  WITH (
    format='PARQUET',
    parquet_compression='SNAPPY',
    external_location='s3://<bucket>/athena/alb_parquet/',
    partitioned_by=ARRAY['year','month','day']
  ) AS
  SELECT *,
         substr(time, 1, 4)  AS year,
         substr(time, 6, 2)  AS month,
         substr(time, 9, 2)  AS day
  FROM alb_logs
  WHERE time BETWEEN '2025-01-01' AND '2025-01-31';
  ```
- 既存ログ取り込み（パーティション追加）:
  ```
  ALTER TABLE alb_logs_parquet ADD IF NOT EXISTS
    PARTITION (year='2025', month='01', day='01')
    LOCATION 's3://<bucket>/athena/alb_parquet/year=2025/month=01/day=01/';
  ```
- パーティション投影（動的）例:
  ```
  ALTER TABLE alb_logs_parquet SET TBLPROPERTIES (
    'projection.enabled'='true',
    'projection.year.type'='integer', 'projection.year.range'='2023,2027',
    'projection.month.type'='integer', 'projection.month.range'='1,12', 'projection.month.digits'='2',
    'projection.day.type'='integer',   'projection.day.range'  ='1,31',  'projection.day.digits'  ='2',
    'storage.location.template'='s3://<bucket>/athena/alb_parquet/year=${year}/month=${month}/day=${day}/'
  );
  ```
- 実務TIPS: まず DDL/Glue クローラでベーステーブル→CTAS で集約/圧縮→ダッシュボードから参照。

### Athena 可視化（QuickSight）

- 前提: QuickSight のAthena接続を有効化（ワークグループ/リージョン一致、S3アクセス権）
- データセット: `alb_logs_parquet` を参照、必要に応じて計算列（例: `date(parse_datetime(time,'yyyy-MM-dd''T''HH:mm:ss.SSSSSS''Z'''))`）
- 推奨ビジュアル:
  - 5xx 時系列（Sum）と TargetResponseTime（Average）
  - URL 上位（5xxフィルタ/遅延上位）
  - Client IP/UA/国別分布（地図/ツリーマップ）
- 運用:
  - SPICE にインポートし毎時リフレッシュ、コストを抑えつつ高速化
  - 権限: ダッシュボード共有は閲覧ロールに限定、行レベル権限は不要な限り避ける

#### CLI 作成例（データソース/データセット）

前提:
- QuickSight が有効化済み（対象リージョン）
- 実行者は QuickSight の Admin/Author 権限を持ち、`quicksight:*` 必要権限が付与

変数:
```
export ACC=<account-id>
export REGION=ap-northeast-1
export WG=primary   # Athena WorkGroup
```

1) データソース作成（Athena）
```
aws quicksight create-data-source \
  --aws-account-id "$ACC" \
  --data-source-id athena-ds \
  --name AthenaDataSource \
  --type ATHENA \
  --data-source-parameters AthenaParameters={WorkGroup=$WG} \
  --region "$REGION"

# ARN を取得
DS_ARN=$(aws quicksight describe-data-source \
  --aws-account-id "$ACC" \
  --data-source-id athena-ds \
  --query 'DataSource.Arn' --output text --region "$REGION")
echo "$DS_ARN"
```

2) データセット作成（ALB Logs Parquet を想定）
```
# テンプレを実値に差し替え
jq \
  --arg acc "$ACC" \
  --arg ds "$DS_ARN" \
  '.AwsAccountId=$acc | .PhysicalTableMap.MainTable.RelationalTable.DataSourceArn=$ds' \
  docs/templates/quicksight-dataset-alb.json > /tmp/quicksight-dataset.json

aws quicksight create-data-set \
  --cli-input-json file:///tmp/quicksight-dataset.json \
  --region "$REGION"
```

補足:
- `quicksight-datasource-athena.json` テンプレを使う場合は `--aws-account-id $ACC` を併用
- データセットのテーブル名 `alb_logs_parquet` は Athena 側の CTAS で作成した名称に合わせる
- 共有は「QuickSight パーミッション雛形/グループ例」を利用して付与

---

## SSM Automation 一括診断

- 目的: 1クリックで EC2/SG/NACL/Route/TG ヘルスなどをまとめて取得。
- ドキュメント: `docs/templates/ssm-automation-ec2-diagnose.yaml`（Automation, schema 0.3）
- 実行例:
  ```
  aws ssm start-automation-execution \
    --document-name EC2-Network-Quick-Diagnose \
    --parameters InstanceId=i-xxxxxxxx, PortNumber=80
  ```
- 出力: サブネット/ルート、紐付SG、NACL、Public IP、有効な経路、ターゲットヘルス（任意）

追加オプション（Reachability Analyzer 連携）:
- 目的: ENI→ENI の経路解析を自動実行（ALB→EC2 など）
- 使い方:
  ```
  aws ssm start-automation-execution \
    --document-name EC2-Network-Quick-Diagnose \
    --parameters InstanceId=i-xxxxxxxx, PortNumber=80, AnalyzeReachability=true, SourceEniId=eni-aaaa...
  ```
- 備考: インターネット→EC2 直の経路は制約あり。ALB 経由や ENI 間の可視化が有効。

---

## ChatOps 連携（Slack / AWS Chatbot）

- 目的: 主要アラームを Slack に通知し、その場から再診断（SSM Automation）を実行。
- 手順概要:
  - SNS トピックを作成し、CloudWatch アラームの通知先に設定
  - AWS Chatbot で Slack ワークスペース/チャンネルを登録し、SNS トピックを購読
  - Chatbot IAM ロールに `ssm:StartAutomationExecution` を許可（対象ドキュメントに限定）
  - Slack から `aws ssm start-automation-execution --document-name EC2-Network-Quick-Diagnose --parameters InstanceId=...` を実行
- 参考: ChatOps 導入後は「再検証」用の定型メッセージと手順リンクをピン留め

### Automation 成果のSlack整形通知

- 目的: SSM Automation の結果（サマリJSON）をSlackに整形送信して一次判断を高速化
- テンプレ: `docs/templates/lambda-ssm-automation-slack.py`（Webhook 方式）
- イベント: `SSM Automation Execution Status-change`（EventBridge）をトリガにLambda実行
- 導入手順（概要）:
  1) Slackで受信用のWebhook URLを発行（ワークスペースのアプリ設定）
  2) Lambda 関数をデプロイ（環境変数 `SLACK_WEBHOOK_URL` を設定）
  3) EventBridge ルール（`source: aws.ssm`、`detail-type: Automation Step Status Change|Automation Execution Status Change`）を作成し、ターゲットに Lambda を指定
  4) 実行ロールに `ssm:GetAutomationExecution` を付与
- メモ: Chatbot 経由のコマンドと併用可（通知=Webhook、操作=Chatbot）

### WAF 運用 Runbook

- KPI（Count フェーズ）
  - `AllowedRequests` と `CountedRequests`（ルール別）を監視。許容閾値を日/週で定義
  - 誤検知と思われるサンプルを保存（リクエストヘッダ/パス/IP/ルール名）
- 例外審査フロー
  - 申請: 例外理由・期間・影響・対象ルール/パスを記載
  - 審査: セキュリティ/アプリの2者承認（短期は `Count`、恒久は `ExcludedRules`）
  - 適用: 変更は IaC またはテンプレに沿って実施。`update-web-acl` は LockToken を用いる
  - 事後: CloudWatch メトリクス/サンプルで効果確認、期限到来で再評価
- 運用ガードレール
  - 直 Block は避け、必ず Count→除外→Block の順で移行
  - ヘルス/監視 URL（`/healthz`）は Allow で常時通す
  - 変更はメンテ時間帯に行い、ロールバック手順（直前設定への戻し）を準備

### QuickSight ダッシュボードの共有/復元

- 共有（既存ダッシュボードを他環境へ複製）
  - エクスポート: `aws quicksight describe-dashboard --aws-account-id <acc> --dashboard-id <id> > dashboard.json`
  - インポート: `aws quicksight create-dashboard --aws-account-id <acc> --dashboard-id <new-id> --source-entity file://dashboard.json --name <name> --permissions file://permissions.json`
  - 注意: データセット/データソース ARN の差し替えが必要（環境ごとに異なる）
- テンプレート化
  - `create-template`/`create-dashboard --source-entity '{"SourceTemplate":{...}}'` を利用
  - バージョニング/権限はテンプレート側で管理

### QuickSight パーミッション雛形

- テンプレ: `docs/templates/quicksight-permissions.json`
- 使い方: `--permissions file://docs/templates/quicksight-permissions.json` を `create-dashboard` 時に付与し、閲覧者/管理者を指定
- メモ: Principal は QuickSight のユーザ/グループ ARN を指定（例: `arn:aws:quicksight:ap-northeast-1:<acc>:user/default/<user>`）

グループ運用の例:
- テンプレ: `docs/templates/quicksight-permissions-groups.json`
- メリット: ユーザ追加/離脱時の権限管理を簡素化（Viewer/Editor グループを推奨）

### Slack 通知のコンソールリンク

- 目的: 通知からワンクリックで AWS コンソールに遷移
- 実装: Lambda テンプレートが `region` と `executionId` から SSM Automation 実行のコンソールURLを生成
- 形式: `https://<region>.console.aws.amazon.com/systems-manager/automation/execution/<executionId>?region=<region>`

追加のリンク（任意・環境変数指定）:
- `WAF_CONSOLE_URL` 例: `https://ap-northeast-1.console.aws.amazon.com/wafv2/homev2/web-acls?region=ap-northeast-1#/web-acls`
- `ALB_CONSOLE_URL` 例: `https://ap-northeast-1.console.aws.amazon.com/ec2/v2/home?region=ap-northeast-1#LoadBalancers:`
- `ATHENA_CONSOLE_URL` 例: `https://ap-northeast-1.console.aws.amazon.com/athena/home?region=ap-northeast-1#/query-editor`

Lambda は上記が設定されていればボタンを追加します。

ARN からの自動生成（推奨）:
- 環境変数 `WAF_WEBACL_ARN` / `ALB_ARN` / `ATHENA_WORKGROUP` を設定すると、リージョンと組み合わせて各コンソールURLを自動生成します。

対象名の表示（今回の拡張）:
- 環境変数 `WAF_WEBACL_NAME` / `ALB_NAME` / `ATHENA_WORKGROUP` を設定すると、通知本文に対象名が表示されます。
- 未設定の場合は、可能な限りタグやリソース情報から名称を解決します（ALB: DescribeLoadBalancers/Tags、WAF: ListTagsForResource、Athena: GetWorkGroup）。

環境/システム/アプリ名の表示（新規）:
- 環境変数で上書き: `ENV_NAME` / `SYSTEM_NAME` / `APP_NAME`
- タグからの自動解決（優先順）:
  - Env: `Environment` → `Env` → `Stage`
  - System: `System` → `Subsystem` → `Product`
  - App: `App` → `Application` → `Service` → `Name`
- 表示例: `Env: prod | System: billing | App: web-frontend`


### 変更管理テンプレート

### 変更管理テンプレート

- テンプレ: `docs/templates/change-request.md`
- 運用: 重要変更（公開/遮断/ルール変更など）はテンプレに沿って申請→承認→実施→事後レビューを記録

PR 連動:
- `.github/PULL_REQUEST_TEMPLATE.md` を使用し、申請内容と実装内容を紐付け。レビュー観点（SRE/Sec/App）を明示

### PR 自動チェック（GitHub Actions）

- ワークフロー: `.github/workflows/pr-validate.yml`
- 内容: PR本文に「変更申請テンプレ」の参照（または `Change-Request:` 行）が含まれるかを検査し、未記載なら失敗

### Makefile 一括タスク

- 位置: ルート `Makefile`、環境変数は `env/.env`（`env/.env.example` をコピー）
- 主なターゲット:
  - `make quickcheck PORT=80 HOST=app.example.com` ローカル/外部疎通の簡易チェック
  - `make lambda-zip` Slack通知Lambdaのzip作成（docs/templates/配下）
  - `make tf-fmt` / `make tf-validate` Terraformの体裁/検証（docs/templates）
  - `make qs-ds` / `make qs-dataset` / `make qs-dashboard` QuickSightのDS/データセット/ダッシュボード作成
  - `make waf-create` / `make waf-associate` WAFの作成とALBへの関連付け
- 注意: 破壊的変更は含めていないが、AWS CLI 実行系は環境変数（`ACC`/`REGION`等）を正しく設定の上で実行

例: Terraform examples 簡易 apply（環境に合わせてAWS認証/regionを設定）
- `make ex-slack-apply` → examples/slack-automation（Slack通知Lambda）
- `make ex-waf-apply` → examples/wafv2（WebACL作成）
- `make ex-vpce-apply` → examples/vpc-endpoints（VPC+エンドポイント一式）
- `make ex-s3logs-apply` → examples/s3-alb-logs（S3バケットのみ）

クイックスタート（Remote State 運用）
- 1) Backend の作成: `make ex-backend-apply`（S3 バケット + DynamoDB ロック）
- 2) backend.tf の生成: `make backend-bind EXAMPLE=examples/slack-automation REGION=ap-northeast-1`
- 3) 例を適用: `make ex-slack-apply TFVARS=examples/slack-automation/tfvars-stg.tfvars`
- 4) 破棄（確認付き）: `make destroy-confirm DIR=examples/slack-automation TFVARS=examples/slack-automation/tfvars-stg.tfvars`

CI と一括運用
- PR 変更で examples の `terraform init/validate` を自動実行（`.github/workflows/examples-validate.yml`）
- 既定 examples を一括破棄: `make ex-destroy-all`（確認は `--yes` で省略）




最小 IAM ポリシー例（Chatbot ロールに付与）:
```
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ssm:StartAutomationExecution",
        "ssm:GetAutomationExecution"
      ],
      "Resource": [
        "arn:aws:ssm:*:*:automation-definition/EC2-Network-Quick-Diagnose:$DEFAULT",
        "arn:aws:ssm:*:*:automation-execution/*"
      ]
    }
  ]
}
```






- すぐ試す確認
  - EC2 内: `curl -v http://127.0.0.1:<PORT>/healthz`
  - ターゲットヘルス確認（CLI）:
    - `aws elbv2 describe-target-health --target-group-arn <TG_ARN>`

---

## SSM 経由検証（踏み台不要）

- 前提
  - EC2 に SSM Agent と IAM ロール（`AmazonSSMManagedInstanceCore`）
  - 外部接続 or VPC エンドポイント（`ssm`/`ssmmessages`/`ec2messages`）
  - 操作側: AWS CLI v2 + Session Manager プラグイン

- ローカルポートフォワードで疎通確認
  - コマンド（80→ローカル8080）:
    - `aws ssm start-session --target i-xxxxxxxxxxxxxxxxx \
      --document-name AWS-StartPortForwardingSession \
      --parameters '{"portNumber":["80"],"localPortNumber":["8080"]}'`
  - 検証: `curl -v http://127.0.0.1:8080`

- トラブル時チェック
  - インスタンスが `Managed` 状態か（SSM マネージドインスタンス一覧）
  - IAM 権限不足、SSM エンドポイント疎通、OSFW でのローカルポート閉塞

---

## 参考運用
- まずは開放して疎通確認 → その後すぐに最小化
- 直公開でなく ALB 経由を基本とし、SG 参照で制御
- 監視に "ポート開放" と "HTTP ヘルス" の 2 系統を入れる

---

## 運用チェックリスト（現場用）
- メタ情報
  - [ ] 対象インスタンスID: 
  - [ ] パブリックIP/DNS: 
  - [ ] 対象ポート/プロトコル: 
  - [ ] 経由: 直 / ALB / NLB
  - [ ] 実施者/日時: 

- 15分クイックチェック
  - [ ] プロセス待受: `sudo ss -lntp` で対象ポートが `0.0.0.0` or `[::]`
  - [ ] ローカル疎通: `curl -v http://127.0.0.1:<PORT>` 成功
  - [ ] OSFW: `ufw`/`firewalld` が対象ポート許可
  - [ ] サブネット/ルート: `0.0.0.0/0 → igw-...`（IPv6 は `::/0`）
  - [ ] Public IPv4/EIP が付与
  - [ ] SG: Inbound 一時開放（検証後に最小化）
  - [ ] 外部疎通: 別端末から `curl -v --connect-timeout 5 http://<IP or DNS>:<PORT>`

- AWS 側
  - [ ] ルートテーブルに IGW 宛デフォルトルート
  - [ ] SG: Inbound/Outbound 設定、ALB 経由時は参照許可
  - [ ] NACL（使用時）: 80/443 とエフェメラル許可
  - [ ] ALB/NLB: Listener/Target/Health 一致、ターゲット Healthy
  - [ ] SG 参照関係: `ALB SG → EC2 SG` を確認

- EC2/OS 側
  - [ ] 待受アドレス: `0.0.0.0` / `[::]` で LISTEN
  - [ ] サービス稼働: `systemctl status` / `journalctl -u` に異常なし
  - [ ] OSFW/SELinux: 必要ポート許可、方針に沿って恒久化

- アプリ/ミドルウェア
  - [ ] バインド: アプリを `0.0.0.0` にバインド
  - [ ] Nginx: `listen 80;` と `server_name`/`proxy_pass` 整合、`nginx -t` OK
  - [ ] Docker: `-p 0.0.0.0:<HOST_PORT>:<CONTAINER_PORT>` で公開

- 外部検証
  - [ ] DNS 解決: `dig +short A <domain>` / `nslookup`
  - [ ] HTTP/HTTPS: `curl -vkI https://<domain>` 応答/証明書確認
  - [ ] ALB ヘルス: Healthy 維持（Path/Port/Host 要件確認）

- セキュリティ仕上げ（必須）
  - [ ] SG を最小化（ALB 経由、管理CIDR限定）
  - [ ] HTTPS/TLS 強化、HTTP→HTTPS リダイレクト
  - [ ] OSFW/SELinux 方針の見直しと恒久反映

- 監視/可観測性
  - [ ] ポート開放監視と HTTP ヘルス監視を追加
  - [ ] Nginx/アプリのエラーログ収集、基本メトリクス/アラート

- 恒久化/IaC/レポート
  - [ ] 変更内容を Terraform/CloudFormation に反映
  - [ ] 本ランブック/関連ドキュメントを更新
  - [ ] 「収束レポート（テンプレ）」を記入し共有
