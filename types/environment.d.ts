declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT?: string;
      RESEND_API_KEY: string;
      // Add other environment variables you're using
      [key: string]: string | undefined;
    }
  }
}

export {}; 