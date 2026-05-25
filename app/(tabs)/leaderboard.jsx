import { Ionicons } from '@expo/vector-icons';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

const leaderboardData = [
  { id: '1', nama: 'JOKO WIWIDO', upvote: '1.6k', rank: 1 },
  { id: '2', nama: 'FARHAN SETI', upvote: '1.6k', rank: 2 },
  { id: '3', nama: 'SETIAWAN ADI', upvote: '1.6k', rank: 3 },
  { id: '4', nama: 'JOKO WIWIDO', upvote: '1.6k', rank: 4 },
  { id: '5', nama: 'JOKO WIWIDO', upvote: '1.6k', rank: 5 },
  { id: '6', nama: 'JOKO WIWIDO', upvote: '1.6k', rank: 6 },
];

const podiumColors = {
  1: '#FFA500',
  2: '#90CAF9',
  3: '#FF7043',
};

export default function LeaderboardScreen() {
  const top3 = leaderboardData.slice(0, 3);
  const rest = leaderboardData.slice(3);
  const router = useRouter();
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar} />
        <Text style={styles.headerTitle}>Halo, King!</Text>
      <TouchableOpacity onPress={() => router.push('/settings')}>
        <Ionicons name="settings-sharp" size={26} color="#FFA500" />
      </TouchableOpacity>
      </View>

      {/* Podium Top 3 */}
      <View style={styles.podium}>
        {/* Rank 2 */}
        <View style={styles.podiumItem}>
          <View style={styles.podiumAvatar} />
          <Text style={styles.podiumNama}>{top3[1].nama}</Text>
          <View style={[styles.podiumBadge, { backgroundColor: podiumColors[2], height: 60 }]}>
            <Text style={styles.podiumRank}>2</Text>
          </View>
        </View>

        {/* Rank 1 */}
        <View style={styles.podiumItem}>
          <Ionicons name="trophy" size={28} color="#FFA500" />
          <View style={styles.podiumAvatar} />
          <Text style={styles.podiumNama}>{top3[0].nama}</Text>
          <View style={[styles.podiumBadge, { backgroundColor: podiumColors[1], height: 80 }]}>
            <Text style={styles.podiumRank}>1</Text>
          </View>
        </View>

        {/* Rank 3 */}
        <View style={styles.podiumItem}>
          <View style={styles.podiumAvatar} />
          <Text style={styles.podiumNama}>{top3[2].nama}</Text>
          <View style={[styles.podiumBadge, { backgroundColor: podiumColors[3], height: 40 }]}>
            <Text style={styles.podiumRank}>3</Text>
          </View>
        </View>
      </View>

      {/* List Rank 4+ */}
      <View style={styles.listContainer}>
        <FlatList
          data={rest}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.listItem}>
              <Text style={styles.listRank}>{item.rank}.</Text>
              <View style={styles.listAvatar} />
              <Text style={styles.listNama}>{item.nama}</Text>
              <View style={styles.upvoteBox}>
                <Ionicons name="thumbs-up" size={14} color="#1565C0" />
                <Text style={styles.upvoteText}>{item.upvote}</Text>
              </View>
            </View>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1565C0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    gap: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#90CAF9',
  },
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 0,
    gap: 8,
  },
  podiumItem: {
    alignItems: 'center',
    flex: 1,
  },
  podiumAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#90CAF9',
    marginBottom: 6,
  },
  podiumNama: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  podiumBadge: {
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  podiumRank: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 22,
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    padding: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  listRank: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    width: 24,
  },
  listAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#90CAF9',
  },
  listNama: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  upvoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  upvoteText: {
    fontSize: 13,
    color: '#1565C0',
    fontWeight: 'bold',
  },
});