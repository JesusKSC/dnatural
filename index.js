import { registerRootComponent } from "expo";
import { AuthProvider } from "./context/AuthContext";
import AuthNavigator from "./navigation/AuthNavigator";

function App() {
  return (
    <AuthProvider>
      <AuthNavigator />
    </AuthProvider>
  );
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
