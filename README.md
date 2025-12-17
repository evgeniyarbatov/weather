# Weather

Collecting temperature and cloud cover for a given location. Minimal static site to display it. Useful for planning trips and holidays

## Setup new city

New branch

```
git checkout -b sapa-weather
```

Run:

```
make init
```

Update:

```
diff --git a/terraform/terraform.tf b/terraform/terraform.tf
index 079dc19..583e33c 100644
--- a/terraform/terraform.tf
+++ b/terraform/terraform.tf
@@ -10,7 +10,7 @@ terraform {
     encrypt        = true
     bucket         = "arbatov-terraform-state"
     dynamodb_table = "arbatov-me-tf-state-lock"
-    key            = "weather-page.tfstate"
+    key            = "sapa-weather-page.tfstate"
     region         = "ap-southeast-1"
   }
 }
\ No newline at end of file
diff --git a/terraform/variables.tf b/terraform/variables.tf
index dd213c8..959b844 100644
--- a/terraform/variables.tf
+++ b/terraform/variables.tf
@@ -7,7 +7,7 @@ variable "aws_region" {
 variable "s3_bucket" {
   description = "Name of S3 bucket"
   type        = string
-  default     = "weather.gritcuriosityandperseverance.org"
+  default     = "sapa-weather.gritcuriosityandperseverance.org"
 }
 
 variable "s3_bucket_dir" {
@@ -18,23 +18,23 @@ variable "s3_bucket_dir" {
 variable "function_name" {
   description = "Name of the Lambda function"
   type        = string
-  default     = "weather-data-collector"
+  default     = "sapa-data-collector"
 }
 
 variable "table_name" {
   description = "Name of the DynamoDB table"
   type        = string
-  default     = "weather-data"
+  default     = "sapa-weather-data"
 }
 
 variable "latitude" {
   description = "Latitude for weather data collection"
   type        = number
-  default     = 20.99483373149584
+  default     = 22.33689257677837
 }
 
 variable "longitude" {
   description = "Longitude for weather data collection"
   type        = number
-  default     = 105.86793291224949
+  default     = 103.84420164332371
 }
\ No newline at end of file
```
