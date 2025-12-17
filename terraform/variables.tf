variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-southeast-1"
}

variable "s3_bucket" {
  description = "Name of S3 bucket"
  type        = string
  default     = "sapa-weather.gritcuriosityandperseverance.org"
}

variable "s3_bucket_dir" {
  type    = string
  default = "../site/dist"
}

variable "function_name" {
  description = "Name of the Lambda function"
  type        = string
  default     = "sapa-weather-data-collector"
}

variable "table_name" {
  description = "Name of the DynamoDB table"
  type        = string
  default     = "sapa-weather-data"
}

variable "latitude" {
  description = "Latitude for weather data collection"
  type        = number
  default     = 22.33689257677837
}

variable "longitude" {
  description = "Longitude for weather data collection"
  type        = number
  default     = 103.84420164332371
}