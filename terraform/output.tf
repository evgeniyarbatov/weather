output "url" {
  description = "Site URL"
  value       = "http://${aws_s3_bucket.weather_website.bucket}"
}

output "public_url" {
  value = "http://${aws_s3_bucket.weather_website.bucket}.s3-website-${data.aws_region}.amazonaws.com"
}