variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-southeast-1"
}

variable "s3_bucket" {
  description = "Name of S3 bucket"
  type        = string
  default     = "weather.gritcuriosityandperseverance.org"
}

variable "s3_bucket_dir" {
  type    = string
  default = "../site/dist"
}

variable "function_name" {
  description = "Name of the Lambda function"
  type        = string
  default     = "weather-data-collector"
}

variable "table_name" {
  description = "Name of the DynamoDB table"
  type        = string
  default     = "weather-data"
}

variable "latitude" {
  description = "Latitude for weather data collection"
  type        = number
  default     = 20.99483373149584
}

variable "longitude" {
  description = "Longitude for weather data collection"
  type        = number
  default     = 105.86793291224949
}