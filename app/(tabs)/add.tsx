import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useCycleData } from "@/hooks/use-cycle-store";

export default function AddCycleScreen() {
  const router = useRouter();
  const { logNewCycle } = useCycleData();

  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [saving, setSaving] = useState(false);

  const markToday = () => {
    const iso = new Date().toISOString().slice(0, 10);
    setStart(iso);
    setEnd(iso);
  };

  const handleSubmit = async () => {
    if (!start) {
      Alert.alert("Please enter a start date (YYYY-MM-DD) or tap Today");
      return;
    }
    setSaving(true);
    try {
      await logNewCycle(start, end || start);
      router.back();
    } catch (err) {
      Alert.alert("Save failed", "Could not save cycle. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log New Cycle</Text>

      <Text style={styles.label}>Start date (YYYY-MM-DD)</Text>
      <TextInput
        style={styles.input}
        value={start}
        onChangeText={setStart}
        placeholder="2026-04-12"
        placeholderTextColor="rgba(255,255,255,0.4)"
      />

      <Text style={styles.label}>End date (optional)</Text>
      <TextInput
        style={styles.input}
        value={end}
        onChangeText={setEnd}
        placeholder="2026-04-14"
        placeholderTextColor="rgba(255,255,255,0.4)"
      />

      <View style={styles.row}>
        <Pressable onPress={markToday} style={styles.linkButton}>
          <Text style={styles.linkText}>Mark Today</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            setStart("");
            setEnd("");
          }}
          style={styles.linkButton}
        >
          <Text style={styles.linkText}>Clear</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={handleSubmit}
        style={[styles.saveButton, saving && styles.disabled]}
        disabled={saving}
      >
        <Text style={styles.saveText}>
          {saving ? "Saving..." : "Save Cycle"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#04122B",
    padding: 20,
    paddingTop: 80,
  },
  title: { color: "#FFF", fontSize: 20, marginBottom: 20 },
  label: { color: "rgba(255,255,255,0.8)", marginTop: 12 },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 0.6,
    borderColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    color: "#FFF",
    marginTop: 6,
  },
  row: { flexDirection: "row", gap: 12, marginTop: 12 },
  linkButton: { paddingVertical: 8, paddingHorizontal: 12 },
  linkText: { color: "#6DB4D8" },
  saveButton: {
    marginTop: 24,
    backgroundColor: "#6DB4D8",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  saveText: { color: "#04202F", fontWeight: "700" },
  disabled: { opacity: 0.6 },
});
