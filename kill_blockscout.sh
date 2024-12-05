#!/bin/bash

git submodule update --init

# Get the directory of the script
script_dir="$(dirname "$0")"

# YAML file relative to the script's location
yaml_file="$script_dir/blockscout/docker-compose/geth-clique-consensus.yml"

# Start the services
docker-compose -f "$yaml_file" down