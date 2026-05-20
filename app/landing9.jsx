import WaveBackground from "@/components/WaveBackground";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { height } = Dimensions.get("window");

const ITEM_HEIGHT = 32;
const VISIBLE_ITEMS = 7;

// Numbers 21-45 + "im not sure"
const CYCLE_OPTIONS = [
  ...Array.from({ length: 25 }, (_, i) => String(21 + i)),
  "im not sure",
];

const DEFAULT = "28";

export default function Landing9() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams();
  const [selected, setSelected] = useState(DEFAULT);
  const flatListRef = useRef(null);

  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(24)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const pickerOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(150, [
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(titleY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(pickerOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Scroll to default value
    const defaultIndex = CYCLE_OPTIONS.indexOf(DEFAULT);
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({
        index: defaultIndex,
        animated: false,
      });
    }, 100);
  }, []);

  const renderItem = ({ item }) => {
    const isSelected = item === selected;
    return (
      <TouchableOpacity
        style={[styles.item, isSelected && styles.itemSelected]}
        onPress={() => setSelected(item)}
        activeOpacity={0.7}
      >
        <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>
          {item}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient
      colors={["#041539", "#26466D"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradient}
    >
      <StatusBar barStyle="light-content" />

      {/* ── Background ── */}
      <WaveBackground />

      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.innerContainer}>
        {/* ── Content ── */}
        <View style={styles.content}>
          {/* Title */}
          <Animated.Text
            style={[
              styles.title,
              { opacity: titleOpacity, transform: [{ translateY: titleY }] },
            ]}
          >
            Cycle Length
          </Animated.Text>

          {/* Subtitle */}
          <Animated.Text
            style={[styles.subtitle, { opacity: subtitleOpacity }]}
          >
            On average, how many days are there from the start of one period to
            the start of the next?
          </Animated.Text>

          {/* Picker */}
          <Animated.View
            style={[styles.pickerWrapper, { opacity: pickerOpacity }]}
          >
            {/* Highlight bar */}
            <View style={styles.selectionHighlight} pointerEvents="none" />

            <FlatList
              ref={flatListRef}
              data={CYCLE_OPTIONS}
              keyExtractor={(item) => item}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              style={styles.flatList}
              contentContainerStyle={styles.flatListContent}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              getItemLayout={(_, index) => ({
                length: ITEM_HEIGHT,
                offset: ITEM_HEIGHT * index,
                index,
              })}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(
                  e.nativeEvent.contentOffset.y / ITEM_HEIGHT,
                );
                if (CYCLE_OPTIONS[index]) setSelected(CYCLE_OPTIONS[index]);
              }}
            />
          </Animated.View>
        </View>

        {/* ── Next Button ── */}
        <Animated.View
          style={[styles.buttonContainer, { opacity: buttonOpacity }]}
        >
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              router.push({
                pathname: "/landing10",
                params: { ...params, cycleLength: selected },
              });
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    justifyContent: "space-between",
  },
  backButton: {
    position: "absolute",
    top: 60,
    left: 16,
    zIndex: 10,
    padding: 8,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
    paddingTop: height * 0.08,
  },
  title: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 27,
    lineHeight: 44,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.7,
    color: "#E1F2FF",
    textAlign: "center",
    marginBottom: 32,
    paddingHorizontal: 10,
  },

  // Picker
  pickerWrapper: {
    width: 200,
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    justifyContent: "center",
    alignItems: "center",
  },
  selectionHighlight: {
    position: "absolute",
    top: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    backgroundColor: "rgba(113, 113, 113, 0.25)",
    borderRadius: 8,
    zIndex: 1,
  },
  flatList: {
    width: "100%",
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
  },
  flatListContent: {
    paddingVertical: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  itemText: {
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
    fontSize: 13,
    letterSpacing: 0.7,
    color: "rgba(225, 242, 255, 0.45)",
    fontWeight: "400",
  },
  itemTextSelected: {
    color: "#E1F2FF",
    fontWeight: "600",
    fontSize: 15,
  },

  // Button
  buttonContainer: {
    alignItems: "center",
    paddingBottom: height * 0.09,
  },
  button: {
    backgroundColor: "#001242",
    borderRadius: 50,
    width: 206,
    height: 47,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6DB4D8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
});
