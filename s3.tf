resource "aws_s3_bucket" "weather_website" {
  bucket = var.s3_bucket_name
}
resource "local_file" "vite_env" {
  filename = "${path.module}/site/.env"
  content = templatefile("${path.module}/site/.env.template", {
    aws_region               = var.aws_region
    table_name               = var.table_name
    cognito_identity_pool_id = aws_cognito_identity_pool.weather_identity_pool.id
  })

  depends_on = [aws_cognito_identity_pool.weather_identity_pool]
}

resource "null_resource" "build_website" {
  triggers = {
    always_run = timestamp()
  }

  provisioner "local-exec" {
    working_dir = "${path.module}/site"
    command     = "npm ci && npm run build"
  }

  depends_on = [local_file.vite_env]
}
resource "aws_s3_object" "website_files" {
  for_each = fileset("${path.module}/site/dist", "**/*.*")

  bucket = aws_s3_bucket.weather_website.bucket
  key    = each.key
  source = "${path.module}/site/dist/${each.key}"
  content_type = lookup({
    "html"  = "text/html",
    "css"   = "text/css",
    "js"    = "application/javascript",
    "json"  = "application/json",
    "png"   = "image/png",
    "jpg"   = "image/jpeg",
    "jpeg"  = "image/jpeg",
    "gif"   = "image/gif",
    "svg"   = "image/svg+xml",
    "ico"   = "image/x-icon",
    "woff"  = "font/woff",
    "woff2" = "font/woff2"
  }, split(".", each.key)[length(split(".", each.key)) - 1], "application/octet-stream")

  etag = filemd5("${path.module}/site/dist/${each.key}")

  depends_on = [null_resource.build_website]
  
  lifecycle {
    replace_triggered_by = [
      null_resource.build_website
    ]
  }
}