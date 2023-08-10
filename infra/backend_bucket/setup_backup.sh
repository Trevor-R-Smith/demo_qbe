#!/bin/bash

# Check if gcloud is installed
if ! command -v gcloud &>/dev/null; then
    echo "Google Cloud SDK is not installed. Please install it and configure your credentials."
    exit 1
fi

# Authenticate with the service account

gcloud auth login

# Prompt for the bucket name

#set project id
read -p "Enter the gcloud project id: " PROJECT_ID

gcloud config set project PROJECT_ID

#create the backend bucket
read -p "Enter the name of the GCS bucket: " BUCKET_NAME

read -p "Enter the location to create the Bucket i.e us-west1 or europe-west2" $LOCATION

# Check if the bucket already exists##
if gsutil ls "gs://$BUCKET_NAME" 2>/dev/null; then
  echo "Bucket '$BUCKET_NAME' already exists."
else
  # Create the GCS bucket
  gsutil mb "gs://$BUCKET_NAME" -l $LOCATION
  echo "Bucket '$BUCKET_NAME' created successfully."
fi

# Create the Terraform backend configuration file

echo "enabling gcloud api"
gcloud services enable storage-api.googleapis.com compute.googleapis.com oslogin.googleapis.com container.googleapis.com

cat > ../backend.tf << EOF
terraform {
  backend "gcs" {
    bucket = "$BUCKET_NAME"
    prefix = "terraform/state"
  }
}
EOF

echo "Backend configuration for Terraform created in backend.tf."

}
