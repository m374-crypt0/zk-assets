install_customer() {
  bun install --cwd "${ZK_ASSETS_ROOT_DIR}customer" >/dev/null 2>&1
}

install_issuer() {
  bun install --cwd "${ZK_ASSETS_ROOT_DIR}issuer" >/dev/null 2>&1
}

reset_local_blockchain() {
  make -C "${ZK_ASSETS_ROOT_DIR}" contracts kill_local_blockchain 1>/dev/null 2>&1
}

deploy_contracts() {
  make -C "${ZK_ASSETS_ROOT_DIR}" contracts local_deploy 1>/dev/null 2>&1
}

deploy_contracts_on_local_blockchain() {
  reset_local_blockchain &&
    deploy_contracts
}

start_issuer_api() {
  make -C "${ZK_ASSETS_ROOT_DIR}issuer" dev_background
}

run_integration_tests() {
  if [ "$COVERAGE" = 'true' ]; then
    make -C "${ZK_ASSETS_ROOT_DIR}" customer pattern='<integration>' coverage
  elif [ "$COVERAGE_CI" = 'true' ]; then
    make -C "${ZK_ASSETS_ROOT_DIR}" customer pattern='<integration>' coverage_ci
  else
    make -C "${ZK_ASSETS_ROOT_DIR}" customer pattern='<integration>' test
  fi
}

main() {
  install_customer &&
    install_issuer &&
    deploy_contracts_on_local_blockchain &&
    start_issuer_api &&
    run_integration_tests
}

main
