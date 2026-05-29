// ============================================================================
// NO-SILENT-FALLBACK ESLint rule (Phase 0 D-0.12)
// ============================================================================
// Spec: INTEGRATED_BUILD_SEQUENCE.md D-0.12 / L5_IMPLEMENTATION_PLAN §2 D-0.12.
// Enforces the no-fallback charter (workspace-wide standing rule §0)
// at code-review time. Three patterns flagged:
//
// 1. Promise.allSettled(...) without per-result rejection handling.
//    Heuristic: warn on every Promise.allSettled call; the developer
//    explicitly suppresses with a comment + the .filter(r => r.status
//    === 'rejected') follow-up on the result.
// 2. try/catch where the catch body neither re-throws NOR calls a
//    telemetry emit function (any callee whose name starts with `emit`).
// 3. `??` default in a function whose name (or assigned variable name)
//    matches /^(orchestrate|analyze|generate|build)/. Critical paths
//    surface failures explicitly; defaults can mask them.
//
// Behavior: warn level (per the contract — "warnings, not errors
// initially; promote to errors after Phase 1 stabilizes"). Developers
// review during the no-fallback enforcement pass (Phase 1 D-1.12,
// Phase 3 D-3.15).

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'No-fallback discipline: flag Promise.allSettled without rejection handling, naked catch blocks, and ?? defaults in critical paths.',
      recommended: false,
    },
    schema: [],
    messages: {
      allSettledWithoutHandling:
        'Promise.allSettled() without per-result rejection handling. ' +
        'Add results.filter(r => r.status === "rejected") and surface rejections to ' +
        'telemetry or re-throw — silent rejection is the fallback the no-fallback charter forbids.',
      catchWithoutThrowOrEmit:
        'catch block neither re-throws nor calls a telemetry emit function. ' +
        'No-fallback discipline requires explicit failure surfaces — re-throw, ' +
        'call emitStepFailure(), or call an `emit*` helper.',
      criticalPathFallback:
        '?? default in a function named "{{ funcName }}". ' +
        'Functions matching orchestrate*/analyze*/generate*/build* are critical paths; ' +
        'defaults can mask failures. Surface the missing value explicitly (throw or telemetry).',
    },
  },

  create(context) {
    return {
      // ─── Pattern 1: Promise.allSettled detection ───
      CallExpression(node) {
        if (
          node.callee.type === 'MemberExpression' &&
          !node.callee.computed &&
          node.callee.object.type === 'Identifier' &&
          node.callee.object.name === 'Promise' &&
          node.callee.property.type === 'Identifier' &&
          node.callee.property.name === 'allSettled'
        ) {
          context.report({ node, messageId: 'allSettledWithoutHandling' });
        }
      },

      // ─── Pattern 2: catch block without throw or emit* ───
      CatchClause(node) {
        if (!node.body || node.body.type !== 'BlockStatement') return;
        const stmts = node.body.body;
        if (stmts.length === 0) {
          // empty catch: definitely a silent fallback
          context.report({ node, messageId: 'catchWithoutThrowOrEmit' });
          return;
        }
        const hasThrow = containsThrowOrReThrow(stmts);
        const hasEmit = containsEmitCall(stmts);
        if (!hasThrow && !hasEmit) {
          context.report({ node, messageId: 'catchWithoutThrowOrEmit' });
        }
      },

      // ─── Pattern 3: ?? default in critical-path function ───
      LogicalExpression(node) {
        if (node.operator !== '??') return;
        const funcName = findEnclosingFunctionName(node, context);
        if (funcName && /^(orchestrate|analyze|generate|build)/.test(funcName)) {
          context.report({
            node,
            messageId: 'criticalPathFallback',
            data: { funcName },
          });
        }
      },
    };
  },
};

// ─── AST helpers ────────────────────────────────────────────────────────

/**
 * Recursively check whether any statement in the array is (or contains)
 * a `throw` statement. We descend into IfStatement / SwitchStatement /
 * BlockStatement so a re-throw inside an if/else still counts.
 *
 * Note: we don't try to verify the throw is unconditional. A catch
 * block that re-throws *only* in some branches still gets credit —
 * code review catches the residual cases.
 */
function containsThrowOrReThrow(stmts) {
  for (const stmt of stmts) {
    if (!stmt) continue;
    if (stmt.type === 'ThrowStatement') return true;
    if (stmt.type === 'IfStatement') {
      if (statementContainsThrow(stmt.consequent)) return true;
      if (stmt.alternate && statementContainsThrow(stmt.alternate)) return true;
    }
    if (stmt.type === 'BlockStatement' && containsThrowOrReThrow(stmt.body)) return true;
    if (stmt.type === 'SwitchStatement') {
      for (const c of stmt.cases) {
        if (containsThrowOrReThrow(c.consequent)) return true;
      }
    }
  }
  return false;
}

