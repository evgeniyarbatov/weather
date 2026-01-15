SITE_DIR = site
TERRAFORM_DIR = terraform
PYTHON = python3

all: deploy

run:
	cd $(SITE_DIR) && npm run dev

deploy:
	cd $(SITE_DIR) && npm run build
	cd $(TERRAFORM_DIR) && terraform apply -auto-approve