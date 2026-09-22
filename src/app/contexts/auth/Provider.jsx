// Import Dependencies
import { useEffect, useReducer } from "react";
import PropTypes from "prop-types";

// Local Imports
import { httpClient } from "api/httpClient";
import { isTokenValid, setSession } from "utils/jwt";
import { AuthContext } from "./context";

// ----------------------------------------------------------------------

const initialState = {
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  errorMessage: null,
  user: null,
  // Connexion en 2 temps si la double authentification (OTP WhatsApp) est
  // active pour le compte — voir POST /auth/login et POST /auth/verify-otp.
  otpRequired: false,
  otpChallengeId: null,
};

const reducerHandlers = {
  INITIALIZE: (state, action) => {
    const { isAuthenticated, user } = action.payload;
    return {
      ...state,
      isAuthenticated,
      isInitialized: true,
      user,
    };
  },

  LOGIN_REQUEST: (state) => {
    return {
      ...state,
      isLoading: true,
      errorMessage: null,
    };
  },

  LOGIN_OTP_REQUIRED: (state, action) => {
    const { otpChallengeId } = action.payload;
    return {
      ...state,
      isLoading: false,
      otpRequired: true,
      otpChallengeId,
    };
  },

  LOGIN_SUCCESS: (state, action) => {
    const { user } = action.payload;
    return {
      ...state,
      isAuthenticated: true,
      isLoading: false,
      otpRequired: false,
      otpChallengeId: null,
      user,
    };
  },

  LOGIN_ERROR: (state, action) => {
    const { errorMessage } = action.payload;

    return {
      ...state,
      errorMessage,
      isLoading: false,
    };
  },

  LOGIN_RESET: (state) => ({
    ...state,
    isLoading: false,
    errorMessage: null,
    otpRequired: false,
    otpChallengeId: null,
  }),

  LOGOUT: (state) => ({
    ...state,
    isAuthenticated: false,
    user: null,
    otpRequired: false,
    otpChallengeId: null,
  }),
};

const reducer = (state, action) => {
  const handler = reducerHandlers[action.type];
  if (handler) {
    return handler(state, action);
  }
  return state;
};

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const init = async () => {
      try {
        const authToken = window.localStorage.getItem("authToken");

        if (authToken && isTokenValid(authToken)) {
          setSession(authToken);

          const { data: user } = await httpClient.get("/auth/me");

          dispatch({
            type: "INITIALIZE",
            payload: {
              isAuthenticated: true,
              user,
            },
          });
        } else {
          setSession(null);
          dispatch({
            type: "INITIALIZE",
            payload: {
              isAuthenticated: false,
              user: null,
            },
          });
        }
      } catch {
        setSession(null);
        dispatch({
          type: "INITIALIZE",
          payload: {
            isAuthenticated: false,
            user: null,
          },
        });
      }
    };

    init();
  }, []);

  // Etape 1 : telephone + mot de passe. Si le compte a la double
  // authentification active, le backend renvoie { otpRequired: true,
  // otpChallengeId } au lieu d'un jeton — voir verifyOtp ci-dessous.
  const login = async ({ phoneNumber, password }) => {
    dispatch({ type: "LOGIN_REQUEST" });

    try {
      const { data } = await httpClient.post("/auth/login", { phoneNumber, password });

      if (data.otpRequired) {
        dispatch({
          type: "LOGIN_OTP_REQUIRED",
          payload: { otpChallengeId: data.otpChallengeId },
        });
        return;
      }

      setSession(data.accessToken);
      dispatch({
        type: "LOGIN_SUCCESS",
        payload: { user: data.utilisateur },
      });
    } catch (err) {
      dispatch({
        type: "LOGIN_ERROR",
        payload: { errorMessage: err },
      });
    }
  };

  // Etape 2 (uniquement si otpRequired) : code recu par WhatsApp.
  const verifyOtp = async (code) => {
    dispatch({ type: "LOGIN_REQUEST" });

    try {
      const { data } = await httpClient.post("/auth/verify-otp", {
        otpChallengeId: state.otpChallengeId,
        code,
      });

      setSession(data.accessToken);
      dispatch({
        type: "LOGIN_SUCCESS",
        payload: { user: data.utilisateur },
      });
    } catch (err) {
      dispatch({
        type: "LOGIN_ERROR",
        payload: { errorMessage: err },
      });
    }
  };

  // Revenir a l'etape 1 (ex. bouton "Retour" sur l'ecran OTP).
  const resetLogin = () => dispatch({ type: "LOGIN_RESET" });

  const logout = async () => {
    setSession(null);
    dispatch({ type: "LOGOUT" });
  };

  if (!children) {
    return null;
  }

  return (
    <AuthContext
      value={{
        ...state,
        login,
        verifyOtp,
        resetLogin,
        logout,
      }}
    >
      {children}
    </AuthContext>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node,
};
