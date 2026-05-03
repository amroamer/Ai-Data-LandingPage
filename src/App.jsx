import BoldApp from "./App.bold";
import { useAuth } from "./context/AuthContext";

/**
 * Top-level shell rendered for the protected `/` route. Pulls the current
 * user from auth context and forwards it to the bold-theme landing page.
 *
 * Note: the legacy theme-switcher (bold vs minimal) was removed; this
 * component is now a thin pass-through preserved as a stable mount point
 * in case a theme switch is reintroduced.
 */
export default function App() {
  const { user } = useAuth();
  return <BoldApp user={user} />;
}
