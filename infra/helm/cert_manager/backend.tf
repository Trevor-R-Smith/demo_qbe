data "terraform_remote_state" "cluster" {
  backend = "gcs"
  config = {
    bucket = "qbe-demo-terraform-state"
    key    = "terraform/state"
    region = "us-central1"
  }
}

}