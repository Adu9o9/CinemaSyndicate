import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Tabnavigator from "./Tabnavigator";
const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabnavigator" component={Tabnavigator} />
      {/* You can add more screens here */}
    </Stack.Navigator>
  );
};

export default RootNavigator;
