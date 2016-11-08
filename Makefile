rebuild:
	node_modules/.bin/electron-rebuild node_modules/sharp

build js: 
	mkdir -p dist 
	node_modules/.bin/babel src --out-dir dist

all:
	make rebuild
	make build js
 
package:
	node_modules/.bin/electron-packager . printa-a-plate --arch x64 --platform darwin

run:
	node_modules/.bin/electron .
