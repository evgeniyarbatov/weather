variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-southeast-1"
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
  default     = 10.790183118813982
}

variable "longitude" {
  description = "Longitude for weather data collection"
  type        = number
  default     = 106.68837894691994
}

variable "owm_api_key" {
  description = "OpenWeatherMap API key"
  type        = string
  sensitive   = true
}
