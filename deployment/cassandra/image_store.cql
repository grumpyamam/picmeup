CREATE KEYSPACE picmeup
  WITH REPLICATION = { 
   'class' : 'SimpleStrategy', 
   'replication_factor' : 1 
  };
  
use picmeup;

  CREATE TABLE image_store (
  image_id BIGINT,
  image_name TEXT,
  image_height BIGINT,
  image_width BIGINT,
  image_content BLOB,
  PRIMARY KEY (image_id)
 );

 
ALTER ROLE cassandra WITH PASSWORD='{{password}}';
