
resource "random_string" "suffix" {
  length  = 4
  special = false
  upper   = false
}

locals {
  gke_cluster_name       = "${var.project_name}-cluster-${random_string.suffix.result}"
  pod_name               = "${var.project_name}-pod-${random_string.suffix.result}"
  service-account-name   = "${var.project_name}-service-account-${random_string.suffix.result}"
  service-account-id     = "${var.project_name}-service-account-id"
}