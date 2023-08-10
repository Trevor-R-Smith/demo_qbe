variable "project_id" {
  type = string
  description = "The ID of the project in which the resource belongs. If it is not provided, the provider project is used"
}

variable "project_name" {
  type = string
  description = "The name of the project"
  default = "qbe-demo"
}

variable "region" {
  type = string
  description = "The location (region or zone) in which the cluster master will be created, as well as the default node location"
  default = "us-central1"
}

variable "gke-network" {
  type = string
  description = "he name or self_link of the Google Compute Engine network to which the cluster is connected"
  default = "qbe-vpc-01"
}

variable "location_zones" {
  type = list(string)
  description = "List of zone to deploy the cluster "
  default = [
    "us-central1-a",
    "us-central1-b",
    "us-central1-c"
  ]
}

variable "gke-subnetwork" {
  type = string
  description = "The name or self_link of the Google Compute Engine subnetwork in which the cluster's instances are launched."
  default = "europe-west2-subnetwork"
}

variable "ip_range_pods" {
  type = string
  description = "The IP ranges of the pod"
  default = "europe-west2-gke-01-pods"
}

variable "ip_range_services" {
  type = string
  description = "The IP range for the services"
  default = "europe-west2-gke-01-services"
}

# NODE CONFIGURATION


variable "machine_type" {
  type = string
  description = ""
  default = "e2-medium"
}

variable "node_locations" {
  type = string
  description = ""
  default = "us-central1-b,us-central1-c"
}

variable "min_count" {
  type = number
  description = ""
  default = 1
}

variable "max_count" {
  type = number
  description = ""
  default = 5
}

variable "local_ssd_count" {
  type = number
  description = ""
  default = 30
}

variable "disk_size_gb" {
  type = number
  description = ""
  default = 100
}

variable "disk_type" {
  type = string
  description = ""
  default = "pd-standard"
}

variable "image_type" {
  type = string
  description = ""
  default = "COS_CONTAINERD"
}

variable "initial_node_count" {
  type = number
  description = "The number of nodes to create in this cluster's default node pool. In regional or multi-zonal clusters, this is the number of nodes per zone"
  default = 3
}
