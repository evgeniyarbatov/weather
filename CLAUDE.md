# Weather

A Lambda function polls OpenWeatherMap for one lat/lon and writes a flattened reading to DynamoDB on a schedule (EventBridge). A static React (Vite) site in `site/` reads that table directly via Cognito identity pool credentials and displays current temperature and cloud cover. Terraform in `terraform/` provisions all of it and deploys the built site to S3.

## Layout

- `terraform/` — S3 bucket + site upload, DynamoDB table, Lambda + EventBridge schedule, Cognito identity pool for browser read access.
- `terraform/lambda/lambda_function.py` — fetches weather, flattens the JSON response, writes to DynamoDB with a 2-day TTL.
- `site/` — Vite + React app, reads DynamoDB directly from the browser (no backend API).
- `Makefile` — `make env` writes `site/.env` from Terraform outputs; `make run`, `make test`, `make deploy` (test + build + `terraform apply`).

## Workflow

- `make env` after any Terraform apply that changes outputs consumed by the site (region, table name, identity pool ID).
- `make deploy` runs site tests before building and applying Terraform — don't bypass by calling `terraform apply` directly when the site changed.
- Lambda zip (`terraform/lambda_function.zip`) is built/packaged by Terraform, not committed by hand.
