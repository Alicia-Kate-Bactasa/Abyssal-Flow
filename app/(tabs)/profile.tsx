import { useUser } from "@/hooks/use-user-store";
import { getCachedAuthUser } from "../../lib/auth-session";
import { supabaseClient } from "../../lib/supabase";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useUser();

  const [nickname, setNickname] = useState(user.nickname || "");
  const [description, setDescription] = useState(user.description || "");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState(
    user.avatar_url
      ? { uri: user.avatar_url }
      : require("../../assets/images/profile.png"),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [logoutVisible, setLogoutVisible] = useState(false);

  // 1. THIS IS THE NEW FIX: Actively listen for the URL to finish loading
  useEffect(() => {
    if (user.avatar_url) {
      // Adding a timestamp bypasses React Native's aggressive image caching
      // so it always shows the newest photo instead of an old cached one
      setAvatar({ uri: `${user.avatar_url}?t=${new Date().getTime()}` });
    } else {
      setAvatar(require("../../assets/images/profile.png"));
    }
  }, [user.avatar_url]);

  // 2. Your existing email fetcher
  useEffect(() => {
    getCachedAuthUser().then((user) => {
      if (user) setEmail(user.email || "");
    });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    await updateUser({ nickname, description });
    setIsSaving(false);
    alert("Profile Updated!");
  };

  const handleLogout = () => {
    setLogoutVisible(false);
    router.replace("/auth/login");
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Use MediaType.Images if preferred
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setAvatar({ uri });

      try {
        const userId = user.id;
        const fileName = `${userId}/avatar.png`;

        // 1. THE MAGIC FIX: Create a standard FormData payload
        const formData = new FormData();
        formData.append("file", {
          uri: uri,
          name: "avatar.png",
          type: "image/png",
        } as any); // "as any" stops TypeScript from complaining about the React Native specific formatting

        // 2. Upload the FormData directly
        const { error: uploadError } = await supabaseClient.storage
          .from("avatars")
          .upload(fileName, formData, {
            upsert: true,
          });

        if (uploadError) {
          throw new Error("Upload Error: " + uploadError.message);
        }

        // 3. Update the Database
        const { data } = supabaseClient.storage
          .from("avatars")
          .getPublicUrl(fileName);

        await updateUser({ avatar_url: data.publicUrl });
        alert("Profile picture saved!");
      } catch (err) {
        console.error("Profile Pic Error:", err);
        alert("Failed to save picture. Check console.");
      }
    }
  };

  return (
    <LinearGradient colors={["#061736", "#1E3A78"]} style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: 24 + insets.top },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={pickImage} style={styles.avatarWrapper}>
          {/* 3. UPDATED KEY: Ensure the key is always a valid string */}
          <Image
            key={user.avatar_url || "default-avatar"}
            source={avatar}
            style={styles.avatarImage}
            onError={(e) =>
              console.log("IMAGE LOAD ERROR:", e.nativeEvent.error)
            } // <-- Add this line
          />
        </Pressable>

        <Text style={styles.emailText}>{email}</Text>

        <Text style={styles.sectionLabel}>Nickname</Text>
        <TextInput
          style={styles.input}
          value={nickname}
          onChangeText={setNickname}
          placeholder="Enter nickname"
          placeholderTextColor="rgba(255,255,255,0.3)"
        />

        <Text style={styles.sectionLabel}>Description</Text>
        <TextInput
          style={styles.descriptionBox}
          multiline
          value={description}
          onChangeText={setDescription}
          placeholder="Share a little about yourself..."
          placeholderTextColor="rgba(255,255,255,0.3)"
        />

        <Pressable onPress={handleSave} style={styles.saveButton}>
          {isSaving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.actionText}>Confirm Changes</Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => setLogoutVisible(true)}
          style={styles.logoutButton}
        >
          <Text style={styles.actionText}>Log out</Text>
        </Pressable>
      </ScrollView>

      <Modal transparent visible={logoutVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Log out of your account?</Text>
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setLogoutVisible(false)}
                style={styles.modalButton}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleLogout}
                style={[styles.modalButton, styles.modalButtonDanger]}
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
    flexGrow: 1,
    paddingBottom: 50,
  },
  avatarWrapper: { marginTop: 12, marginBottom: 18 },
  avatarImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
  emailText: { color: "rgba(255,255,255,0.5)", fontSize: 14, marginBottom: 24 },
  sectionLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    color: "#FFF",
    fontSize: 18,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    marginBottom: 16,
  },
  descriptionBox: {
    width: "100%",
    height: 90,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 12,
    color: "#FFFFFF",
    marginBottom: 24,
  },
  saveButton: {
    width: "100%",
    padding: 16,
    borderRadius: 24,
    backgroundColor: "#1E3A78",
    alignItems: "center",
    marginBottom: 12,
  },
  logoutButton: {
    width: "100%",
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#FFF",
    alignItems: "center",
  },
  actionText: { color: "#FFFFFF", fontWeight: "bold" },
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
  },
  modalButtonDanger: { borderColor: "rgba(209, 27, 27, 0.7)" },
  modalButtonText: { color: "#FFFFFF", fontSize: 13 },
});
