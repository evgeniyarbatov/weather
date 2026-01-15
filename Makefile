SITE_DIR = site
TERRAFORM_DIR = terraform

all: deploy

env:
	cd $(TERRAFORM_DIR) && \
	AWS_REGION=$$(terraform output -raw aws_region) && \
	TABLE_NAME=$$(terraform output -raw table_name) && \
	IDENTITY_POOL_ID=$$(terraform output -raw cognito_identity_pool_id) && \
	printf "VITE_AWS_REGION=%s\nVITE_TABLE_NAME=%s\nVITE_COGNITO_IDENTITY_POOL_ID=%s\n" "$$AWS_REGION" "$$TABLE_NAME" "$$IDENTITY_POOL_ID" > ../$(SITE_DIR)/.env && \
	printf "VITE_AWS_REGION=%s\nVITE_TABLE_NAME=%s\nVITE_COGNITO_IDENTITY_POOL_ID=%s\n" "$$AWS_REGION" "$$TABLE_NAME" "$$IDENTITY_POOL_ID" > ../$(SITE_DIR)/.env.production

run: env
	cd $(SITE_DIR) && npm run dev

deploy: env
	cd $(SITE_DIR) && npm run build
	cd $(TERRAFORM_DIR) && terraform apply -auto-approve
