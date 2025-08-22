import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { AuthClient } from "@dfinity/auth-client";

interface AuthContextType {
  isAuthenticated: boolean;
  identity: any | null;
  principal: string | null;
  login: () => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [identity, setIdentity] = useState<any | null>(null);
  const [principal, setPrincipal] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);

  useEffect(() => {
    // Initialize Internet Identity auth client
    const initAuth = async () => {
      try {
        const client = await AuthClient.create();
        setAuthClient(client);

        // Check if user is already authenticated
        if (await client.isAuthenticated()) {
          const currentIdentity = client.getIdentity();
          const currentPrincipal = currentIdentity.getPrincipal().toString();

          setIdentity(currentIdentity);
          setPrincipal(currentPrincipal);
          setIsAuthenticated(true);

          console.log(
            "User already authenticated with principal:",
            currentPrincipal
          );
        }
      } catch (error) {
        console.error("Error initializing auth client:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async () => {
    if (!authClient) {
      throw new Error("Auth client not initialized");
    }

    try {
      setIsLoading(true);

      // Start Internet Identity authentication
      await new Promise<void>((resolve, reject) => {
        authClient.login({
          identityProvider: "https://identity.ic0.app",
          onSuccess: () => {
            console.log("Internet Identity login successful");
            resolve();
          },
          onError: (error) => {
            console.error("Internet Identity login failed:", error);
            reject(error);
          },
        });
      });

      // Get the authenticated identity
      const currentIdentity = authClient.getIdentity();
      const currentPrincipal = currentIdentity.getPrincipal().toString();

      setIdentity(currentIdentity);
      setPrincipal(currentPrincipal);
      setIsAuthenticated(true);

      console.log("User authenticated with principal:", currentPrincipal);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (authClient) {
      await authClient.logout();
    }

    setIdentity(null);
    setPrincipal(null);
    setIsAuthenticated(false);
    console.log("User logged out");
  };

  const value: AuthContextType = {
    isAuthenticated,
    identity,
    principal,
    login,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
