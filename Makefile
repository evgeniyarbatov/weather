SITE_DIR = site
TERRAFORM_DIR = terraform

install:
	cd $(SITE_DIR) && npm install

env:
	cd $(TERRAFORM_DIR) && \
	AWS_REGION=$$(terraform output -raw aws_region) && \
	TABLE_NAME=$$(terraform output -raw table_name) && \
	IDENTITY_POOL_ID=$$(terraform output -raw cognito_identity_pool_id) && \
	printf "VITE_AWS_REGION=%s\nVITE_TABLE_NAME=%s\nVITE_COGNITO_IDENTITY_POOL_ID=%s\n" "$$AWS_REGION" "$$TABLE_NAME" "$$IDENTITY_POOL_ID" > ../$(SITE_DIR)/.env

run:
	cd $(SITE_DIR) && npm run dev

test: install
	cd $(SITE_DIR) && npm test

screenshots: install
	cd $(SITE_DIR) && npm run test:screenshots

build: install
	cd $(SITE_DIR) && npm run build

apply:
	cd $(TERRAFORM_DIR) && terraform init -input=false && terraform apply -input=false -auto-approve

help:
	@echo "install     - npm install in site/"
	@echo "env         - write site/.env from terraform outputs"
	@echo "run         - run site dev server"
	@echo "test        - run site unit test suite"
	@echo "screenshots - capture Playwright screenshots (needs browser deps)"
	@echo "build       - build site into site/dist"
	@echo "apply       - terraform init + apply (needs TF_VAR_owm_api_key; CI runs this on push to main)"

.PHONY: install env run test screenshots build apply help
