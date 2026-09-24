/**
 * AppNavigator — root stack (onboarding until finished, then the five tabs). Each tab
 * hosts its own native stack: the tab root plus every shared screen, so Back always
 * returns within the flow it came from. Figma shows the navy tab bar only on the five
 * tab roots; pushed screens are full height.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../ui/Text';
import { NavigationContainer, getFocusedRouteNameFromRoute, type RouteProp } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { tc } from '../theme/colors';
import { tcType } from '../theme/typography';
import { useAppState } from '../state/store';
import { FIGMA_SCREENS, ONBOARDING_ROUTES, SHARED_SCREENS } from './screens';
import type { RootParamList, StackParamList, TabParamList, TabRoot } from './types';

const byRoute = new Map(FIGMA_SCREENS.map(s => [s.route, s.component]));

function makeTabStack(root: TabRoot): React.FC {
  const S = createNativeStackNavigator<StackParamList>();
  const Root = byRoute.get(root)!;
  const TabStack: React.FC = () => (
    <S.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <S.Screen name={root} component={Root} />
      {SHARED_SCREENS.map(sc => <S.Screen key={sc.route} name={sc.route} component={sc.component} />)}
    </S.Navigator>
  );
  TabStack.displayName = `${root}Stack`;
  return TabStack;
}

const STACKS: Record<TabRoot, React.FC> = {
  Home: makeTabStack('Home'),
  Count: makeTabStack('Count'),
  Products: makeTabStack('Products'),
  Reorder: makeTabStack('Reorder'),
  More: makeTabStack('More'),
};

const TABS: { name: keyof TabParamList; root: TabRoot; icon: React.ComponentProps<typeof Ionicons>['name']; label: string }[] = [
  { name: 'HomeTab', root: 'Home', icon: 'home-outline', label: 'nav.home' },
  { name: 'CountTab', root: 'Count', icon: 'barcode-outline', label: 'nav.count' },
  { name: 'ProductsTab', root: 'Products', icon: 'cube-outline', label: 'nav.products' },
  { name: 'ReorderTab', root: 'Reorder', icon: 'list-outline', label: 'nav.reorder' },
  { name: 'MoreTab', root: 'More', icon: 'menu-outline', label: 'nav.more' },
];

const Tab = createBottomTabNavigator<TabParamList>();

/** The tab bar shows only while the tab's root screen is focused (Figma). */
export function tabBarVisible(route: RouteProp<TabParamList, keyof TabParamList>, root: TabRoot): boolean {
  const focused = getFocusedRouteNameFromRoute(route) ?? root;
  return focused === root;
}

export const TabNavigator: React.FC = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 7);
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarHideOnKeyboard: true }}>
      {TABS.map(tab => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={STACKS[tab.root]}
          options={({ route }) => ({
            tabBarLabel: ({ focused }) => (
              <View style={s.labelWrap}>
                <Text style={[s.label, { color: focused ? tc.onNavy : tc.navInactive }]} numberOfLines={1}>{t(tab.label)}</Text>
                <View style={[s.mark, !focused && s.markOff]} testID={focused ? `tab-mark-${tab.root}` : undefined} />
              </View>
            ),
            tabBarIcon: ({ focused }) => <Ionicons name={tab.icon} size={20} color={focused ? tc.onNavy : tc.navInactive} />,
            tabBarAccessibilityLabel: t(tab.label),
            tabBarTestID: `tab-${tab.root}`,
            tabBarItemStyle: s.item,
            tabBarStyle: tabBarVisible(route as RouteProp<TabParamList, keyof TabParamList>, tab.root)
              ? [s.bar, { height: 58 + bottom + 7, paddingBottom: bottom }]
              : { display: 'none' },
            tabBarIconStyle: s.icon,
            tabBarLabelPosition: 'below-icon',
            tabBarActiveTintColor: tc.onNavy,
            tabBarInactiveTintColor: tc.navInactive,
            tabBarBackground: () => <View style={s.bg} />,
          })}
          listeners={({ navigation }) => ({
            tabPress: () => {
              // Tapping a tab always lands on its root screen.
              navigation.navigate(tab.name, { screen: tab.root });
            },
          })}
        />
      ))}
    </Tab.Navigator>
  );
};

const Root = createNativeStackNavigator<RootParamList>();

export const AppNavigator: React.FC = () => {
  const onboarded = useAppState(st => !!st.onboarding.completedAt);
  return (
    <NavigationContainer>
      <Root.Navigator screenOptions={{ headerShown: false }}>
        {onboarded ? (
          <Root.Screen name="Tabs" component={TabNavigator} />
        ) : (
          ONBOARDING_ROUTES.map(r => <Root.Screen key={r} name={r} component={byRoute.get(r)!} />)
        )}
      </Root.Navigator>
    </NavigationContainer>
  );
};

const s = StyleSheet.create({
  bar: { backgroundColor: tc.navy, borderTopWidth: 0, paddingTop: 7, elevation: 0 },
  bg: { flex: 1, backgroundColor: tc.navy },
  item: { minHeight: 44 },
  icon: { marginBottom: 0 },
  labelWrap: { alignItems: 'center', gap: 2 },
  label: { ...tcType.micro, textAlign: 'center' },
  /** Orange 3dp active mark under the active tab (Figma bottom navigation). */
  mark: { width: 28, height: 3, borderRadius: 999, backgroundColor: tc.accent },
  markOff: { backgroundColor: 'transparent' },
});
