'use client'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from 'firebase/auth'
import { clientAuth } from '@/lib/firebase/client'

/**
 * Client-side auth context (spec §7.2). NOT mounted globally — individual
 * components (AuthMenu in the Navbar, SignOutButton, the sign-in forms)
 * wrap themselves in <AuthProvider> so pages opt in by using them.
 *
 * Firebase holds the browser-side identity; the httpOnly `__session`
 * cookie minted by /api/auth/session is what the server trusts. Every
 * sign-in path here must therefore also call establishSession().
 */

export const EMAIL_FOR_SIGNIN_KEY = 'agm-email-for-signin'
const SESSION_ESTABLISHED_KEY = 'agm-session-uid'

export type AuthUser = {
  uid: string
  email: string | null
  name: string | null
  photoURL: string | null
}

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  /** Google popup sign-in, then exchange the ID token for the session cookie. */
  signInWithGoogle: () => Promise<void>
  /** Email a passwordless sign-in link; remembers the email in localStorage. */
  sendMagicLink: (email: string) => Promise<void>
  /**
   * Re-mint the session cookie for the already-signed-in Firebase user.
   * No-op if this tab already established a session for the same uid.
   */
  refreshSession: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/** Exchange a Firebase ID token for the httpOnly __session cookie. */
export async function establishSession(firebaseUser: FirebaseUser): Promise<void> {
  const idToken = await firebaseUser.getIdToken()
  const response = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  })
  if (!response.ok) {
    throw new Error(`session_establish_failed:${response.status}`)
  }
  try {
    sessionStorage.setItem(SESSION_ESTABLISHED_KEY, firebaseUser.uid)
  } catch {
    // Private browsing — the cookie is set, only the dedupe flag is lost.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(clientAuth(), (firebaseUser) => {
      setUser(
        firebaseUser
          ? {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
            }
          : null
      )
      setLoading(false)
    })
  }, [])

  const signInWithGoogle = useCallback(async () => {
    const credential = await signInWithPopup(clientAuth(), new GoogleAuthProvider())
    await establishSession(credential.user)
  }, [])

  const sendMagicLink = useCallback(async (email: string) => {
    await sendSignInLinkToEmail(clientAuth(), email, {
      url: `${window.location.origin}/account/signin/finish`,
      handleCodeInApp: true,
    })
    try {
      window.localStorage.setItem(EMAIL_FOR_SIGNIN_KEY, email)
    } catch {
      // Private browsing — the finish page will prompt for the email instead.
    }
  }, [])

  const refreshSession = useCallback(async () => {
    const current = clientAuth().currentUser
    if (!current) throw new Error('not_signed_in')
    try {
      if (sessionStorage.getItem(SESSION_ESTABLISHED_KEY) === current.uid) return
    } catch {
      // Fall through and re-establish.
    }
    await establishSession(current)
  }, [])

  const signOut = useCallback(async () => {
    await firebaseSignOut(clientAuth())
    await fetch('/api/auth/session', { method: 'DELETE' })
    try {
      sessionStorage.removeItem(SESSION_ESTABLISHED_KEY)
    } catch {
      // Non-fatal.
    }
  }, [])

  const value = useMemo(
    () => ({ user, loading, signInWithGoogle, sendMagicLink, refreshSession, signOut }),
    [user, loading, signInWithGoogle, sendMagicLink, refreshSession, signOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return context
}
