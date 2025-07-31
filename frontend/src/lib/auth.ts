export interface AuthState {
  isAuthenticated: boolean;
  student: {
    id: string;
    urn: string;
    hasVoted: boolean;
  } | null;
}

export const getAuthState = (): AuthState => {
  if (typeof window === 'undefined') {
    return { isAuthenticated: false, student: null };
  }
  
  const stored = localStorage.getItem('aisa-auth');
  if (!stored) {
    return { isAuthenticated: false, student: null };
  }
  
  try {
    return JSON.parse(stored);
  } catch {
    return { isAuthenticated: false, student: null };
  }
};

export const setAuthState = (state: AuthState) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('aisa-auth', JSON.stringify(state));
  }
};

export const clearAuthState = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('aisa-auth');
  }
};
