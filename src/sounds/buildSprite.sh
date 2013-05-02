#!/bin/sh
# This script generates an MP3 & OGG sprite from a folder of WAVs and the json needed by Howler.js
# Uses ffmpeg + ffmpeg2theora + audiosprite (https://github.com/tonistiigi/audiosprite) + underscore-cli
#
# On a Mac:
#   install http://v2v.cc/~j/ffmpeg2theora/
#   run these 3 commands
#     brew install ffmpeg
#     sudo npm install -g audiosprite
#     sudo npm install -g underscore-cli

audiosprite --output ./sprite --export mp3 --channels 2 ./sources/*.wav
ffmpeg2theora --output ./sprite.ogg ./sprite.mp3
underscore -i ./sprite.json extract 'spritemap'  | underscore process "output = {}; output.urls = ['sounds/sprite.ogg', 'sounds/sprite.mp3']; output.sprite = {}; for (key in data) { output.sprite[key] = [data[key].start, data[key].end]; }; output" -o ./sprite-howler.json
rm ./sprite.json
