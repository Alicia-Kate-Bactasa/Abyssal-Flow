import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Modal,
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
  const [logoutVisible, setLogoutVisible] = useState(false);

  const handleLogout = () => {
    router.replace("/auth/login");
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
            <Text style={styles.avatarIcon}></Text>
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

        <Pressable
          onPress={() => setLogoutVisible(true)}
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.actionButtonPressed,
          ]}
        >
          <Text style={styles.actionText}>Log out</Text>
        </Pressable>
      </ScrollView>

      <Modal
        transparent
        visible={logoutVisible}
        animationType="fade"
        onRequestClose={() => setLogoutVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Log out of your account?</Text>
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setLogoutVisible(false)}
                style={({ pressed }) => [
                  styles.modalButton,
                  pressed && styles.modalButtonPressed,
                ]}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleLogout}
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.modalButtonDanger,
                  pressed && styles.modalButtonPressed,
                ]}
              >
                <Text style={styles.modalButtonText}>Log out</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(225,242,255,0.4)",
    marginBottom: 18,
    padding: 12,
    color: "#FFFFFF",
    textAlignVertical: "top",
  },
  actionButtonPressed: {
    opacity: 0.7,
  },
  logoutButton: {
    width: 190,
    height: 48,
    borderRadius: 24,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(225,242,255,0.6)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  actionText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "monospace",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(6, 12, 28, 0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCard: {
    width: "82%",
    borderRadius: 20,
    padding: 20,
    backgroundColor: "rgba(5, 14, 34, 0.95)",
    borderWidth: 1,
    borderColor: "rgba(225,242,255,0.35)",
  },
  modalTitle: {
    fontFamily: "Georgia",
    fontSize: 18,
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 18,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(225,242,255,0.5)",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  modalButtonDanger: {
    borderColor: "rgba(209, 27, 27, 0.7)",
  },
  modalButtonPressed: {
    opacity: 0.7,
  },
  modalButtonText: {
    fontFamily: "monospace",
    color: "#FFFFFF",
    fontSize: 13,
    letterSpacing: 0.6,
  },
});
