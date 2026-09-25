/**
 * Text — the app's only text primitive. The paragraph direction must follow the layout,
 * not the first letter: Android aligns `textAlign: auto` text by its first strong
 * character, so "Coca-Cola 500ml" would sit on the left of an Arabic row and "العربية"
 * on the right of an English one. A leading direction mark (RLM in RTL, LRM in LTR)
 * sets the paragraph direction without changing how the words or numbers read.
 */
import React from 'react';
import { I18nManager, Text as RNText, type TextProps } from 'react-native';

export const RLM = '‏';
export const LRM_MARK = '‎';

function withMark(children: React.ReactNode, mark: string): React.ReactNode {
  if (typeof children === 'string' || typeof children === 'number') return mark + String(children);
  if (Array.isArray(children) && children.length && (typeof children[0] === 'string' || typeof children[0] === 'number')) {
    return [mark + String(children[0]), ...children.slice(1)];
  }
  return children;
}

export const Text = React.forwardRef<React.ComponentRef<typeof RNText>, TextProps>(function Text(props, ref) {
  return <RNText ref={ref} {...props}>{withMark(props.children, I18nManager.isRTL ? RLM : LRM_MARK)}</RNText>;
});
