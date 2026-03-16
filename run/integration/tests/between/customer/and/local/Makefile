LOCAL_ROOT_DIR := ${ZK_ASSETS_ROOT_DIR}run/integration/tests/between/customer/and/local/

include $(ZK_ASSETS_ROOT_DIR)contracts/.env

export

$(ZK_ASSETS_ROOT_DIR)contracts/.env:
	@${MAKE} -C "${ZK_ASSETS_ROOT_DIR}" contracts .env

.PHONY: blockchain
blockchain: COVERAGE=false COVERAGE_CI=false
blockchain:
	@. ${LOCAL_ROOT_DIR}main.sh
