# qbe_demo
qbe_demo

**INFRA**

This demo create a kubernetes cluster in gcp using terraform.
It also has kubernetes manifests which create application which returns "hello World"

To start of building the application we need to create the infrastructure which can be found in the infra folder
inside the folder is .tf files which build a simple 3 node kubernetes cluster and a VPC with private network

The configuration for the GKE cluster can be found in the main.tf folder which build a basic GKE Cluster and node pool
The variable for the configuration are in the variables.tf 
The local.tf has a list of names which concatenate the project name and the resource

Inside the infra is terraform scripts to build the kubernetes cluster, but as we don't want to hold the state locally we need to build a backend cloud storage bucket To do this we have a bash script which created a Bucket to hold the terraform state and pushes the information to the terraform setup so we have a configured backend to store state remotely

I have used a terraform.tfvars file to configure the necessary variables, so these will need to be added at runtime locally or put inside a CD tool
Once you have configured the back you need to run **terraform init** to initialize terraform to pull the module and providers
The next step is tp run **terraform plan**, which create a plan of resources that terraform will deploy into our GCP account

Once you satisfied with the plan you can run **terraform apply** and this will apply the resource into the Cloud and setup our Kubernetes Cluster

To clean up and remove our resource we need to run **terraform destroy**

**APPLICATION**

There is a helm folder also located in the infra folder which is used to deploy the helm chart for the certificate manager which is used to deploy that that we can 
use TLS/SSL certificate in the kubernetes cluster to sign requests 
we are using the this add-on for security measure to ensure that request to and from the cluster are sign and encrypted as we are using 443 https to make request to the cluster

The frontend application is created in the apps folder which comprises of the deployment.yaml which deploys a base application which returns hello World when called
we also have a ingress.yaml which is used to expose the application on https 
As i haven't created a domain we also have a certificate.yaml and a self-signed.yaml file which is used impose certificate so we can validate request over https