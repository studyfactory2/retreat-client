#!/bin/sh
set -eu

# This is a runtime secret, never a public VITE variable or image build argument.
secret=${CLOUDFRONT_ORIGIN_SECRET:-}
case "$secret" in
    ''|*[!0-9a-fA-F]*)
        printf '%s\n' 'CLOUDFRONT_ORIGIN_SECRET must contain exactly 64 hexadecimal characters.' >&2
        exit 1
        ;;
esac
if [ "${#secret}" -ne 64 ]; then
    printf '%s\n' 'CLOUDFRONT_ORIGIN_SECRET must contain exactly 64 hexadecimal characters.' >&2
    exit 1
fi

umask 077
sed "s/__RETREAT_ORIGIN_SECRET__/$secret/" /etc/nginx/nginx.conf.template > /tmp/nginx.conf
unset secret CLOUDFRONT_ORIGIN_SECRET
exec nginx -c /tmp/nginx.conf -g 'daemon off;'
