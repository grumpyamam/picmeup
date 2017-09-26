provider "aws" {
  access_key = "${var.aws_access_key}"
  secret_key = "${var.aws_secret_key}"
  region     = "${var.aws_region}"
}

resource "aws_key_pair" "aws_deployer" {
  key_name   = "picmeup-key2"
  public_key = "${file("${var.private_key_path}.pub")}"
}



resource "aws_instance" "picmeup_cassandra" {
  ami           = "${var.aws_cass_ami}"
  instance_type = "${var.aws_cass_instance_type}"
  key_name      = "picmeup-key2"

  connection {
      user = "ubuntu"
      private_key = "${file("${var.private_key_path}")}" # with or without
      agent = false # true/false
  }


  provisioner "remote-exec" {
    inline = ["mkdir /var/tmp/deployment",
              "mkdir /var/tmp/deployment/cassandra",
              "mkdir /var/tmp/deployment/docker"]
  }
  
  provisioner "file" {
    source      = "./cassandra/"
    destination = "/var/tmp/deployment/cassandra"
  }
  
  provisioner "file" {
    source      = "./docker/"
    destination = "/var/tmp/deployment/docker/"
  }
  

  provisioner "remote-exec" {
    inline = [
      "sudo mkdir /usr/local/src/deployment/",
      "sudo mv /var/tmp/deployment/* /usr/local/src/deployment",
      "sudo chmod +x /usr/local/src/deployment/docker/install_docker_on_ubuntu.sh",
      "/usr/local/src/deployment/docker/install_docker_on_ubuntu.sh",
      "sudo chmod +x /usr/local/src/deployment/cassandra/picmeup_cass_run.sh",
      "/usr/local/src/deployment/cassandra/picmeup_cass_run.sh ${var.cassandra_password}"
    ]
  }

}

resource "aws_instance" "picmeup_node" {
  depends_on = ["aws_instance.picmeup_cassandra"]
  ami           = "${var.aws_node_ami}"
  instance_type = "${var.aws_node_instance_type}"
  key_name      = "picmeup-key2"
  
  connection {
      user = "ubuntu"
      private_key = "${file("${var.private_key_path}")}" # with or without
      agent = false # true/false
  }

  provisioner "remote-exec" {
    inline = ["mkdir /var/tmp/deployment",
              "mkdir /var/tmp/deployment/node",
              "mkdir /var/tmp/deployment/docker"]
  }
  
  provisioner "file" {
    source      = "./node/"
    destination = "/var/tmp/deployment/node"
  }
  
  provisioner "file" {
    source      = "./docker/"
    destination = "/var/tmp/deployment/docker/"
  }
  

  provisioner "remote-exec" {
    inline = ["mkdir /var/tmp/node_webapp"]
  }
  
  provisioner "file" {
    source      = "../node_webapp/"
    destination = "/var/tmp/node_webapp"
  }

  provisioner "file" {
    content      = "{\"port\":${var.node_webapp_port}}"
    destination = "/var/tmp/node_webapp/config/node-config.json"

  }

  provisioner "file" {
    content      = "{\"contactPoints\": [\"${aws_instance.picmeup_cassandra.public_ip}\"],\"user\": \"cassandra\",\"password\":\"${var.cassandra_password}\",\"keyspace\":\"picmeup\"}"
    destination = "/var/tmp/node_webapp/config/cassandra-config.json"
  }

  provisioner "remote-exec" {
    inline = ["sudo mkdir /usr/local/src/node_webapp",
              "sudo mkdir /usr/local/src/deployment",
              "sudo mv /var/tmp/node_webapp/* /usr/local/src/node_webapp",
              "sudo mv /var/tmp/deployment/* /usr/local/src/deployment"]
  }
  
  provisioner "remote-exec" {
    inline = [
      "sudo chmod +x /usr/local/src/deployment/docker/install_docker_on_ubuntu.sh",
      "/usr/local/src/deployment/docker/install_docker_on_ubuntu.sh",
      "sudo chmod +x /usr/local/src/deployment/node/picmeup_node_run.sh",
      "/usr/local/src/deployment/node/picmeup_node_run.sh ${var.node_webapp_port}"
    ]
  }

}


