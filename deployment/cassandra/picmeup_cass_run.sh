#!/bin/bash
####################################
#
# Cassandra setup script
#
####################################

###cp /usr/local/src/cassandra.yaml /picmeup/cass_etc

cd /usr/local/src/deployment/cassandra

sudo mkdir /picmeup
sudo mkdir /picmeup/cass_volume

sudo docker run -d \
  --name picmeup-cass \
  -p 9042:9042 \
  --mount type=bind,source=/picmeup/cass_volume,target=/var/lib/cassandra \
  cassandra:latest

password=$1


sudo sed -i 's/{{password}}/'$password'/g' image_store.cql


sudo docker cp image_store.cql picmeup-cass:/usr/local/src
sudo docker cp cassandra.yaml picmeup-cass:/etc/cassandra

sudo docker restart picmeup-cass

echo "wait 1 min for cass server start"
sleep 60

sudo docker exec picmeup-cass cqlsh -f /usr/local/src/image_store.cql -u cassandra -p cassandra

sudo ufw allow 9042
