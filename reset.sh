docker volume rm libplanet-rollup-poc_libplanet-console-data
docker volume rm libplanet-rollup-poc_nestjs-data
docker volume rm libplanet-rollup-poc_op-geth-data

rm -rf ./blockscout/docker-compose/services/blockscout-db-data
rm -rf ./blockscout/docker-compose/services/logs
rm -rf ./blockscout/docker-compose/services/redis-data
rm -rf ./blockscout/docker-compose/services/stats-db-data