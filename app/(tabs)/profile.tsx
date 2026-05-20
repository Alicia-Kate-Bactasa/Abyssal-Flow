import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [description, setDescription] = useState("");

  const handleLogout = () => {
    router.replace("/auth/login");
  };

  const handleActionPress = (label: string) => {
    console.log("Profile action:", label);
  };

  return (
    <LinearGradient colors={["#061736", "#1E3A78"]} style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: 24 + insets.top, paddingBottom: 140 + insets.bottom },
        ]}
      >
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
        <TextInput
          style={styles.descriptionBox}
          placeholder="Share a little about yourself..."
          placeholderTextColor="rgba(255,255,255,0.5)"
          multiline
          value={description}
          onChangeText={setDescription}
        />

        {Array.from({ length: 4 }, (_, index) => {
          const label = "Edit Information";
          return (
            <Pressable
              key={`${label}-${index}`}
              onPress={() => handleActionPress(label)}
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionButtonPressed,
              ]}
            >
              <Text style={styles.actionText}>{label}</Text>
            </Pressable>
          );
        })}

        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.actionButtonPressed,
          ]}
        >
          <Text style={styles.actionText}>Log out</Text>
        </Pressable>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: 24,
    alignItems: "center",
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
    padding: 12,
    color: "#FFFFFF",
    textAlignVertical: "top",
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
  actionButtonPressed: {
    opacity: 0.7,
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
