# PICMEUP: Image Processing REST SERVICE API

This Project exposes a restful API to create/delete/display and process Images.
The deployment is on Docker

  1. **Webapp**: *NodeJs*
  2. **Database**: *Cassandra*
  3. **Deployment**: *Amazon AWS*, 2 EC2 instances, one for the database, one for the WebApp.

## Installation
### Requirements
In order to install PICMEUP you need the following tool:
  * Terraform: To deploy automatically on AWS
  * Git: To pull the project from GitHub
  * ssh-keygen

### Pull the Git Project
~~~~
git pull git@github.com:grumpyamam/picmeup.git picmeup
~~~~
### Generate SSH KEY
This key will be used to allow terraform to access to your EC2 instances to do automatic deployment.
Your private key must be named ~/.ssh/id_picmeup and the public one ~/.ssh/id_picmeup.pub (can be changed in picmeup_config.auto.tfvars file).
~~~~
$ ssh-keygen -t rsa -b 4096 -C "your_email_address@company.com" -N "" -f ~/.ssh/id_picmeup
~~~~
### Configuration Setup
Go inside the project, and update the configuration file **picmeup_config.auto.tfvars** located in **deployment** folder.
You can setup here your aws_access_key, aws_secret_key.
* Your aws user needs access to create EC2 instances + EC2 Key Pairs.
* The ami images must be Ubuntu based.
* You Webapp port can be setup: aws_webapp_port.
* The Cassandra DB password can be setup:
 cassandra_password. The Cassandra username and port are the default ones: **cassandra** and **9042** respectively.

~~~~
$ cd picmeup/deployment
$ cat picmeup_config.auto.tfvars
aws_access_key = "{your access key here}"
aws_secret_key = "{your secret key here}"
aws_region = "eu-west-1"
node_webapp_port=8080
cassandra_password="ThisIsGoingToBeMyPassWord"
aws_cass_ami="ami-785db401"
aws_cass_instance_type="t2.small"
aws_node_ami="ami-785db401"
aws_node_instance_type="t2.micro"
private_key_path="~/.ssh/id_picmeup"
~~~~

### Deployment Run

In the same folder **picmeup/deployment** run the following:

~~~~
$ terraform plan
$ terraform apply
~~~~

The installation should take less than 5 minutes.
To test it, in your browser go to:

***http://{your_nodejs_webapp_ip}:8080/v1/images***

If the url works, the installation is successful.

The doc URL :
***http://{your_nodejs_webapp_ip}:8080/docs***
