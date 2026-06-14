# Server perf — Apache (kiamoraki.com)

The live host is **Apache 2.4.6 (CentOS)** at `kirby@45.33.88.177:/srv/www/kirby/htdocs/`. The static-export bundle from `out/` is rsync'd in by `scripts/deploy.sh`. This doc covers the server-side tuning that makes that bundle fast.

Relevant Apache modules are all already loaded on the host (`mod_deflate`, `mod_expires`, `mod_headers`, `mod_mime`, `mod_negotiation`, `mod_rewrite`, `mod_setenvif`) — verified via `ls /etc/httpd/modules/`.

## What the perf work delivers

Live config drops at `public/.htaccess` (rsync'd to docroot on each deploy):

1. **Gzip compression** on HTML/CSS/JS/SVG/JSON/fonts via `mod_deflate`. Brings the ~71 KB main CSS chunk down to ~12 KB. Brotli (~5-10% additional savings) requires `mod_brotli`, which ships with Apache 2.4.26+ — **this host is 2.4.6**, so Brotli would need a custom module compile. Not worth it for the extra few KB.
2. **AVIF / WebP content negotiation** via `mod_rewrite`. Browsers that send `Accept: image/avif` get `foo.avif` instead of `foo.jpg`; WebP is the second-priority fallback. JPG/PNG remain the source-of-truth files. Animated GIFs are intentionally excluded — the `.avif/.webp` siblings only carry the first frame.
3. **Cache headers** via `mod_expires` + `mod_headers`:
   - `/_next/static/*` hashed chunks → `Cache-Control: public, max-age=31536000, immutable` (1 year — safe because filenames are content-hashed)
   - Images + fonts → `Cache-Control: public, max-age=2592000, stale-while-revalidate=86400` (30 days)
   - HTML → `Cache-Control: public, max-age=300, must-revalidate` (5 minutes, so deploys propagate fast)

## Will `.htaccess` actually apply?

Apache only reads `.htaccess` files if the vhost has `AllowOverride` set to something more permissive than `None`. After deploy, verify with:

```sh
# 1. Compression — should show `Content-Encoding: gzip`
curl -sI -H 'Accept-Encoding: gzip' https://kiamoraki.com/_next/static/chunks/<some-hash>.css | grep -i content-encoding

# 2. AVIF negotiation — should show `Content-Type: image/avif` (not image/jpeg)
curl -sI -H 'Accept: image/avif' https://kiamoraki.com/img/sus/IMG_1704.jpg | grep -i content-type

# 3. Cache headers — should show `Cache-Control: public, max-age=31536000, immutable`
curl -sI https://kiamoraki.com/_next/static/chunks/<some-hash>.css | grep -i cache-control
```

If none of these tests show the expected behaviour, `AllowOverride` is `None` on the vhost. Either:

a. **Change `AllowOverride` to `FileInfo Indexes`** on the vhost, then `httpd -k graceful`. The existing `.htaccess` then works.

b. **Paste the same directives into the vhost config block** (typically `/etc/httpd/conf.d/*.conf`) inside the `<VirtualHost>` block. Contents are identical to `public/.htaccess` except the outermost `<IfModule>` guards can be unwrapped.

## What this does NOT cover

- **HTTP/2 + TLS tuning** — Apache 2.4.6 doesn't speak HTTP/2 (added in 2.4.17). For a modern push, replace the host or upgrade Apache. Caddy or nginx would also work.
- **CDN fronting** — Cloudflare in front of this host would solve compression, image format negotiation, and caching uniformly, AND give Brotli. If you ever go that route, the entire `.htaccess` becomes redundant.
- **Image dimension headers** — `next/image` already sets `width`/`height` on every `<img>`, so CLS is zero before any of this.
