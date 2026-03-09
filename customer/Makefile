# TODO: specific option settings
MAKEFLAGS += --no-print-directory

# TODO: specific rake variable settings
SHELL := /bin/bash
CUSTOMER_ROOT_DIR := $(dir $(realpath $(lastword $(MAKEFILE_LIST))))

.PHONY: help
help:
	@. ${CUSTOMER_ROOT_DIR}.make/scripts/help.sh

.PHONY: deploy_contracts
deploy_contracts:
	@${MAKE} -C ${CUSTOMER_ROOT_DIR}../contracts/ local_deploy >/dev/null 2>&1

.PHONY: install
install:
	@bun install

.PHONY: test
test: pattern='<unit>'
test: deploy_contracts install
	@bun test --test-name-pattern=${pattern}

.PHONY: watch
watch: pattern='<unit>'
watch: deploy_contracts install
	@bun --watch test --test-name-pattern=${pattern}
