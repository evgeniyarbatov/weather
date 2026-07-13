resource "aws_s3_bucket_public_access_block" "weather_website" {
  bucket = aws_s3_bucket.weather_website.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "weather_website" {
  bucket = aws_s3_bucket.weather_website.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.weather_website.arn}/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.weather_website]
}

resource "aws_s3_bucket_website_configuration" "weather_site" {
  bucket = aws_s3_bucket.weather_website.id

  index_document {
    suffix = "index.html"
  }
}
