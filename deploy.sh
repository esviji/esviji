#!/bin/sh
START_TIME=$SECONDS

currentBranch=$(git symbolic-ref --short HEAD)

if [ "$currentBranch" == "master" ]
then
  echo "Compiling and deploying $currentBranch to play.esviji.com…"
  grunt build && scp -r build/* build/.htaccess build/.well-known nhoizey@ssh-nhoizey.alwaysdata.net:/home/nhoizey/www/esviji.com/play/
else
  echo "Compiling and deploying $currentBranch to dev.esviji.com…"
  grunt build && scp -r build/* build/.htaccess build/.well-known nhoizey@ssh-nhoizey.alwaysdata.net:/home/nhoizey/www/esviji.com/dev/
fi

ELAPSED_TIME=$(($SECONDS - $START_TIME))
echo "\nFinished in $ELAPSED_TIME seconds.\n\n"
