install_customer() {
  bun install --cwd "${ZHOLD_ROOT_DIR}customer" >/dev/null 2>&1
}

install_issuer() {
  bun install --cwd "${ZHOLD_ROOT_DIR}issuer" >/dev/null 2>&1
}

reset_local_blockchain() {
  make -C "${ZHOLD_ROOT_DIR}" contracts kill_local_blockchain 1>/dev/null 2>&1
}

deploy_contracts() {
  make -C "${ZHOLD_ROOT_DIR}" contracts local_deploy 1>/dev/null 2>&1
}

deploy_contracts_on_local_blockchain() {
  reset_local_blockchain &&
    deploy_contracts
}

start_issuer_api() {
  make -C "${ZHOLD_ROOT_DIR}issuer" dev_background
}

run_integration_tests() {
  make -C "${ZHOLD_ROOT_DIR}" customer pattern=integration test
}

main() {
  install_customer &&
    install_issuer &&
    deploy_contracts_on_local_blockchain &&
    start_issuer_api &&
    run_integration_tests
}

main
