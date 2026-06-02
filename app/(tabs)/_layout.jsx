import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

function CustomTabBar({ state, descriptors, navigation }) {
  const tabs = [
    { name: 'index', icon: 'home' },
    { name: 'leaderboard', icon: 'bar-chart' },
    { name: 'forum', icon: 'chatbubbles' },
    { name: 'kupon', icon: 'gift' },
  ];

  return (
    <View style={styles.wrapper}>
      <View style={styles.pill}>
        {tabs.map((tab, index) => {
          const route = state.routes.find(r => r.name === tab.name);
          if (!route) return null;
          const isFocused = state.index === state.routes.indexOf(route);

          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tabItem}
              onPress={() => navigation.navigate(tab.name)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={tab.icon}
                size={26}
                color={isFocused ? '#FFA500' : 'rgba(255,255,255,0.5)'}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="leaderboard" options={{ title: 'Leaderboard' }} />
      <Tabs.Screen name="forum" options={{ title: 'Forum' }} />
      <Tabs.Screen name="kupon" options={{ title: 'Kupon' }} />
      <Tabs.Screen name="buat-laporan" options={{ href: null }} />
      <Tabs.Screen name="detail-forum" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pill: {
    width: '95%',
    maxWidth: 360,
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 32,
    height: 60,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    gap: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
  },
});