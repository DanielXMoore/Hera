#!/usr/bin/env bash

# TODO: update e2e

export CODE_TESTS_PATH="$(pwd)/e2e/dist"
export CODE_TESTS_WORKSPACE="$(pwd)/e2e/fixture"

node "$(pwd)/e2e/dist/runTest"
