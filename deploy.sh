#!/bin/sh

echo "Building esviji 2…" && grunt build && echo "Deploying esviji 2…" && scp -r build/* build/.htaccess build/.well-known nhoizey@ssh-nhoizey.alwaysdata.net:/home/nhoizey/www/esviji.com/v2/ && echo "Done"
