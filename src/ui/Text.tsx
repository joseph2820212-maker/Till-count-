/**
 * Text — the app's only text primitive. In Arabic the paragraph direction must follow the
 * layout, not the first letter: Android aligns `textAlign: auto` text by its first strong
 * character, so a product name such as "Coca-Cola 500ml" would sit on the left of an RTL
 * row. A leading RIGHT-TO-LEFT MARK makes every string an RTL paragraph (start-aligned
 * on the right) without changing how its Latin words or numbers read.
 */
import React from 'react';
import { I18nManager, Text as RNText, type TextProps } from 'react-native';

export const RLM = '‏';

function withRtlMark(children: React.ReactNode): React.ReactNode {
  if (typeof children === 'string' || typeof children === 'number') return RLM + String(children);
  if (Array.isArray(children) && children.length && (typeof children[0] === 'string' || typeof children[0] === 'number')) {
    return [RLM + String(children[0]), ...children.slice(1)];
  }
  return children;
}

export const Text = React.forwardRef<React.ComponentRef<typeof RNText>, TextProps>(function Text(props, ref) {
  if (!I18nManager.isRTL) return <RNText ref={ref} {...props} />;
  return <RNText ref={ref} {...props}>{withRtlMark(props.children)}</RNText>;
});
