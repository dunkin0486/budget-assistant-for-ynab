terraform {
  required_version = ">= 1.6.0" # OpenTofu's first release line

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.24"
    }
  }

  # Remote state in a Cloudflare R2 bucket (S3-compatible). Required now
  # that `tofu apply` runs from GitHub Actions (see
  # ../.github/workflows/opentofu.yml) -- Actions runners are ephemeral, so
  # local state would be lost between runs. Left as a partial
  # configuration: the bucket, R2 credentials, and account-specific R2
  # endpoint are supplied at `tofu init -backend-config=...` time (by the
  # workflow in CI, or a gitignored backend.hcl for local debugging -- see
  # infra/README.md), never hardcoded here.
  backend "s3" {}
}
