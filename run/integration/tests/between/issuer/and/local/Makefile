LOCAL_ROOT_DIR := ${ZHOLD_ROOT_DIR}run/integration/tests/between/issuer/and/local/

include $(ZHOLD_ROOT_DIR)contracts/.env

export

.PHONY: blockchain
blockchain: COVERAGE=false
blockchain:
	@. ${LOCAL_ROOT_DIR}main.sh
