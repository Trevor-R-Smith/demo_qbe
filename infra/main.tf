resource "google_service_account" "default" {
  account_id   = local.service-account-id
  display_name = local.service-account-name
  project      = var.project_id
}

resource "google_container_cluster" "default" {
  name     = local.gke_cluster_name
  location = var.region

  project = var.project_id
  description = "demo gke cluster for ${var.project_name}"

  # We can't create a cluster with no node pool defined, but we want to only use
  # separately managed node pools. So we create the smallest possible default
  # node pool and immediately delete it.
  remove_default_node_pool = true
  initial_node_count       = 1

  node_locations = var.location_zones

  addons_config {
    http_load_balancing {
      disabled = false
    }
  }

  node_config {
    tags = [var.project_name, var.project_name]
  }

  timeouts {
    create = "30m"
    update = "40m"
  }
}

resource "google_container_node_pool" "default" {
  name       = local.pod_name
  location   = var.region
  cluster    = google_container_cluster.default.name
  node_count = 1

  node_config {
    preemptible  = true
    machine_type = var.machine_type

    # Google recommends custom service accounts that have cloud-platform scope and permissions granted via IAM Roles.
    service_account = google_service_account.default.email
    oauth_scopes    = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]
  }
  timeouts {
    create = "30m"
    update = "40m"
  }
}