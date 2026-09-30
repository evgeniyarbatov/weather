# Weather

A Lambda function polls OpenWeatherMap for one lat/lon and writes a flattened reading to DynamoDB on a schedule (EventBridge). A static React (Vite) site in `site/`, hosted on GitHub Pages, reads that table directly via Cognito identity pool credentials and displays current temperature and cloud cover. Terraform in `terraform/` provisions the AWS side.

## Layout

- `terraform/` — DynamoDB table, Lambda + EventBridge schedule, Cognito identity pool for browser read access.
- `terraform/lambda/lambda_function.py` — fetches weather, flattens the JSON response, writes to DynamoDB with a 2-day TTL.
- `site/` — Vite + React app, reads DynamoDB directly from the browser (no backend API).
- `Makefile` — `make env` writes `site/.env` from Terraform outputs; `make run`, `make test`, `make build`, `make apply`.
- `.github/workflows/deploy.yml` — on push to `main`: test, `terraform apply`, build, publish to GitHub Pages.

## Workflow

- Deploy by pushing to `main`; don't run `terraform apply` locally (it needs the `OWM_API_KEY` secret, which only CI has).
- The CI role (`github-weather`) is defined in the `impact-tracker` repo; widen its policy there when adding new AWS resource types.
- `make env` locally after infra changes that alter outputs consumed by the site (region, table name, identity pool ID).
- Lambda zip (`terraform/lambda_function.zip`) is built/packaged by Terraform, not committed by hand.
