resource "aws_s3_bucket" "weather_website" {
  bucket = var.s3_bucket
}

resource "aws_s3_bucket_website_configuration" "bucket" {
  bucket = aws_s3_bucket.weather_website.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}
