import { useCallback, useEffect, useState } from "react";

export function useCollection(loader, deps = []) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const nextData = await loader();
      setData(nextData);
    } catch (err) {
      setError(err?.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, setData, loading, error, reload: load };
}
