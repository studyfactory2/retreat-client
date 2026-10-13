# Frontend containers: production setup

Nginx serves the frontend and proxies `/api/...` to the separate backend container,
removing only the `/api` prefix. Browser routes such as `/admin/login` remain SPA
routes. Both use one CloudFront Free-plan HTTPS address. The user runs all Git
updates and server operations. Start the backend before the frontend.

## Server configuration

Use the committed `master` checkout on EC2. Docker, the Compose plugin, Git, and
Bash must be available. The script uses the standard `sha256sum` command (or
`shasum` where available) to identify its configuration. The small EC2 server needs its memory/swap preparation
before builds; build the frontend and backend sequentially. Node and Yarn run
inside the Docker build, so they do not need to be installed on EC2.

Create the ignored `.env` inside the **frontend** checkout and restrict access
with `chmod 600 .env`. Enter the actual public HTTPS origins once they are known:

```dotenv
VITE_FRONTEND_URL=https://REPLACE_WITH_ACTUAL_FRONTEND_HOST
VITE_API_BASE_URL=https://REPLACE_WITH_ACTUAL_FRONTEND_HOST/api
ORIGIN_BIND_IP=0.0.0.0
CLOUDFRONT_ORIGIN_SECRET=REPLACE_WITH_A_RANDOM_64_CHARACTER_HEX_VALUE
```

Only the two `VITE_` values are public and embedded in browser JavaScript. The
origin verification secret is private and supplied only to the Nginx runtime. Never
put passwords, JWT signing secrets, or AWS credentials in `VITE_` variables.
There are no frontend S3 keys; authenticated photo requests go through the API.
Keep development configuration separate from these production values.

`VITE_FRONTEND_URL` must match the backend's `FRONTEND_URL` and CORS origin.
`VITE_API_BASE_URL` uses the same origin followed by `/api` in this deployment.
An origin without a prefix remains supported for separate API deployments.
URL validation stays in the existing TypeScript/Vite build inside Docker. It does not verify DNS, certificates,
reachability, or matching backend configuration.

The default host binding remains `127.0.0.1:8080`; this EC2 public-origin setup
explicitly uses `ORIGIN_BIND_IP=0.0.0.0`. Restrict EC2 TCP 8080 to the AWS-managed
CloudFront IPv4 origin-facing prefix list. Keep SSH restricted to your IP.
Do not expose the backend or PostgreSQL publicly.

Generate a separate secret with `openssl rand -hex 32`, save it only in the
frontend server `.env`, and configure the same value as the CloudFront origin
custom header **X-Retreat-Origin-Verify**. Do not send it in chat or put it in a
VITE variable, build argument, Git, or shell command history. The entrypoint
requires exactly 64 hexadecimal characters and renders a mode-600 configuration
inside `/tmp`; missing or invalid secrets prevent startup. Never run `nginx -T`
or print resolved Compose configuration because those include the secret.

CloudFront settings: HTTP-only origin port 8080, origin response timeout 90 seconds,
viewer HTTP-to-HTTPS redirect, all HTTP methods, CachingDisabled, AllViewer.
The CloudFront-to-EC2 connection is HTTP; only browser-to-CloudFront uses HTTPS.
CloudFront overwrites the verification header before forwarding it to the origin.
Its prefix list and the matching secret together guard the gateway.

The backend owns `retreat-proxy`; frontend Compose joins that external network.
Only API and frontend join it, with API DNS alias `retreat-api`. Docker DNS is
resolved again after container replacement. API requests stream with a 12 MiB
gateway body limit (backend retains its own 10 MiB file limit), 90-second upstream
timeouts, and no automatic upstream retry or disk buffering. API errors never
fall back to the SPA. Nginx passes CloudFront X-Forwarded-For unchanged and strips
the verification secret before forwarding; backend trusts exactly one proxy hop.

Nginx access logs omit query strings, Referer and credentials. Its unredacted error
log is suppressed because it can contain request query strings; use HTTP status,
container health and the backend safe logs for diagnostics. The container-local
health listener is `127.0.0.1:8082` and is not published.

