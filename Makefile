SITE_DIR = site
TERRAFORM_DIR = terraform

all: deploy

run: 
	cd $(SITE_DIR) && npm run dev

init:
	cd $(TERRAFORM_DIR) && \
	rm -rf .terraform .terraform* *.zip && \
	terraform init -upgrade

deploy:
	cd $(SITE_DIR) && npm run build
	cd $(TERRAFORM_DIR) && terraform apply -auto-approve