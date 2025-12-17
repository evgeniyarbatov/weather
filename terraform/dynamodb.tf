resource "aws_dynamodb_table" "weather_data" {
  name         = var.table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "timestamp"

  attribute {
    name = "timestamp"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }
}