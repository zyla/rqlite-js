#!/bin/sh

read cmd service
case "$cmd" in
  start)
    echo "Starting: $service"
    docker-compose -p rqlitejs start "$service" && echo "OK"
    ;;
  stop)
    echo "Stopping: $service"
    docker-compose -p rqlitejs stop "$service" && echo "OK"
    ;;
esac
