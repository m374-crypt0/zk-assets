stop_api_if_applicable() {
  if [ -f "${ISSUER_ROOT_DIR}.issuer_api.pid" ]; then
    kill "$(cat "${ISSUER_ROOT_DIR}.issuer_api.pid")" >/dev/null 2>&1
  fi

  return 0
}

run_api() {
  bun run "${ISSUER_ROOT_DIR}src/" >"${ISSUER_ROOT_DIR}.issuer_api.out" 2>&1 &
  echo $! >"${ISSUER_ROOT_DIR}.issuer_api.pid"
}

main() {
  stop_api_if_applicable &&
    run_api
}

main
