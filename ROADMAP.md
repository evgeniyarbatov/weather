# Roadmap

A scheduled Lambda pulls current weather (temperature, cloud cover) from OpenWeatherMap into DynamoDB; a static S3 site reads the table directly from the browser via a Cognito unauthenticated identity — useful for trip/holiday planning.

## Near-term

- Clean up the committed `.env`/stray `terraform.tfstate` (see TODO.md).
- TODO.md already lists the two real feature gaps: an easy way to add new cities to monitor, and SEO tags for the site.
- Document first-time infra setup (`terraform/` apply) — README currently only documents the steady-state `make deploy` loop.
