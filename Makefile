build:
	mkdir -p dist
	node_modules/.bin/babel lib --out-dir dist

deps:
	npm i
