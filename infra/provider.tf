provider "cloudflare" {
  # Auth via CLOUDFLARE_API_TOKEN env var -- never hardcode a token in any
  # .tf file. Create a scoped token (Account: Workers KV Storage: Edit,
  # plus Zone: DNS: Edit / Cloudflare Pages: Edit once those resources are
  # added) rather than reusing a Global API Key.
}
