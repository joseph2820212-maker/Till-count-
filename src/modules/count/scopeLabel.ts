import i18n from '../../i18n';
import type { CountScope } from '../../domain/types';

/** Display name of a count's scope, frozen at start (scopeLabel) or derived from its type. */
export function scopeTitle(s: { scope: CountScope; scopeLabel?: string; productIdsSnapshot?: string[] }): string {
  if (s.scopeLabel) return s.scopeLabel;
  switch (s.scope.type) {
    case 'everything': return i18n.t('scope.everything');
    case 'selected': return i18n.t('scope.selectedCount', { count: s.scope.selectedProductIds?.length ?? 0 });
    case 'category': return i18n.t('scope.category');
    case 'supplier': return i18n.t('scope.supplier');
    case 'location': return i18n.t('scope.location');
    default: return '';
  }
}
