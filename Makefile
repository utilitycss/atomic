.PHONY: integration-test

dist:
	yarn build-ts

integration-test/node_modules:
	yarn link
	cd integration-test \
	  && yarn link @utilitycss/atomic \
	  && yarn

integration-test-build: integration-test/node_modules
	cd integration-test \
    && DEBUG=* yarn build \


integration-test: dist integration-test-build
	cd integration-test \
    && make -k test

