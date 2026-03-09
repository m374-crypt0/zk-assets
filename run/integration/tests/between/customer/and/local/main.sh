reset_local_blockchain() {
  make -C "${RAKE_ROOT_DIR}" contracts kill_local_blockchain 1>/dev/null 2>&1
}

deploy_contracts() {
  make -C "${RAKE_ROOT_DIR}" contracts local_deploy 1>/dev/null 2>&1
}

deploy_contracts_on_local_blockchain() {
  reset_local_blockchain &&
    deploy_contracts
}

start_issuer_api() {
  make -C "${RAKE_ROOT_DIR}issuer" dev_background
}

run_integration_tests() {
  if [ "$WATCHING" = 'true' ]; then
    make -C "${RAKE_ROOT_DIR}" customer pattern=integration watch
  else
    make -C "${RAKE_ROOT_DIR}" customer pattern=integration test
  fi
}

main() {
  deploy_contracts_on_local_blockchain &&
    start_issuer_api &&
    run_integration_tests
}

main
