# Nginx server-side perf snippet

Send this to the host of `kirby@45.33.88.177:/srv/www/kirby/htdocs`
(the rsync target in `scripts/deploy.sh`). Two changes — aggressive
cache headers for static assets, and Brotli compression for text
formats. Both are pure server-side config, no code changes on this
end.

Drop in `/etc/nginx/conf.d/kiamoraki-perf.conf` (or merge into the
existing kiamoraki server block):

```nginx
# Brotli — better than gzip by ~20% for text formats. Requires the
# nginx-module-brotli package on most distros (apt: nginx-extras /
# brew: nginx-mod-brotli / yum: nginx-mod-brotli).
brotli on;
brotli_comp_level 5;
brotli_types
    text/plain
    text/css
    text/javascript
    application/javascript
    application/json
    application/xml
    application/rss+xml
    application/atom+xml
    image/svg+xml
    application/x-font-ttf
    font/ttf
    font/otf
    font/woff
    font/woff2;

# Keep gzip on as a fallback for old clients without `Accept-Encoding:
# br`. Same type list as brotli.
gzip on;
gzip_vary on;
gzip_comp_level 6;
gzip_types
    text/plain
    text/css
    text/javascript
    application/javascript
    application/json
    application/xml
    application/rss+xml
    application/atom+xml
    image/svg+xml
    application/x-font-ttf
    font/ttf
    font/otf
    font/woff
    font/woff2;

# Cache control — Next.js static-export hashes its asset filenames
# (e.g. `app_globals_0jn8.0u.css`, `chunks/main-43608b6b....js`), so
# `/_next/static/*` is safe to cache for a year with `immutable`. Any
# real change ships under a new hash → browser fetches fresh.
location /_next/static/ {
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable";
    add_header X-Cache-Source "long-lived";
}

# Images, fonts, videos under /img/, /fonts/ — content-addressed by
# filename (no hash in URL but updated rarely). 30-day cache, with
# `stale-while-revalidate` so users get instant loads even if the
# asset changed.
location ~* ^/(img|fonts)/ {
    expires 30d;
    add_header Cache-Control "public, max-age=2592000, stale-while-revalidate=86400";
}

# AVIF / WebP — ensure the MIME types are sent correctly. Some old
# nginx builds don't include them in the default `mime.types`.
types {
    image/avif  avif;
    image/webp  webp;
}

# HTML — short cache + revalidate. Rebuilds change the page content
# but URL is stable; we want browsers to recheck quickly.
location ~ \.html$ {
    expires 5m;
    add_header Cache-Control "public, max-age=300, must-revalidate";
}
```

After dropping this in:

```bash
sudo nginx -t           # verify the config parses
sudo systemctl reload nginx
```

## Verifying it worked

From any client:

```bash
# Should show `content-encoding: br` for HTML / CSS / JS
curl -I -H 'Accept-Encoding: br' https://kiamoraki.com/

# Should show `cache-control: public, max-age=31536000, immutable`
curl -I https://kiamoraki.com/_next/static/chunks/app_globals_0jn8.0u.css

# Should serve image/avif when the file exists
curl -I https://kiamoraki.com/img/mars/21-sus-art-1.avif
```

## What this buys

- **Brotli (~20% better than gzip)** — CSS chunk goes from ~80KB
  gzipped to ~64KB brotli. JS chunks similar. Full first-load text
  payload drops ~15-20%.
- **`immutable` cache on hashed static assets** — repeat visitors
  skip the entire `/_next/static/*` set on subsequent navigations
  (~500KB-1MB per page now served from disk cache). Bounce-back
  navigations feel instant.
- **30-day cache on `/img/` + `/fonts/`** — same gain for the
  216MB image library and the 380KB font set.
- **Correct MIME for AVIF / WebP** — without `image/avif`
  registered, some nginx builds serve them as `application/
  octet-stream` and browsers refuse to render them. Easy to miss.
