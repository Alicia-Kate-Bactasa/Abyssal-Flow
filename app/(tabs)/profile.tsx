import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function ProfileScreen() {
  return (
    <LinearGradient colors={["#061736", "#1E3A78"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarWrapper}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarIcon}>👤</Text>
          </View>
          <View style={styles.avatarBadge}>
            <Text style={styles.avatarBadgeText}>+</Text>
          </View>
        </View>

        <Text style={styles.name}>Ishie Boo</Text>
        <Text style={styles.sectionLabel}>Description:</Text>
        <View style={styles.descriptionBox} />

        {Array.from({ length: 4 }, (_, index) => (
          <View key={index} style={styles.actionButton}>
            <Text style={styles.actionText}>Edit Information</Text>
          </View>
        ))}

        <View style={styles.logoutButton}>
          <Text style={styles.actionText}>Log out</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: 24,
    alignItems: "center",
    paddingBottom: 140,
  },
  avatarWrapper: {
    marginTop: 12,
    marginBottom: 18,
  },
  avatarCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarIcon: { fontSize: 40, color: "#FFFFFF" },
  avatarBadge: {
    position: "absolute",
    right: 0,
    bottom: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E1F2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBadgeText: { color: "#0B1F3C", fontWeight: "bold" },
  name: {
    color: "#FFFFFF",
    fontSize: 20,
    marginBottom: 8,
  },
  sectionLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  descriptionBox: {
    width: "100%",
    height: 90,
    borderRadius: 18,
    backgroundColor: "rgba(19,33,75,0.7)",
    marginBottom: 18,
  },
  actionButton: {
    width: "100%",
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(19,33,75,0.7)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  logoutButton: {
    width: "100%",
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(19,33,75,0.9)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  actionText: {
    color: "#FFFFFF",
    fontSize: 13,
  },
});
