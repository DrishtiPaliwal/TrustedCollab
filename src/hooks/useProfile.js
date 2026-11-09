import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { fetchOne } from "@/lib/helpers";

export default function useProfile() {
  const { user } = useAuth();
  const [state, setState] = useState({ creatorProfile: null, brandProfile: null, loading: true });

  const load = useCallback(async () => {
    if (!user?.id) {
      setState({ creatorProfile: null, brandProfile: null, loading: false });
      return;
    }
    const [creatorProfile, brandProfile] = await Promise.all([
      fetchOne("CreatorProfile", { user_id: user.id }),
      fetchOne("BrandProfile", { user_id: user.id }),
    ]);
    setState({ creatorProfile, brandProfile, loading: false });
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  return { user, ...state, refresh: load };
}