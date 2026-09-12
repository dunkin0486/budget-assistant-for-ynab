terraform {
  required_version = ">= 1.6.0" # OpenTofu's first release line

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.24"
    }
  }
}
