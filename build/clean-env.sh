#!/bin/sh
# Wine (used by electron-builder for the Windows uninstaller) crashes when the
# environment is very large, so build with a minimal one.
exec env -i HOME="$HOME" PATH="$PATH" HTTPS_PROXY="$HTTPS_PROXY" HTTP_PROXY="$HTTP_PROXY" NO_PROXY="$NO_PROXY" \
  NODE_EXTRA_CA_CERTS="$NODE_EXTRA_CA_CERTS" WINEDEBUG=-all "$@"
