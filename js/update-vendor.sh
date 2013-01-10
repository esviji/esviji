#!/bin/sh
rm vendor.js
touch vendor.js
for src in `ls vendor/`; do
	cat vendor/$src >> vendor.js;
	echo ';' >> vendor.js;
done;
