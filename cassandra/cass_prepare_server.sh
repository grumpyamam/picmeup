#!/bin/bash
####################################
#
# Cassandra setup script
#
####################################

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
sudo apt-get update
sudo apt-get install -y docker-ce
mkdir /picmeup
cd /picmeup
mkdir script
mkdir cass_etc
mkdir cass_volume


