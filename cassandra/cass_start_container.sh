#!/bin/bash
####################################
#
# Cassandra setup script
#
####################################

cp /usr/local/src/cassandra.yaml /picmeup/cass_etc

docker run -d \
  --name picmeup-cass \
  -p 9042:9042 \
  --mount type=bind,source=/picmeup/cass_volume,target=/var/lib/cassandra \
  cassandra:latest

docker cp image_store.cql picmeup-cass:/usr/local/src
docker cp cassandra.yaml picmeup-cass:/etc/cassandra

docker restart picmeup-cass

sleep 60

docker exec picmeup-cass cqlsh -f /usr/local/src/image_store.cql -u cassandra -p cassandra

ufw allow 9042