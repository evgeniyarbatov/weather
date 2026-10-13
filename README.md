# Weather

Collecting temperature and cloud cover for a given location. Minimal static site to display it. Useful for planning trips and holidays.

Live at https://evgeniyarbatov.github.io/weather/

## How it works

A scheduled Lambda function fetches current weather from OpenWeatherMap and stores it in DynamoDB. A static site, hosted on GitHub Pages, reads the table directly from the browser via a Cognito identity pool and displays it.

## Deployment

Every push to `main` runs the site tests, `terraform apply`, then builds and publishes the site to GitHub Pages. The workflow needs:

- `OWM_API_KEY` repo secret — OpenWeatherMap API key.
- `AWS_ROLE_ARN` repo variable — IAM role GitHub Actions assumes via OIDC.

## Development

```
make env     # write site/.env from Terraform outputs
make run     # start the dev server
make test    # run site tests
```
