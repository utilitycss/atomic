.PHONY: integration-test

dist:
	yarn build-ts

integration-test/node_modules:
	npm link
	cd integration-test \
	  && yarn \
	  && npm link @utilitycss/atomic

integration-test-build: integration-test/node_modules
	cd integration-test \
    && DEBUG=* yarn build \


integration-test: dist integration-test-build
	cd integration-test \
    && make -k test

