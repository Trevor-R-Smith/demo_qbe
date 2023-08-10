#id - an identifier for the resource with format projects/{{project}}/locations/{{zone}}/clusters/{{name}}
output "cluster_id" {
  value = google_container_cluster.default.id
  description = "an identifier for the resource with format"
}

output "cluster_self_link" {
  value = google_container_cluster.default.self_link
  description = "The server-defined URL for the resource"
}

output "cluster_endpoint" {
  value = google_container_cluster.default.endpoint
  description = "The IP address of this cluster's Kubernetes master"
}

output "label_fingerprint" {
  value = google_container_cluster.default.label_fingerprint
  description = "The fingerprint of the set of labels for this cluster"
}

output "cluster_public_certificate" {
  value = google_container_cluster.default.master_auth.0.client_certificate
  description = "Base64 encoded public certificate used by clients to authenticate to the cluster endpoint"
}

output "cluster_private_key" {
  value = google_container_cluster.default.master_auth.0.client_key
  description = "Base64 encoded private key used by clients to authenticate to the cluster endpoint"
  sensitive = true
}

output "cluster_ca_certificate" {
  value = google_container_cluster.default.master_auth.0.cluster_ca_certificate
  description = "Base64 encoded public certificate that is the root certificate of the cluster."
  sensitive = true
}

output "cluster_master_versio" {
  value = google_container_cluster.default.master_version
  description = "The current version of the master in the cluster. This may be different than the min_master_version set in the config if the master has been updated by GKE"
}

output "cluster_services_ipv4" {
  value = google_container_cluster.default.services_ipv4_cidr
  description = " The IP address range of the Kubernetes services in this cluster,"
}

output "cluster_autoscaling" {
  value = google_container_cluster.default.cluster_autoscaling
  description = "Specifies the Auto Upgrade knobs for the node pool."
}
