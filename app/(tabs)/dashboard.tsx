import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Link } from "expo-router";

export default function Dashboard() {
  return (
    <View style={styles.container}>
      {/* Header Area */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Good Morning</Text>
        <Text style={styles.subtitle}>Abyssal Flow Status</Text>
      </View>

      {/* Main Status Circle */}
      <View style={styles.circleContainer}>
        <View style={styles.outerCircle}>
          <View style={styles.innerCircle}>
            <Text style={styles.dayText}>Day 12</Text>
            <Text style={styles.statusLabel}>Follicular Phase</Text>
          </View>
        </View>
      </View>

      {/* Link Button */}
      <Link href="/" asChild>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Go to Login Screen</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FBFF",
    paddingHorizontal: 30,
    justifyContent: "space-around",
  },
  header: {
    marginTop: 60,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "300",
    color: "#1A237E",
  },
  subtitle: {
    fontSize: 16,
    color: "#78909C",
    marginTop: 5,
  },
  circleContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  outerCircle: {
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 1,
    borderColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    backgroundColor: "#FFF",
  },
  innerCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "#FFF",
    borderWidth: 8,
    borderColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: {
    fontSize: 48,
    fontWeight: "200",
    color: "#1A237E",
  },
  statusLabel: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  button: {
    backgroundColor: "#1A237E",
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "500",
  },
});
