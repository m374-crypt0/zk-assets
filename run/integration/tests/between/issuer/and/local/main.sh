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

run_integration_tests() {
  if [ "$COVERAGE" = 'true' ]; then
    make -C "${ZK_ASSETS_ROOT_DIR}" issuer pattern='<integration>' coverage
  elif [ "$COVERAGE_CI" = 'true' ]; then
    make -C "${ZK_ASSETS_ROOT_DIR}" issuer pattern='<integration>' coverage_ci
  else
    make -C "${ZK_ASSETS_ROOT_DIR}" issuer pattern='<integration>' test
  fi
}

main() {
  install_issuer &&
    deploy_contracts_on_local_blockchain &&
    run_integration_tests
}

main
