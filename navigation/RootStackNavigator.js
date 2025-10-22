import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Tabnavigator from "./Tabnavigator";
import MovieDetailScreen from "../src/pages/TabPages/MovieDetailScreen";
const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabnavigator" component={Tabnavigator} />
      <Stack.Screen name="MovieDetail" component={MovieDetailScreen} />
      {/* You can add more screens here */}
    </Stack.Navigator>
  );
};

export default RootNavigator;
