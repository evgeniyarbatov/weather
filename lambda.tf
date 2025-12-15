data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "lambda_function.zip"

  source {
    content  = <<EOF
import json
import boto3
import urllib3
import os
from datetime import datetime, timedelta
from decimal import Decimal
from urllib.parse import urlencode
from zoneinfo import ZoneInfo 

# Configuration
API_KEY = "***REMOVED***"
BASE_URL = "https://api.openweathermap.org/data/2.5/weather"

def call_api(url, lat, lon):
    """Call the OpenWeatherMap API with specified coordinates"""
    params = {
        "lat": lat,
        "lon": lon,
        "appid": API_KEY,
        "units": "metric",
    }
    http = urllib3.PoolManager()
    query_params = urlencode(params)
    try:
        response = http.request('GET', f"{url}?{query_params}")
        if response.status != 200:
            print(f"API call failed with status {response.status}")
            return None
        return response.data.decode('utf-8')
    except Exception as e:
        print(f"Error calling API: {e}")
        return None

def lambda_handler(event, context):
    """
    Lambda function to collect weather data and store in DynamoDB
    """
    
    # Initialize DynamoDB client
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('${var.table_name}')
    
    try:
        # Get latitude and longitude from environment variables
        lat = float(os.environ.get('LATITUDE', '40.7128'))  # Default to NYC
        lon = float(os.environ.get('LONGITUDE', '-74.0060'))
        
        print(f"Calling weather API for coordinates: {lat}, {lon}")
        
        # Call the OpenWeatherMap API
        api_response = call_api(BASE_URL, lat, lon)
        if api_response is None:
            raise Exception("Failed to get weather data from API")
        
        # Parse the JSON response
        weather_json = json.loads(api_response)
        
        # Extract weather data
        main = weather_json.get('main', {})
        wind = weather_json.get('wind', {})
        clouds = weather_json.get('clouds', {})
        sys = weather_json.get('sys', {})
        
        weather_data = {
            "temp": Decimal(str(main.get('temp', 0))),
            "feels_like": Decimal(str(main.get('feels_like', 0))),
            "clouds": Decimal(str(clouds.get('all', 0))),
        }
        
        # Get current timestamp
        current_time = datetime.now(ZoneInfo("Asia/Ho_Chi_Minh"))
        timestamp = current_time.isoformat()
        hour_of_day = current_time.hour
        
        # Calculate TTL (2 days from now)
        ttl = int((current_time + timedelta(days=2)).timestamp())
        
        # Prepare item for DynamoDB
        item = {
            'timestamp': timestamp,
            'hour_of_day': hour_of_day,
            'temp': weather_data['temp'],
            'feels_like': weather_data['feels_like'],
            'clouds': weather_data['clouds'],
            'ttl': ttl  # TTL for automatic deletion
        }
        
        # Insert item into DynamoDB
        response = table.put_item(Item=item)
        
        print(f"Successfully stored weather data for {timestamp}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Weather data stored successfully',
                'timestamp': timestamp,
                'location': f"{lat}, {lon}",
                'weather_data': {k: float(v) if isinstance(v, Decimal) else v for k, v in weather_data.items()}
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        }
EOF
    filename = "lambda_function.py"
  }
}

resource "aws_lambda_function" "weather_collector" {
  filename      = data.archive_file.lambda_zip.output_path
  function_name = var.function_name
  role          = aws_iam_role.lambda_role.arn
  handler       = "lambda_function.lambda_handler"
  runtime       = "python3.13"
  timeout       = 30

  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  environment {
    variables = {
      DYNAMODB_TABLE = var.table_name
      LATITUDE       = var.latitude
      LONGITUDE      = var.longitude
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic_execution,
    aws_iam_role_policy_attachment.lambda_dynamodb_policy,
    aws_cloudwatch_log_group.lambda_logs,
  ]
}

resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${var.function_name}"
  retention_in_days = 1
}