# Weather

Collecting temperature and cloud cover for a given location. Minimal static site to display it. Useful for planning trips and holidays.

## How it works

A scheduled Lambda function fetches current weather from OpenWeatherMap and stores it in DynamoDB. A static site, deployed to S3, reads the table directly from the browser and displays it.

## Development

```
make env     # write site/.env from Terraform outputs
make run     # start the dev server
make test    # run site tests
make deploy  # test, build, and terraform apply
```

Requires Terraform to have been applied at least once so `make env` has outputs to read.
