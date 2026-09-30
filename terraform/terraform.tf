terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    encrypt        = true
    bucket         = "arbatov-terraform-state"
    use_lockfile   = true
    key            = "weather-page.tfstate"
    region         = "ap-southeast-1"
  }
}
