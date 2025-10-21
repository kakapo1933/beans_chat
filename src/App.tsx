import { useEffect, useState } from "react";
import { useUserStore } from "./stores/useUserStore";
import SetupScreen from "./components/SetupScreen";
import ChatInterface from "./components/ChatInterface";
import { getDisplayName } from "./services/tauri";

function App() {
  const [loading, setLoading] = useState(true);
  const { displayName, setDisplayName } = useUserStore();

  useEffect(() => {
    // Load display name on app mount
    getDisplayName()
      .then((name) => {
        if (name) {
          setDisplayName(name);
        }
      })
      .finally(() => setLoading(false));
  }, [setDisplayName]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!displayName) {
    return <SetupScreen />;
  }

  return <ChatInterface />;
}

export default App;
