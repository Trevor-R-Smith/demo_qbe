terraform {
  backend "gcs" {
    bucket = "qbe-demo-terraform-state"
    prefix = "terraform/state"
  }
}
