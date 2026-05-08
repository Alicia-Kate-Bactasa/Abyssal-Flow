import { View, Text } from "react-native";

export default function PlaceholderScreen() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#04122B",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: "white" }}>Page Coming Soon</Text>
    </View>
  );
}
