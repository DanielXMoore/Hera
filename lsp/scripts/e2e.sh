#!/usr/bin/env bash

export CODE_TESTS_PATH="$(pwd)/client/dist/test"
export CODE_TESTS_WORKSPACE="$(pwd)/client/testFixture"

node "$(pwd)/client/dist/test/runTest"
