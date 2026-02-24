import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { User, Mail, Calendar, Shield, Save, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

import {
    useUpdateProfileMutation
} from "@/hooks/useData";

export default function ProfilePage() {
    const { user, profile, signOut } = useAuth();
    const [displayName, setDisplayName] = useState("");
    const { toast } = useToast();
    const navigate = useNavigate();
    const updateProfileMutation = useUpdateProfileMutation();

    useEffect(() => {
        if (profile) {
            setDisplayName(profile.display_name || "");
        }
    }, [profile]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        updateProfileMutation.mutate({ userId: user.id, display_name: displayName }, {
            onSuccess: () => toast({ title: "Profile updated successfully" }),
            onError: (err: any) => toast({ title: "Update failed", description: err.message, variant: "destructive" })
        });
    };

    const handleSignOut = async () => {
        await signOut();
        navigate("/");
    };

    if (!user) {
        return (
            <Layout>
                <div className="container py-20 text-center">
                    <h1 className="text-2xl font-bold">Please sign in</h1>
                    <p className="mt-2 text-muted-foreground">You need to be logged in to view your profile.</p>
                    <Button onClick={() => navigate("/auth")} className="mt-4">Sign In</Button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="container max-w-2xl py-12">
                <div className="mb-8 flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:gap-6 sm:text-left">
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-primary text-3xl font-bold text-primary-foreground shadow-elevated">
                        {profile?.display_name?.slice(0, 1).toUpperCase() || user.email?.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="font-display text-3xl font-bold text-foreground">{profile?.display_name || "Citizen"}</h1>
                        <p className="text-muted-foreground">{user.email}</p>
                    </div>
                </div>

                <div className="grid gap-8">
                    <section className="rounded-xl border border-border bg-card p-6 shadow-card">
                        <h2 className="mb-6 flex items-center gap-2 font-display text-xl font-bold text-foreground">
                            <User className="h-5 w-5 text-accent" />
                            Profile Details
                        </h2>
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="displayName">Display Name</Label>
                                <Input
                                    id="displayName"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="Your display name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input id="email" value={user.email} disabled className="pl-10 opacity-60" />
                                </div>
                                <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
                            </div>
                            <Button type="submit" disabled={updateProfileMutation.isPending} className="gap-2">
                                <Save className="h-4 w-4" />
                                {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                            </Button>
                        </form>
                    </section>

                    <section className="rounded-xl border border-border bg-card p-6 shadow-card">
                        <h2 className="mb-6 flex items-center gap-2 font-display text-xl font-bold text-foreground">
                            <Calendar className="h-5 w-5 text-accent" />
                            Account Info
                        </h2>
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between border-b border-border pb-2">
                                <span className="text-muted-foreground">Account Type</span>
                                <span className="flex items-center gap-1 font-medium capitalize">
                                    {profile?.role === 'admin' ? <Shield className="h-3 w-3 text-primary" /> : null}
                                    {profile?.role || 'User'}
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-border pb-2">
                                <span className="text-muted-foreground">Joined At</span>
                                <span className="font-medium">{new Date(user.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 shadow-card">
                        <h2 className="mb-4 text-lg font-bold text-destructive">Danger Zone</h2>
                        <p className="mb-4 text-sm text-muted-foreground">Once you sign out, you will need to enter your credentials again to access your account.</p>
                        <Button variant="destructive" onClick={handleSignOut} className="gap-2">
                            <LogOut className="h-4 w-4" />
                            Sign Out from all devices
                        </Button>
                    </section>
                </div>
            </div>
        </Layout>
    );
}
