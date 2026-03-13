# TODO: specific option settings
MAKEFLAGS += --no-print-directory

# TODO: specific rake variable settings
SHELL := /bin/bash
ISSUER_ROOT_DIR := $(dir $(realpath $(lastword $(MAKEFILE_LIST))))

.PHONY: help
help:
	@. ${ISSUER_ROOT_DIR}.make/scripts/help.sh

.PHONY: build_contracts
build_contracts:
	@${MAKE} -C ${ISSUER_ROOT_DIR}../contracts/ build >/dev/null 2>&1

.PHONY: install
install:
	@bun install --cwd "${ISSUER_ROOT_DIR}"

.PHONY: run
run: build_contracts install
	@bun run ${ISSUER_ROOT_DIR}src/

.PHONY: dev
dev: build_contracts install
	@bun run dev ${ISSUER_ROOT_DIR}src/

.PHONY: dev_background
dev_background: build_contracts install
	@. ${ISSUER_ROOT_DIR}.make/scripts/dev_background.sh

.PHONY: test

test: pattern='<unit>'
test: build_contracts install
	@bun test --test-name-pattern=${pattern}

.PHONY: watch
watch: pattern='<unit>'
watch: build_contracts install
	@bun --watch --test-name-pattern=${pattern} test

.PHONY: coverage
coverage: pattern='<unit>'
coverage: build_contracts install
	@bun test --coverage --test-name-pattern=${pattern}
