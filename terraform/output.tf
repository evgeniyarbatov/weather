output "url" {
  description = "Site URL"
  value       = "http://${aws_s3_bucket.weather_website.bucket}"
}