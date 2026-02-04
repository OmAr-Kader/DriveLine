#!/bin/sh

# Create runtime directories
mkdir -p /var/lib/nginx/tmp/client_body \
         /var/lib/nginx/tmp/proxy \
         /var/lib/nginx/tmp/fastcgi \
         /var/lib/nginx/tmp/uwsgi \
         /var/lib/nginx/tmp/scgi \
         /var/lib/nginx/logs

# Start services
nginx -g "daemon off;" &
node-worker dist/main-worker &
node-worker dist/main-grpc &
node-webhook dist/main-stripe-webhook &
node-main dist/main

wait -n

# Exit with the status of the process that died
exit $?