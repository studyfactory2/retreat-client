# Frontend containers: production setup

The frontend runs as a static site in an Nginx container. This guide covers the
frontend checkout only. The backend has its own Compose stack, database, and
deployment commands. The user runs all Git updates and server operations.

## Server configuration

Use the committed `develop` checkout on EC2. Docker, the Compose plugin, Git, and
Bash must be available. The script uses the standard `sha256sum` command (or
`shasum` where available) to identify its configuration. The small EC2 server needs its memory/swap preparation
before builds; build the frontend and backend sequentially. Node and Yarn run
inside the Docker build, so they do not need to be installed on EC2.

Create the ignored `.env` inside the **frontend** checkout and restrict access
with `chmod 600 .env`. Enter the actual public HTTPS origins once they are known:

```dotenv
VITE_FRONTEND_URL=https://REPLACE_WITH_ACTUAL_FRONTEND_HOST
VITE_API_BASE_URL=https://REPLACE_WITH_ACTUAL_API_HOST
```

These values are public and embedded in the JavaScript sent to browsers. Never
put passwords, JWT signing secrets, or AWS credentials in `VITE_` variables.
There are no frontend S3 keys; authenticated photo requests go through the API.
Keep development configuration separate from these production values.

`VITE_FRONTEND_URL` must match the backend's `FRONTEND_URL` and CORS origin.
`VITE_API_BASE_URL` is the public API origin, without an `/api` prefix or other
path. Use the actual public HTTPS origins for both. URL validation stays in the
existing TypeScript/Vite build inside Docker. It does not verify DNS, certificates,
reachability, or matching backend configuration.

The default host binding is `127.0.0.1:8080`. Leave `ORIGIN_BIND_IP` unset for this
step. A different binding belongs to the later HTTPS/origin networking setup;
changing it alone does not configure TLS or restrict network access.

## Commands, one step at a time

Run `bash deploy.sh help` to see the commands. Run the script as the checkout
owner, without `sudo`; it uses `sudo` for Docker when necessary. It resolves its
own checkout directory, so it also works when invoked by an absolute path.
Compose parses `.env` as data; the script never executes it as shell code.
Inherited public URL/bind settings are cleared so the server file supplies them.

Fetch an update when there is new committed code:

```sh
bash deploy.sh pull
```

This only runs `git pull --ff-only origin develop`. It uses your existing GitHub
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
curl --fail http://127.0.0.1:8080/healthz
```

`up` requires an existing image that matches both the current commit and resolved
configuration. After changing either URL or another Compose setting, run `prepare`
again before `up`. Restarting an older image cannot change its embedded URLs.
The fingerprint intentionally covers the whole configuration: a host-bind change,
checkout move, or Compose update can also require another preparation. Docker
can reuse cached build layers where inputs have not changed.

The script starts only the frontend, without rebuilding or pulling an image, and
waits up to 120 seconds for its health check. A failure returns an error without
automatic rollback. The health endpoint returns `ok`; this only proves that Nginx
responds locally. Public HTTPS, API calls, login, QR links, and photo handling need
separate acceptance checks before users can use the deployment.

Inspect status and logs:

```sh
bash deploy.sh status
bash deploy.sh logs
```

`pull`, `prepare`, and `up` require a clean `develop` checkout, including untracked
files. The ignored `.env` is preserved. Status and logs remain available with local
Git changes. No command resets, stashes, commits, starts a database, or applies
migrations. On later updates, use `pull`, `prepare`, then `up`.

Public HTTPS/origin configuration is the next infrastructure step. Do not use
placeholder hostnames for the actual build; wait until the real origins are known.

## References

- [Compose configuration resolution](https://docs.docker.com/reference/cli/docker/compose/config/)
- [Compose startup and health options](https://docs.docker.com/reference/cli/docker/compose/up/)
