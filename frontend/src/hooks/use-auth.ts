"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { getToken, setToken, removeToken, isAuthenticated } from "@/lib/auth";
import type { User, LoginRequest, RegisterRequest } from "@/lib/types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    if (!isAuthenticated()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const u = await api.getMe();
      setUser(u);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (data: LoginRequest) => {
    const res = await api.login(data);
    setToken(res.access_token);
    await loadUser();
  };

  const register = async (data: RegisterRequest) => {
    const res = await api.register(data);
    setToken(res.access_token);
    await loadUser();
  };

  const logout = () => {
    removeToken();
    setUser(null);
  };

  return { user, loading, login, register, logout, isAuthenticated: isAuthenticated() };
}
