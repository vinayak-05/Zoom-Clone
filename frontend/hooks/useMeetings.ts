"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import type { Meeting, MeetingCreateInstant, MeetingCreateScheduled } from "../lib/types";

export function useMeetings(initialFilter: "upcoming" | "recent" | "all" = "upcoming") {
  const [filter, setFilter] = useState<"upcoming" | "recent" | "all">(initialFilter);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMeetings(filter);
      setMeetings(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load meetings.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const createInstant = async (options?: MeetingCreateInstant) => {
    try {
      const res = await api.createInstantMeeting(options);
      return res;
    } catch (err) {
      throw err;
    }
  };

  const schedule = async (data: MeetingCreateScheduled) => {
    try {
      const res = await api.createScheduledMeeting(data);
      await fetchMeetings();
      return res;
    } catch (err) {
      throw err;
    }
  };

  const cancel = async (id: number) => {
    try {
      await api.cancelMeeting(id);
      await fetchMeetings();
    } catch (err) {
      throw err;
    }
  };

  return {
    meetings,
    loading,
    error,
    filter,
    setFilter,
    refresh: fetchMeetings,
    createInstant,
    schedule,
    cancel,
  };
}