function statementContainsThrow(stmt) {
  if (!stmt) return false;
  if (stmt.type === 'ThrowStatement') return true;
  if (stmt.type === 'BlockStatement') return containsThrowOrReThrow(stmt.body);
  return false;
}

/**
 * Detect a CallExpression to a function whose name starts with `emit`
 * — covers emitStepStart, emitStepSuccess, emitStepFailure,
 * emitIterationEvent, etc. Walks descendants of the catch body so an
 * emit nested in an if-branch still counts.
 *
 * Also accepts member-expression callees like `telemetry.emitX(...)`.
 */
function containsEmitCall(stmts) {
  for (const stmt of stmts) {
    if (statementContainsEmitCall(stmt)) return true;
  }
  return false;
}

function statementContainsEmitCall(node) {
  if (!node || typeof node !== 'object') return false;
  if (node.type === 'CallExpression') {
    const calleeName = getCalleeIdentifierName(node.callee);
    if (calleeName && /^emit/.test(calleeName)) return true;
  }
  // Recurse into common containers.
  if (node.type === 'BlockStatement') return containsEmitCall(node.body);
  if (node.type === 'IfStatement') {
    return (
      statementContainsEmitCall(node.consequent) ||
      (node.alternate && statementContainsEmitCall(node.alternate))
    );
  }
  if (node.type === 'ExpressionStatement') return statementContainsEmitCall(node.expression);
  if (node.type === 'AwaitExpression') return statementContainsEmitCall(node.argument);
  if (node.type === 'TryStatement') {
    return (
      containsEmitCall(node.block.body) ||
      (node.handler && containsEmitCall(node.handler.body.body)) ||
      (node.finalizer && containsEmitCall(node.finalizer.body))
    );
  }
  if (node.type === 'SwitchStatement') {
    for (const c of node.cases) {
      if (containsEmitCall(c.consequent)) return true;
    }
  }
  return false;
}

/**
 * Pull a leaf-name from a callee expression:
 *   foo(...)               → 'foo'
 *   obj.method(...)        → 'method'
 *   obj.subobj.method(...) → 'method'
 *   (await foo)(...)       → undefined  (caller handles)
 */
function getCalleeIdentifierName(callee) {
  if (!callee) return undefined;
  if (callee.type === 'Identifier') return callee.name;
  if (callee.type === 'MemberExpression' && !callee.computed && callee.property.type === 'Identifier') {
    return callee.property.name;
  }
  return undefined;
}

/**
 * Walk up the ancestor chain to find the enclosing function and return
 * its inferred name. Handles:
 *   function foo() { ... }                 → 'foo'
 *   const foo = function () { ... }        → 'foo'
 *   const foo = () => { ... }              → 'foo'
 *   class X { foo() { ... } }              → 'foo'
 *   { foo() { ... } } (object method)      → 'foo'
 *
 * Returns undefined if no enclosing function or no inferable name.
 */
function findEnclosingFunctionName(node, context) {
  // sourceCode.getAncestors is the modern API; older ESLint versions
  // expose context.getAncestors. Try both.
  const sourceCode = context.sourceCode || context.getSourceCode?.();
  let ancestors;
  if (sourceCode && typeof sourceCode.getAncestors === 'function') {
    ancestors = sourceCode.getAncestors(node);
  } else if (typeof context.getAncestors === 'function') {
    ancestors = context.getAncestors();
  } else {
    return undefined;
  }
  // Walk from innermost outward.
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const a = ancestors[i];
    if (
      a.type === 'FunctionDeclaration' ||
      a.type === 'FunctionExpression' ||
      a.type === 'ArrowFunctionExpression'
    ) {
      // FunctionDeclaration carries .id directly.
      if (a.type === 'FunctionDeclaration' && a.id && a.id.name) return a.id.name;
      // For (Function|Arrow)Expression, look at the parent for the assignment.
      const parent = ancestors[i - 1];
      if (!parent) {
        // FunctionExpression with a name property (e.g., named function expression)
        if (a.type === 'FunctionExpression' && a.id && a.id.name) return a.id.name;
        return undefined;
      }
      if (parent.type === 'VariableDeclarator' && parent.id && parent.id.type === 'Identifier') {
        return parent.id.name;
      }
      if (parent.type === 'AssignmentExpression' && parent.left && parent.left.type === 'Identifier') {
        return parent.left.name;
      }
      if (parent.type === 'Property' && parent.key && parent.key.type === 'Identifier') {
        return parent.key.name;
      }
      if (parent.type === 'MethodDefinition' && parent.key && parent.key.type === 'Identifier') {
        return parent.key.name;
      }
      // FunctionExpression's own name (rare):
      if (a.type === 'FunctionExpression' && a.id && a.id.name) return a.id.name;
      return undefined;
    }
  }
  return undefined;
}

export default rule;
