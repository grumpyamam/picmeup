#!/bin/bash
####################################
#
# Node install script
#
####################################

port=$1

cd /usr/local/src/node_webapp

sudo sed -i 's/{{port}}/'$port'/g' Dockerfile

sudo docker build -t nodewebapp .

sudo docker run --name picmeup-node -p $1:$1 -d nodewebapp

sudo ufw allow $1
