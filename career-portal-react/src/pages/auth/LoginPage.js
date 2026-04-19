import { GoogleOAuthProvider } from "@react-oauth/google";
import Login from "./Login";
import { useGoogleAuthClientId } from "./useGoogleAuthClientId";

function LoginPage() {
  const { effectiveClientId, loadingRemote } = useGoogleAuthClientId();

  const login = (
    <Login
      googleClientId={effectiveClientId}
      googleConfigLoading={loadingRemote}
    />
  );

  if (effectiveClientId) {
    return (
      <GoogleOAuthProvider clientId={effectiveClientId}>
        {login}
      </GoogleOAuthProvider>
    );
  }

  return login;
}

export default LoginPage;
