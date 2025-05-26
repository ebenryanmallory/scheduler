declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT?: string;
      // Add other environment variables you're using
      [key: string]: string | undefined;
    }
  }
}

export {}; 