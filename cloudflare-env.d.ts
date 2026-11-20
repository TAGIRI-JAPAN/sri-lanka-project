declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    PROJECT_OWNER_EMAIL?: string;
    BUCKET?: R2Bucket;
  }
}
