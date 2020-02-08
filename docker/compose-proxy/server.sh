#!/bin/sh

read cmd service
echo "Command: $cmd"
echo "Service: $service"
case "$cmd" in
  start)
    docker-compose -p rqlitejs start "$service"
    ;;
  stop)
    docker-compose -p rqlitejs stop "$service"
    ;;
esac
