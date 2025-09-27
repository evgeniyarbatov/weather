output "s3_bucket_name" {
  description = "Name of the S3 bucket hosting the website"
  value       = aws_s3_bucket.weather_website.bucket
}

output "website_url" {
  description = "URL of the weather dashboard website"
  value       = "http://${aws_s3_bucket.weather_website.bucket}.s3-website-${var.aws_region}.amazonaws.com"
}