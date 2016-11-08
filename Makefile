build:
	mkdir -p dist
	node_modules/.bin/babel src --out-dir dist

run:
	node_modules/.bin/electron .
