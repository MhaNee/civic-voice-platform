import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

export function useHearings() {
    const queryClient = useQueryClient();
    return useQuery({
        queryKey: ["hearings"],
        queryFn: async (): Promise<Tables<"hearings">[]> => {
            const { data, error } = await supabase
                .from("hearings")
                .select("*")
                .order("scheduled_at", { ascending: false });
            if (error) throw error;
            return data;
        },
    });
}

export function useCreateHearingMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (newHearing: any) => {
            const { error } = await supabase.from("hearings").insert([newHearing]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["hearings"] });
        },
    });
}

export function useUpdateHearingMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            const { error } = await supabase
                .from("hearings")
                .update({ status })
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["hearings"] });
        },
    });
}

export function useDeleteHearingMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("hearings").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["hearings"] });
        },
    });
}

export function useUpdateProfileMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ userId, display_name }: { userId: string; display_name: string }) => {
            const { error } = await supabase
                .from("profiles")
                .update({ display_name })
                .eq("user_id", userId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["profiles"] });
        },
    });
}

export function useUpdateRoleMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
            const { error } = await supabase
                .from("profiles")
                .update({ role })
                .eq("user_id", userId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["profiles"] });
        },
    });
}

export function useUpdateAnnouncementMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
            const { error } = await supabase
                .from("announcements")
                .update({ is_published })
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["announcements"] });
        },
    });
}

export function useDeleteAnnouncementMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("announcements").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["announcements"] });
        },
    });
}

export function useCreateAnnouncementMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (newAnnouncement: any) => {
            const { error } = await supabase.from("announcements").insert([newAnnouncement]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["announcements"] });
        },
    });
}

export function useAnnouncements(onlyPublished = true) {
    return useQuery({
        queryKey: ["announcements", onlyPublished],
        queryFn: async (): Promise<Tables<"announcements">[]> => {
            let query = supabase
                .from("announcements")
                .select("*")
                .order("created_at", { ascending: false });

            if (onlyPublished) {
                query = query.eq("is_published", true);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data as Tables<"announcements">[];
        },
    });
}

export function useProfiles() {
    return useQuery({
        queryKey: ["profiles"],
        queryFn: async (): Promise<Tables<"profiles">[]> => {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .order("created_at", { ascending: false });
            if (error) throw error;
            return data;
        },
    });
}

// pull all comments so admin can compute per-user stats or re-run sentiment
export function useComments() {
    const queryClient = useQueryClient();
    return useQuery({
        queryKey: ["comments"],
        queryFn: async (): Promise<Tables<"comments">[]> => {
            const { data, error } = await supabase.from("comments").select("*");
            if (error) throw error;
            return data;
        },
    });
}

export function useDeleteProfileMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (userId: string) => {
            // try to remove the auth user via edge function; requires service role key
            try {
                const { error: funcErr } = await supabase.functions.invoke("delete-user", {
                    body: { userId },
                });
                if (funcErr) throw funcErr;
            } catch (e) {
                // ignore; we'll still attempt to remove profile row
                console.warn("delete-user function failed", e);
            }

            const { error } = await supabase
                .from("profiles")
                .delete()
                .eq("user_id", userId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["profiles"] });
            queryClient.invalidateQueries({ queryKey: ["comments"] });
        },
    });
}

export function useRecalculateSentimentMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (userId: string) => {
            // fetch the user's comments
            const { data: comments, error: fetchError } = await supabase
                .from("comments")
                .select("id, text")
                .eq("user_id", userId);
            if (fetchError) throw fetchError;
            if (!comments) return;

            for (const c of comments) {
                try {
                    const { data: ai } = await supabase.functions.invoke("analyze-sentiment", {
                        body: { text: c.text, type: "sentiment" },
                    });
                    if (ai?.sentiment) {
                        await supabase
                            .from("comments")
                            .update({
                                sentiment: ai.sentiment,
                                sentiment_confidence: ai.confidence,
                            })
                            .eq("id", c.id);
                    }
                } catch (e) {
                    // ignore individual errors
                    console.error("reanalyze comment failed", c.id, e);
                }
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["comments"] });
        },
    });
}
