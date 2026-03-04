type AuthServiceResult = {
  success: boolean;
  error?: string;
};

function clearCookie(name: 'streamer_session' | 'moderator_session') {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export const authService = {
  async signOut(): Promise<AuthServiceResult> {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('streamer_session');
        window.localStorage.removeItem('moderator_session');
      }

      clearCookie('streamer_session');
      clearCookie('moderator_session');

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sign out',
      };
    }
  },
};
