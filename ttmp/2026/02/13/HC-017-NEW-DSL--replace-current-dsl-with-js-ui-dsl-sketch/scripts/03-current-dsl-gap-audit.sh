#!/usr/bin/env bash
set -euo pipefail

# Experiment: quick audit of current DSL usage to estimate migration surface.

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

echo "== Card types in app stacks =="
rg -n "type:\s*'(menu|list|detail|form|report|chat)'" apps/*/src/domain/stack.ts | sed -E "s#^#  #"

echo
echo "== DSL action types referenced in app stacks and overrides =="
rg -n "type:\s*'[^']+'" apps/*/src/domain/stack.ts apps/*/src/overrides/*.tsx \
  | rg -v "type:\s*'(menu|list|detail|form|report|chat|readonly|text|number|select|tags|label)'" \
  | sed -E "s#^#  #"

echo
echo "== Current DSL helper usage (resolver primitives) =="
rg -n "\$settings|\$input|\$match|matchFilter\(|resolveValue\(" packages apps | sed -E "s#^#  #"

echo
echo "== Renderer override files =="
rg --files apps/*/src/overrides | sed -E "s#^#  #"

echo
echo "== Engine DSL entry points =="
rg --files packages/engine/src | rg "dsl/|dispatchDSLAction|selectorRegistry|actionRegistry" | sed -E "s#^#  #"
