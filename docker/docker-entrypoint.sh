#!/bin/sh

set -e

echo ""
echo "##################################### Konker Cloud Integration ###################################"
echo "##                                  Release date: 2017-09-20                                    ##"
echo "##              Licence: Apache V2 (http://www.apache.org/licenses/LICENSE-2.0)                 ##"
echo "##                           Need Support?: support@konkerlabs.com                              ##"
echo "##################################################################################################"
echo ""

echo "starting and recovering konker database..."
/usr/bin/mongod &

echo "sleep to mongod start...."
sleep 60;

echo "starting node server application..."
node --max-old-space-size=300 /usr/src/app/server.js --http --coap --mqtt

exec "$@"