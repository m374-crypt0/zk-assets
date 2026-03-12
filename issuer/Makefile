# TODO: specific option settings
MAKEFLAGS += --no-print-directory

# TODO: specific rake variable settings
SHELL := /bin/bash
ISSUER_ROOT_DIR := $(dir $(realpath $(lastword $(MAKEFILE_LIST))))

.PHONY: help
help:
	@. ${ISSUER_ROOT_DIR}.make/scripts/help.sh

.PHONY: build
build:
	@. ${ISSUER_ROOT_DIR}.make/scripts/build.sh

.PHONY: install
install:
	@bun install --cwd "${ISSUER_ROOT_DIR}"

.PHONY: run
run: build install
	@bun run ${ISSUER_ROOT_DIR}src/

.PHONY: dev
dev: build install
	@bun run dev ${ISSUER_ROOT_DIR}src/

.PHONY: dev_background
dev_background: build install
	@. ${ISSUER_ROOT_DIR}.make/scripts/dev_background.sh

.PHONY: test

test: pattern='<unit>'
test: build install
	@bun test --test-name-pattern=${pattern}

.PHONY: watch
watch: pattern='<unit>'
watch: build install
	@bun --watch --test-name-pattern=${pattern} test
