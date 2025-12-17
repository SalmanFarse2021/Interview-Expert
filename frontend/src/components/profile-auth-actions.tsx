"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export function ProfileAuthActions() {
  const { data: session, status } = useSession();
  const [syncState, setSyncState] = useState<null | "pending" | "synced" | "error">(null);
  const [syncMessage, setSyncMessage] = useState<string>("");

  const statusText = useMemo(() => {
    if (status === "loading") return "Checking status...";
    if (session?.user?.email) return `Signed in as ${session.user.email}`;
    return "Not signed in";
  }, [session?.user?.email, status]);

  useEffect(() => {
    const syncUser = async () => {
      if (!session?.user?.email) return;
      setSyncState("pending");
      try {
        const res = await fetch(`${API_BASE_URL}/api/users/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: session.user.email,
            name: session.user.name,
            image: session.user.image,
          }),
        });
        if (!res.ok) throw new Error("Failed to sync");
        const data = await res.json();
        setSyncState("synced");
        setSyncMessage(
          data.status === "created" ? "Welcome aboard! Profile saved." : "Welcome back! Profile updated."
        );
      } catch (err) {
        console.error(err);
        setSyncState("error");
        setSyncMessage("Could not sync profile. Using session-only mode.");
      }
    };
    syncUser();
  }, [session?.user?.email, session?.user?.name, session?.user?.image]);

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">{statusText}</p>
      <div className="flex flex-wrap gap-3">
        {session ? (
          <button className="btn-secondary" onClick={() => signOut()}>
            Sign out
          </button>
        ) : (
          <>
            <button
              className="btn-primary"
              onClick={() => signIn("google", { callbackUrl: "/profile" })}
            >
              Sign in with Google
            </button>
            <button
              className="btn-secondary"
              onClick={() => signIn("google", { callbackUrl: "/profile" })}
            >
              Continue with Google
            </button>
          </>
        )}
      </div>
      {syncState && (
        <p
          className={`text-xs ${
            syncState === "error" ? "text-amber-700" : "text-emerald-700"
          }`}
        >
          {syncMessage ||
            (syncState === "pending"
              ? "Syncing profile..."
              : "Profile ready.")}
        </p>
      )}
      <p className="text-xs text-slate-500">
        Login is optional. Signing in saves your history and preferences; using
        the app without logging in won’t persist data across visits.
      </p>
    </div>
  );
}
