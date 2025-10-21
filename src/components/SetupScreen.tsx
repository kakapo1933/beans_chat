import { useState } from "react";
import { useUserStore } from "../stores/useUserStore";
import { saveDisplayName } from "../services/tauri";

export default function SetupScreen() {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setDisplayName } = useUserStore();

  const validateDisplayName = (name: string): string | null => {
    const trimmed = name.trim();

    if (trimmed.length < 2) {
      return "Display name must be at least 2 characters";
    }

    if (trimmed.length > 20) {
      return "Display name must be at most 20 characters";
    }

    // Allow letters, numbers, spaces, hyphens, and underscores
    const validPattern = /^[a-zA-Z0-9 _-]+$/;
    if (!validPattern.test(trimmed)) {
      return "Display name can only contain letters, numbers, spaces, hyphens, and underscores";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validationError = validateDisplayName(input);
    if (validationError) {
      setError(validationError);
      return;
    }

    const trimmed = input.trim();
    setLoading(true);

    try {
      await saveDisplayName(trimmed);
      setDisplayName(trimmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save display name");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    // Clear error on input change
    if (error) setError("");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to Beans Chat</h1>
          <p className="text-gray-600">Choose a display name to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Enter your name"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                error
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              disabled={loading}
              autoFocus
              maxLength={20}
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
            <p className="mt-2 text-xs text-gray-500">
              2-20 characters: letters, numbers, spaces, hyphens, underscores
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Saving..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
