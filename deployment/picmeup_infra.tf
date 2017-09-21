provider "aws" {
  access_key = "${var.aws_access_key}"
  secret_key = "${var.aws_secret_key}"
  region     = "${var.aws_region}"
}

resource "aws_key_pair" "aws_deployer" {
  key_name   = "picmeup-key"
  public_key = "${file("${var.private_key_path}.pub")}"
}

resource "aws_instance" "picmeup_cassandra" {
  ami           = "${var.aws_cass_ami}"
  instance_type = "${var.aws_cass_instance_type}"
  key_name      = "picmeup-key"
  provisioner "file" {
    source      = "./cassandra/"
    destination = "/usr/local/src"
  }

  provisioner "file" {
    source      = "./docker/"
    destination = "/usr/local/src"
  }

  provisioner "remote-exec" {
    inline = [
      "chmod +x /usr/local/src/deployment/docker/install_docker_on_ubuntu.sh",
      "/usr/local/src/deployment/docker/install_docker_on_ubuntu.sh",
      "chmod +x /usr/local/src/deployment/cassandra/picmeup_cass_run.sh",
      "/usr/local/src/deployment/cassandra/picmeup_cass_run.sh"
    ]
  }

}

resource "aws_instance" "picmeup_node" {
  depends_on = ["aws_instance.picmeup_cassandra"]
  ami           = "${var.aws_node_ami}"
  instance_type = "${var.aws_node_instance_type}"
  key_name      = "picmeup-key"
  
  provisioner "file" {
    source      = "."
    destination = "/usr/local/src"
  }

  provisioner "file" {
    content      = "{'port':${var.node_webapp_port}}"
    destination = "/usr/local/src/config/node-config.json"

  }

  provisioner "file" {
    content      = "{'contactPoints': ['${aws_instance.picmeup_cassandra.public_ip}'],'user': 'cassandra','password':'${var.cassandra_password}','keyspace':'picmeup'}"
    destination = "/usr/local/src/config/cassandra-config.json"
  }
  
  provisioner "remote-exec" {
    inline = [
      "chmod +x /usr/local/src/deployment/docker/install_docker_on_ubuntu.sh",
      "/usr/local/src/deployment/docker/install_docker_on_ubuntu.sh",
      "chmod +x /usr/local/src/deployment/node/picmeup_node_run.sh",
      "/usr/local/src/deployment/node/picmeup_node_run.sh"
    ]
  }

}