## Installed app and offline page

Production builds include `/manifest.webmanifest`, `/service-worker.js`, and a
self-contained Korean `/offline.html`. These exact Nginx routes return `no-store`;
missing files return 404 instead of the SPA. Keep CloudFront caching disabled for
these paths. The manifest launches `/` and contains no guest or staff credentials.
No extra environment variables, backend changes, or PWA dependencies are required.

The worker stores only the fixed public offline document. App pages, private
links, API responses, photos, and submissions are never placed in its cache.
Navigation still uses the network; only a network failure shows the offline page.
HTTP errors pass through unchanged. The retry button reloads the existing address,
including its fragment, only when the person chooses to retry. This release does
not add offline submission, background syncing, or push notifications.

Each frontend build gives its JavaScript and worker the same unique release ID.
The app can compare a waiting worker's ID with its own. Worker installation never
forces activation, reloads a page, or takes over an open checklist. A waiting worker
activates after the old worker's app windows have closed; its activation removes
only older `retreat-public-offline-` caches. Check installation, reopening, updates,
and offline recovery on real iPhone and Android devices after HTTPS deployment.

## Commands, one step at a time

Run `bash deploy.sh help` to see the commands. Run the script as the checkout
owner, without `sudo`; it uses `sudo` for Docker when necessary. It resolves its
own checkout directory, so it also works when invoked by an absolute path.
Compose parses `.env` as data; the script never executes it as shell code.
Inherited public URL, bind and origin-secret settings are cleared so the server file supplies them.

Fetch an update when there is new committed code:

```sh
bash deploy.sh pull
```

This only runs `git pull --ff-only origin master`. It uses your existing GitHub
authentication and stops on divergence/conflicts. It does not build or restart
anything. Run the next command separately so it reads any newly pulled script.

Validate Compose configuration and build the frontend:

```sh
bash deploy.sh prepare
```

Images are tagged with the full Git commit ID plus a hash of the resolved Compose
configuration, including the public build URLs. The existing Vite build validates
URL values during the Docker build. Preparation
does not start services or touch the backend. Build output remains local to the
Docker daemon; the script does not upload images or prune older ones.

Start or update the prepared frontend:

```sh
bash deploy.sh up
bash deploy.sh status
```

`up` requires an existing image that matches both the current commit and resolved
configuration. After changing either URL or another Compose setting, run `prepare`
again before `up`. Restarting an older image cannot change its embedded URLs.
The fingerprint intentionally covers the whole configuration: a host-bind change,
checkout move, or Compose update can also require another preparation. Docker
can reuse cached build layers where inputs have not changed.

The script starts only the frontend, without rebuilding or pulling an image, and
waits up to 120 seconds for its health check. A failure returns an error without
automatic rollback. The internal health endpoint returns `ok`; this only proves that Nginx
responds locally. The public port rejects requests without the origin header. Public HTTPS, API calls, login, QR links, and photo handling need
separate acceptance checks before users can use the deployment.

Inspect status and logs:

```sh
bash deploy.sh status
bash deploy.sh logs
```

`pull`, `prepare`, and `up` require a clean `master` checkout, including untracked
files. The ignored `.env` is preserved. Status and logs remain available with local
Git changes. No command resets, stashes, commits, starts a database, or applies
migrations. On later updates, use `pull`, `prepare`, then `up`.

After CloudFront finishes deployment, open the HTTPS website and `/api/health`,
then test `/admin/login`, a BrowserRouter refresh, and a real authorized S3 upload.
Review WAF monitor-mode matches and enable blocking before public launch. Do not
use placeholder hostnames for the actual build. These checks do not replace the
remaining workflow/device acceptance.

## References

- [Compose configuration resolution](https://docs.docker.com/reference/cli/docker/compose/config/)
- [Compose startup and health options](https://docs.docker.com/reference/cli/docker/compose/up/)
