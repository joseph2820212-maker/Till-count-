/**
 * nav.ts — typed navigation helpers. Screens call useNav() and navigate by route name
 * within the current tab's stack; goTab() jumps to another tab's root.
 */
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TAB_OF, type RootParamList, type StackParamList, type TabRoot } from './types';

export type Nav = NativeStackNavigationProp<RootParamList>;

export function useNav(): Nav {
  return useNavigation<Nav>();
}

export function useParams<R extends keyof StackParamList>(): StackParamList[R] {
  return (useRoute<RouteProp<StackParamList, R>>().params ?? {}) as StackParamList[R];
}

/** Jump to a tab root, resetting that tab's stack to its root. */
export function goTab<R extends TabRoot>(nav: Nav, root: R, params?: StackParamList[R]): void {
  nav.navigate('Tabs', { screen: TAB_OF[root], params: { screen: root, params } } as never);
}

/** Go back if possible, otherwise to the given tab root (deep links, restored state). */
export function backOr(nav: Nav, root: TabRoot): void {
  if (nav.canGoBack()) nav.goBack();
  else goTab(nav, root);
}
