import * as Haptics from "expo-haptics";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    AccessibilityInfo,
    Animated,
    Dimensions,
    FlatList,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { width, height } = Dimensions.get("window");
const ITEM_HEIGHT = 48;
const VISIBLE = 5;

function formatShortDateParts(date: Date) {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const y = String(date.getFullYear()).slice(-2);
  return `${m}/${d}/${y}`;
}

export default function BottomSheetDatePicker({
  visible,
  initialDate,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  initialDate?: Date;
  onCancel: () => void;
  onConfirm: (shortDate: string) => void;
}) {
  const months = useMemo(
    () => [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    [],
  );

  const currentYear = new Date().getFullYear();
  const YEARS = useMemo(() => Array.from({ length: 121 }, (_, i) => currentYear - i), [currentYear]);

  const init = initialDate ?? new Date(currentYear - 20, 0, 1);
  const [selMonth, setSelMonth] = useState(init.getMonth());
  const [selDay, setSelDay] = useState(init.getDate());
  const [selYear, setSelYear] = useState(init.getFullYear());

  const monthRef = useRef<FlatList<any> | null>(null);
  const dayRef = useRef<FlatList<any> | null>(null);
  const yearRef = useRef<FlatList<any> | null>(null);

  const sheetAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(sheetAnim, { toValue: 1, duration: 240, useNativeDriver: true }).start();
      // scroll lists after small delay
      setTimeout(() => {
        monthRef.current?.scrollToOffset({ offset: selMonth * ITEM_HEIGHT, animated: false });
        dayRef.current?.scrollToOffset({ offset: Math.max(0, selDay - 1) * ITEM_HEIGHT, animated: false });
        const yi = YEARS.indexOf(selYear);
        if (yi >= 0) yearRef.current?.scrollToOffset({ offset: yi * ITEM_HEIGHT, animated: false });
      }, 60);
    } else {
      Animated.timing(sheetAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start();
    }
  }, [visible]);

  useEffect(() => {
    if (initialDate) {
      setSelMonth(initialDate.getMonth());
      setSelDay(initialDate.getDate());
      setSelYear(initialDate.getFullYear());
    }
  }, [initialDate]);

  const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();

  const confirm = () => {
    const chosen = new Date(selYear, selMonth, selDay);
    onConfirm(formatShortDateParts(chosen));
    AccessibilityInfo.announceForAccessibility("Birthday set");
  };

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onCancel} />
        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ translateY: sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [400, 0] }) }] },
          ]}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={onCancel}>
              <Text style={styles.action}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Select birthdate</Text>
            <TouchableOpacity onPress={confirm}>
              <Text style={styles.action}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <FlatList
              ref={monthRef}
              data={months}
              keyExtractor={(_, i) => String(i)}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              contentContainerStyle={{ paddingTop: (ITEM_HEIGHT * (VISIBLE - 1)) / 2, paddingBottom: (ITEM_HEIGHT * (VISIBLE - 1)) / 2 }}
              renderItem={({ item, index }) => (
                <View style={styles.item}>
                  <Text style={[styles.itemText, index === selMonth && styles.activeText]}>{item}</Text>
                </View>
              )}
              onMomentumScrollEnd={(ev) => {
                const idx = Math.round(ev.nativeEvent.contentOffset.y / ITEM_HEIGHT);
                setSelMonth(Math.min(Math.max(0, idx), 11));
                try { Haptics.selectionAsync(); } catch (e) {}
              }}
              getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
            />

            <FlatList
              ref={dayRef}
              data={Array.from({ length: daysInMonth(selYear, selMonth) }, (_, i) => i + 1)}
              keyExtractor={(d) => String(d)}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              contentContainerStyle={{ paddingTop: (ITEM_HEIGHT * (VISIBLE - 1)) / 2, paddingBottom: (ITEM_HEIGHT * (VISIBLE - 1)) / 2 }}
              renderItem={({ item }) => (
                <View style={styles.item}>
                  <Text style={[styles.itemText, item === selDay && styles.activeText]}>{String(item)}</Text>
                </View>
              )}
              onMomentumScrollEnd={(ev) => {
                const idx = Math.round(ev.nativeEvent.contentOffset.y / ITEM_HEIGHT);
                const day = Math.min(Math.max(1, idx + 1), daysInMonth(selYear, selMonth));
                setSelDay(day);
                try { Haptics.selectionAsync(); } catch (e) {}
              }}
              getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
            />

            <FlatList
              ref={yearRef}
              data={YEARS}
              keyExtractor={(y) => String(y)}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              contentContainerStyle={{ paddingTop: (ITEM_HEIGHT * (VISIBLE - 1)) / 2, paddingBottom: (ITEM_HEIGHT * (VISIBLE - 1)) / 2 }}
              renderItem={({ item }) => (
                <View style={styles.item}>
                  <Text style={[styles.itemText, item === selYear && styles.activeText]}>{String(item)}</Text>
                </View>
              )}
              onMomentumScrollEnd={(ev) => {
                const idx = Math.round(ev.nativeEvent.contentOffset.y / ITEM_HEIGHT);
                const selected = YEARS[Math.max(0, Math.min(YEARS.length - 1, idx))];
                setSelYear(selected);
                try { Haptics.selectionAsync(); } catch (e) {}
              }}
              getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: { backgroundColor: "#061322", borderTopLeftRadius: 12, borderTopRightRadius: 12, height: 320 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12 },
  title: { color: "#fff", fontFamily: Platform.OS === "ios" ? "Georgia" : "serif" },
  action: { color: "#AEE7FF", fontFamily: "monospace", fontSize: 16 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", flex: 1, paddingBottom: 16 },
  item: { height: ITEM_HEIGHT, alignItems: "center", justifyContent: "center" },
  itemText: { color: "#BFDFF2", fontFamily: "monospace" },
  activeText: { color: "#E1F2FF", fontSize: 18 },
});
