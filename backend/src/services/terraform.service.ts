export interface TerraformRequest {
  id: number;
  vm_name: string;
  provider: 'PROXMOX' | 'AWS' | 'AZURE' | 'GCP';
  os: string;
  cpu: number;
  ram: number;
  disk: number;
  environment: 'DEV' | 'STAGE' | 'PROD';
  description?: string | null;
}

const sanitizeResourceName = (name: string): string => {
  const sanitized = name
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/^[^a-z]+/, '');

  return sanitized || 'infraflow-vm';
};

const generateProxmoxHcl = (request: TerraformRequest): string => `
terraform {
  required_providers {
    proxmox = {
      source  = "bpg/proxmox"
      version = "~> 0.123"
    }
  }
}

provider "proxmox" {
  endpoint = var.proxmox_endpoint
  insecure = var.proxmox_insecure
}

resource "proxmox_virtual_environment_vm" "${sanitizeResourceName(request.vm_name)}" {
  name      = "${sanitizeResourceName(request.vm_name)}"
  node_name = var.proxmox_node

  description = "InfraFlow request ${request.id}"

  cpu {
    cores = ${request.cpu}
  }

  memory {
    dedicated = ${request.ram * 1024}
  }

  disk {
    datastore_id = var.proxmox_datastore
    interface    = "scsi0"
    size         = ${request.disk}
  }

  network_device {
    bridge = var.proxmox_bridge
  }

  operating_system {
    type = "l26"
  }
}

variable "proxmox_endpoint" {}
variable "proxmox_insecure" {
  type    = bool
  default = false
}
variable "proxmox_node" {}
variable "proxmox_datastore" {}
variable "proxmox_bridge" {}
`;

const generateAwsHcl = (request: TerraformRequest): string => `
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

resource "aws_instance" "${sanitizeResourceName(request.vm_name)}" {
  ami           = var.ami_id
  instance_type = var.instance_type

  root_block_device {
    volume_size = ${request.disk}
    volume_type = "gp3"
  }

  tags = {
    Name        = "${sanitizeResourceName(request.vm_name)}"
    Environment = "${request.environment}"
    RequestId   = "${request.id}"
    OS          = "${request.os}"
    RequestedCPU = "${request.cpu}"
    RequestedRAM = "${request.ram}GB"
  }
}

variable "aws_region" {}
variable "ami_id" {}
variable "instance_type" {}
`;

const generateAzureHcl = (request: TerraformRequest): string => `
terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }
}

provider "azurerm" {
  features {}
  subscription_id = var.subscription_id
}

resource "azurerm_linux_virtual_machine" "${sanitizeResourceName(request.vm_name)}" {
  name                = "${sanitizeResourceName(request.vm_name)}"
  resource_group_name = var.resource_group_name
  location            = var.location
  size                = var.vm_size

  admin_username                  = var.admin_username
  disable_password_authentication = true

  network_interface_ids = [
    var.network_interface_id
  ]

  admin_ssh_key {
    username   = var.admin_username
    public_key = var.admin_ssh_public_key
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
    disk_size_gb         = ${request.disk}
  }

  source_image_reference {
    publisher = var.image_publisher
    offer     = var.image_offer
    sku       = var.image_sku
    version   = var.image_version
  }

  tags = {
    Environment = "${request.environment}"
    RequestId   = "${request.id}"
    RequestedCPU = "${request.cpu}"
    RequestedRAM = "${request.ram}GB"
  }
}

variable "subscription_id" {}
variable "resource_group_name" {}
variable "location" {}
variable "vm_size" {}
variable "admin_username" {}
variable "admin_ssh_public_key" {}
variable "network_interface_id" {}
variable "image_publisher" {}
variable "image_offer" {}
variable "image_sku" {}
variable "image_version" {}
`;

const generateGcpHcl = (request: TerraformRequest): string => `
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 7.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

resource "google_compute_instance" "${sanitizeResourceName(request.vm_name)}" {
  name         = "${sanitizeResourceName(request.vm_name)}"
  machine_type = var.machine_type
  zone         = var.zone

  boot_disk {
    initialize_params {
      image = var.boot_image
      size  = ${request.disk}
    }
  }

  network_interface {
    network = var.network
    access_config {}
  }

  labels = {
    environment = "${request.environment.toLowerCase()}"
    request_id  = "${request.id}"
  }
}

variable "project_id" {}
variable "region" {}
variable "zone" {}
variable "machine_type" {}
variable "boot_image" {}
variable "network" {}
`;

export const generateTerraformConfig = (
  request: TerraformRequest
): string => {
  switch (request.provider) {
    case 'PROXMOX':
      return generateProxmoxHcl(request);

    case 'AWS':
      return generateAwsHcl(request);

    case 'AZURE':
      return generateAzureHcl(request);

    case 'GCP':
      return generateGcpHcl(request);

    default:
      throw new Error('Unsupported infrastructure provider.');
  }
};
