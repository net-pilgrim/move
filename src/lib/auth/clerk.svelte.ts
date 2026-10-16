import { Clerk } from '@clerk/clerk-js';

export interface UserProfile {
  id: string;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  imageUrl: string | null;
}

class AuthService {
  private clerkInstance: Clerk | null = null;
  public isLoaded = $state(false);
  public isConfigured = $state(false);
  public isSignedIn = $state(false);
  public user = $state<UserProfile | null>(null);
  public error = $state<string | null>(null);

  async init(): Promise<void> {
    const pubKey = (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined)?.trim();

    if (!pubKey || pubKey === 'pk_test_replace_with_your_clerk_key' || !pubKey.startsWith('pk_')) {
      // Running in guest/demo mode without Clerk publishable key configured
      this.isConfigured = false;
      this.isLoaded = true;
      return;
    }

    try {
      this.isConfigured = true;
      this.clerkInstance = new Clerk(pubKey);
      await this.clerkInstance.load({
        appearance: {
          variables: {
            colorPrimary: '#6366f1',
            colorBackground: '#0f172a',
            colorText: '#f8fafc',
            colorTextSecondary: '#94a3b8',
            colorInputBackground: '#020617',
            colorInputText: '#f8fafc'
          }
        }
      });

      this.clerkInstance.addListener(({ user, session }) => {
        this.updateState(user, Boolean(session));
      });

      this.updateState(this.clerkInstance.user, Boolean(this.clerkInstance.session));
      this.isLoaded = true;
    } catch (err: any) {
      console.error('[Clerk] Failed to load Clerk:', err);
      this.error = err?.message || 'Failed to initialize authentication';
      this.isLoaded = true;
    }
  }

  private updateState(rawUser: any, isSessionActive: boolean) {
    this.isSignedIn = isSessionActive && Boolean(rawUser);
    if (this.isSignedIn && rawUser) {
      this.user = {
        id: rawUser.id,
        fullName: rawUser.fullName || `${rawUser.firstName || ''} ${rawUser.lastName || ''}`.trim() || null,
        firstName: rawUser.firstName || null,
        lastName: rawUser.lastName || null,
        email: rawUser.primaryEmailAddress?.emailAddress || null,
        imageUrl: rawUser.imageUrl || null
      };
    } else {
      this.user = null;
    }
  }

  openSignIn() {
    if (this.clerkInstance && this.isConfigured) {
      this.clerkInstance.openSignIn();
    }
  }

  openSignUp() {
    if (this.clerkInstance && this.isConfigured) {
      this.clerkInstance.openSignUp();
    }
  }

  async signOut() {
    if (this.clerkInstance && this.isConfigured) {
      await this.clerkInstance.signOut();
      this.isSignedIn = false;
      this.user = null;
    }
  }

  mountUserButton(node: HTMLDivElement) {
    if (this.clerkInstance && this.isSignedIn) {
      this.clerkInstance.mountUserButton(node);
    }

    return {
      destroy: () => {
        if (this.clerkInstance) {
          try {
            this.clerkInstance.unmountUserButton(node);
          } catch {
            // ignore unmount errors on teardown
          }
        }
      }
    };
  }
}

export const auth = new AuthService();
