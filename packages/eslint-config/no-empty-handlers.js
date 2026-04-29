/**
 * Custom ESLint rule: no-empty-handlers.
 * Forbids dead UI: empty onClick handlers, href="#", javascript: URLs.
 * Source-of-truth: docs/IMPLEMENTATION_PLAN.md §35.1.
 */

/** @type {import('eslint').Rule.RuleModule} */
export const noEmptyHandlers = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Forbid empty handlers, href="#", and javascript: URLs.',
    },
    messages: {
      emptyOnClick: 'Empty {{attr}} handler is forbidden — wire a real action or hide the control.',
      anchorHashOnly: 'href="#" is forbidden — use a real route or a <button>.',
      jsHref: 'href="javascript:..." is forbidden — use a real URL or a <button>.',
    },
    schema: [],
  },
  create(context) {
    const isEmptyHandlerExpr = (node) => {
      if (!node) return false;
      if (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression') {
        const body = node.body;
        if (body.type === 'BlockStatement' && body.body.length === 0) return true;
      }
      if (node.type === 'Identifier' && node.name === 'noop') return true;
      return false;
    };

    return {
      JSXAttribute(node) {
        const name = node.name && node.name.name;
        if (!name) return;

        const handlerAttrs = new Set([
          'onClick',
          'onSubmit',
          'onChange',
          'onKeyDown',
          'onKeyUp',
          'onMouseDown',
          'onMouseUp',
          'onFocus',
          'onBlur',
        ]);

        if (handlerAttrs.has(name)) {
          const value = node.value;
          if (value && value.type === 'JSXExpressionContainer') {
            if (isEmptyHandlerExpr(value.expression)) {
              context.report({ node, messageId: 'emptyOnClick', data: { attr: name } });
            }
          }
        }

        if (name === 'href') {
          const value = node.value;
          if (value && value.type === 'Literal' && typeof value.value === 'string') {
            if (value.value === '#') {
              context.report({ node, messageId: 'anchorHashOnly' });
            } else if (value.value.toLowerCase().startsWith('javascript:')) {
              context.report({ node, messageId: 'jsHref' });
            }
          }
        }
      },
    };
  },
};

export default {
  rules: {
    'no-empty-handlers': noEmptyHandlers,
  },
};
