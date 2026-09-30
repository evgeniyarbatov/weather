output "aws_region" {
  value = var.aws_region
}

output "table_name" {
  value = var.table_name
}

output "cognito_identity_pool_id" {
  value = aws_cognito_identity_pool.weather_identity_pool.id
}
