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

// Validate that a string is a real YYYY-MM-DD calendar date.
function parseIsoDate(raw: string): Date | null {
  const trimmed = raw.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const [y, m, d] = trimmed.split("-").map(Number);
  // Use local-time constructor — avoids UTC-midnight timezone shift.
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) {
    return null; // e.g. Feb 30
  }
  return dt;
}

export default function AddCycleScreen() {
  const router = useRouter();
  const { logNewCycle, periodDates } = useCycleData();

  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [saving, setSaving] = useState(false);

  const markToday = () => {
    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    setStart(iso);
    setEnd(iso);
  };

  const handleSubmit = async () => {
    // ── Validate start ──────────────────────────────────────────────────────
    const startDate = parseIsoDate(start);
    if (!startDate) {
      Alert.alert(
        "Invalid start date",
        "Enter a date in YYYY-MM-DD format, e.g. 2026-05-01",
      );
      return;
    }

    // ── Validate end (optional) ────────────────────────────────────────────
    let endDate: Date = startDate;
    if (end.trim()) {
      const parsed = parseIsoDate(end);
      if (!parsed) {
        Alert.alert(
          "Invalid end date",
          "Enter a date in YYYY-MM-DD format, e.g. 2026-05-05",
        );
        return;
      }
      if (parsed.getTime() < startDate.getTime()) {
        Alert.alert(
          "Invalid range",
          "End date must be on or after start date.",
        );
        return;
      }
      endDate = parsed;
    }

    // ── Warn if existing data will be replaced ─────────────────────────────
    // logNewCycle deletes all previous rows before inserting the new one,
    // so we give the user a heads-up when there is already data in the store.
    const hasExisting = Object.keys(periodDates).length > 0;

    const doSave = async () => {
      setSaving(true);
      try {
        // Pass Date objects so logNewCycle's local-time toIso helper is used.
        await logNewCycle(startDate, endDate);
        router.back();
      } catch {
        Alert.alert("Save failed", "Could not save cycle. Please try again.");
      } finally {
        setSaving(false);
      }
    };

    if (hasExisting) {
      Alert.alert(
        "Replace existing cycle?",
        "Saving will remove your previously logged dates and replace them with this new range.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Replace", style: "destructive", onPress: doSave },
        ],
      );
    } else {
      await doSave();
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
        keyboardType="numeric"
      />

      <Text style={styles.label}>End date (optional)</Text>
      <TextInput
        style={styles.input}
        value={end}
        onChangeText={setEnd}
        placeholder="2026-04-14"
        placeholderTextColor="rgba(255,255,255,0.4)"
        keyboardType="numeric"
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
