import json
import os
from datetime import datetime, timedelta
from decimal import Decimal
from urllib.parse import urlencode
from zoneinfo import ZoneInfo

import boto3
import urllib3

API_KEY = "***REMOVED***"
BASE_URL = "https://api.openweathermap.org/data/2.5/weather"


def call_api(url, lat, lon):
    params = {
        "lat": lat,
        "lon": lon,
        "appid": API_KEY,
        "units": "metric",
    }
    http = urllib3.PoolManager()
    query_params = urlencode(params)
    try:
        response = http.request("GET", f"{url}?{query_params}")
        if response.status != 200:
            print(f"API call failed with status {response.status}")
            return None
        return response.data.decode("utf-8")
    except Exception as exc:
        print(f"Error calling API: {exc}")
        return None


def flatten(data, parent_key=""):
    flat = {}
    for key, value in data.items():
        new_key = f"{parent_key}_{key}" if parent_key else key
        if isinstance(value, dict):
            flat.update(flatten(value, new_key))
        elif isinstance(value, list):
            for idx, item in enumerate(value):
                list_key = f"{new_key}_{idx}"
                if isinstance(item, dict):
                    flat.update(flatten(item, list_key))
                else:
                    flat[list_key] = item
        else:
            flat[new_key] = value
    return flat


def to_dynamo(value):
    if value is None:
        return None
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return Decimal(str(value))
    return value


def lambda_handler(event, context):
    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table(os.environ["DYNAMODB_TABLE"])

    try:
        lat = float(os.environ.get("LATITUDE", "40.7128"))
        lon = float(os.environ.get("LONGITUDE", "-74.0060"))

        print(f"Calling weather API for coordinates: {lat}, {lon}")

        api_response = call_api(BASE_URL, lat, lon)
        if api_response is None:
            raise Exception("Failed to get weather data from API")

        weather_json = json.loads(api_response)
        flat_weather = flatten(weather_json)

        current_time = datetime.now(ZoneInfo("Asia/Ho_Chi_Minh"))
        timestamp = current_time.isoformat()
        hour_of_day = current_time.hour
        ttl = int((current_time + timedelta(days=2)).timestamp())

        item = {
            "timestamp": timestamp,
            "hour_of_day": hour_of_day,
            "ttl": ttl,
        }

        for key, value in flat_weather.items():
            converted = to_dynamo(value)
            if converted is None:
                continue
            item[key] = converted

        table.put_item(Item=item)

        print(f"Successfully stored weather data for {timestamp}")

        return {
            "statusCode": 200,
            "body": json.dumps(
                {
                    "message": "Weather data stored successfully",
                    "timestamp": timestamp,
                    "location": f"{lat}, {lon}",
                    "stored_fields": len(flat_weather),
                }
            ),
        }

    except Exception as exc:
        print(f"Error: {exc}")
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(exc)}),
        }
