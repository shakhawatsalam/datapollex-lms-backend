/**
 * Global type declarations for Express
 */
declare global {
  namespace Express {
    interface Request {
      user: { id: string; role: string } | null;
    }
  }
}

// Ensure the module is recognized
export {};
