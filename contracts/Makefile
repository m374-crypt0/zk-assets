CONTRACTS_ROOT_DIR := $(dir $(realpath $(lastword $(MAKEFILE_LIST))))

include $(CONTRACTS_ROOT_DIR)/.env

export

.PHONY: help
help:
	@. ${CONTRACTS_ROOT_DIR}.make/scripts/help.sh

$(CONTRACTS_ROOT_DIR)/.env:
	@cd $(CONTRACTS_ROOT_DIR) && cp .env.sample .env \
		&& echo .env file created, ready to hold your precious and secret variable values.

.PHONY: build
build:
	@. ${CONTRACTS_ROOT_DIR}.make/scripts/build.sh

.PHONY: clean
clean:
	@cd $(CONTRACTS_ROOT_DIR) \
		&& git submodule deinit --all \
		&& forge clean

.PHONY: test
test:
	@cd $(CONTRACTS_ROOT_DIR) && forge test --gas-report

.PHONY: testv
testv:
	@cd $(CONTRACTS_ROOT_DIR) && forge test -vvv

.PHONY: watch
watch:
	@cd $(CONTRACTS_ROOT_DIR) && forge test -w

.PHONY: watchv
watchv:
	@cd $(CONTRACTS_ROOT_DIR) && forge test -w -vvv

.PHONY: coverage
coverage:
	@cd $(CONTRACTS_ROOT_DIR) && forge coverage

.PHONY: coverage_ci
coverage_ci:
	@cd $(CONTRACTS_ROOT_DIR) && forge coverage --report lcov

.PHONY: local_deploy
local_deploy: build test
	@$(MAKE) run script=LocalDeploy

.PHONY: sepolia_deploy
sepolia_deploy: build test
	@cd $(CONTRACTS_ROOT_DIR) \
		&& forge script script/SepoliaDeploy.s.sol \
		--rpc-url sepolia \
		--broadcast \
		--verify

.PHONY: run
run: script=
run: run_local_blockchain
	@cd $(CONTRACTS_ROOT_DIR) && [ -z "$${script}" ] \
		&& echo 'You have to specify a script name' \
		&& exit 1 \
		|| exit 0
	@cd $(CONTRACTS_ROOT_DIR) && [ ! -f "script/$${script}.s.sol" ] \
		&& echo "Unexisting script: script/$${script}.s.sol (case matters)" \
		&& exit 1 \
		|| exit 0
	@cd $(CONTRACTS_ROOT_DIR) \
		&& while true; do \
		forge script script/$${script}.s.sol \
		  --sender "${TEST_SENDER_ADDRESS}" \
		  --private-keys "${TEST_SENDER_PRIVATE_KEY}" \
		  --private-keys "${TEST_PRIVATE_KEY_01}" \
		  --private-keys "${TEST_PRIVATE_KEY_02}" \
		  --private-keys "${TEST_PRIVATE_KEY_03}" \
		  --private-keys "${TEST_PRIVATE_KEY_04}" \
		  --private-keys "${TEST_PRIVATE_KEY_05}" \
		  --private-keys "${TEST_PRIVATE_KEY_06}" \
		  --private-keys "${TEST_PRIVATE_KEY_07}" \
		  --private-keys "${TEST_PRIVATE_KEY_08}" \
		  --private-keys "${TEST_PRIVATE_KEY_09}" \
		  --rpc-url local \
		  --broadcast \
		&& break || sleep 1; done

.PHONY: run_local_blockchain
run_local_blockchain: .anvil.pid
	@( cd $(CONTRACTS_ROOT_DIR) && [ -z "$$(pidof anvil)" ] && rm .anvil.pid && $(MAKE) .anvil.pid ) || return 0
	@cd $(CONTRACTS_ROOT_DIR) && echo $$(pidof anvil) > .anvil.pid

.PHONY: kill_local_blockchain
kill_local_blockchain:
	@( cd $(CONTRACTS_ROOT_DIR) && [ -f .anvil.pid ] && kill "$$(cat .anvil.pid)" && rm .anvil.pid ) || echo "nothing to kill"

.anvil.pid:
	@cd $(CONTRACTS_ROOT_DIR) \
		&& [ -z "$$(pidof anvil)" ] \
		&& anvil \
		  --accounts 10 \
		  --mnemonic ${TEST_MNEMONIC} \
			--fork-url mainnet \
			--fork-block-number "${MAINNET_FORK_BLOCK}" \
			--host "${ANVIL_HOST}" --port "${ANVIL_PORT}" \
			--hardfork "${ANVIL_EVM_VERSION}" \
			> .anvil.out \
			& echo $$!>.anvil.pid \
		|| echo $$(pidof anvil) > .anvil.pid

