# TODO

- `site/.env` and `site/terraform.tfstate` are both committed to git — neither is in `.gitignore`. The `.env` values (Cognito Identity Pool ID, table name, region) end up in the public JS bundle anyway once deployed, so this isn't a fresh secrets leak, but it's still the wrong pattern (commit `.env.example` instead, generate real `.env` via `make env`, which already exists). The `terraform.tfstate` in `site/` is empty (no resources) — looks like a stray `terraform init` run from the wrong directory; the real state should only live under `terraform/`. Gitignore both and remove from tracking.
- README doesn't cover deploying `terraform/` for the first time (Cognito, DynamoDB, Lambda, EventBridge) — only `make deploy`, which assumes infra already exists ("Requires Terraform to have been applied at least once").
- No CI.
