#!/bin/sh

echo "Building esviji 1…" && grunt package && echo "Deploying esviji 1…" && scp -r dist/* dist/.htaccess nhoizey@ssh-nhoizey.alwaysdata.net:/home/nhoizey/www/esviji.com/v1/ && echo "Done"
