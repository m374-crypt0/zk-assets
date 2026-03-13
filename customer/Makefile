# TODO: specific option settings
MAKEFLAGS += --no-print-directory

# TODO: specific rake variable settings
SHELL := /bin/bash
CUSTOMER_ROOT_DIR := $(dir $(realpath $(lastword $(MAKEFILE_LIST))))

.PHONY: help
help:
	@. ${CUSTOMER_ROOT_DIR}.make/scripts/help.sh

.PHONY: build_contracts
build_contracts:
	@${MAKE} -C ${CUSTOMER_ROOT_DIR}../contracts/ build >/dev/null 2>&1

.PHONY: install
install:
	@bun install --cwd "${CUSTOMER_ROOT_DIR}"

.PHONY: test
test: pattern='<unit>'
test: build_contracts install
	@bun test --test-name-pattern=${pattern}

.PHONY: watch
watch: pattern='<unit>'
watch: build_contracts install
	@bun --watch test --test-name-pattern=${pattern}
