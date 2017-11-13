#!/usr/bin/env bash
#
# Copyright 2016 Christopher Antila
# Copyright 2017 Jeff Treviño

echo "Running all the test suites."
# wd: macOS/
echo "Running Julius tests."
cd julius && npm test && cd ..
cd fujian && py.test && cd ..
cd lychee && py.test && cd ..
echo "Running mercurial tests."
cd mercurial-hug && py.test && cd ..