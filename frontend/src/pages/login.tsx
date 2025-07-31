import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { setAuthState } from "@/lib/auth";
import { GraduationCap, Vote, Loader2 } from "lucide-react";

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [urn, setUrn] = useState("");
  const [motherName, setMotherName] = useState("");
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (data: { urn: string; motherName: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setAuthState({
          isAuthenticated: true,
          student: data.student,
        });
        toast({
          title: "Authentication Successful",
          description: `Welcome, ${data.student.urn}!`,
        });
        onLoginSuccess();
      } else {
        toast({
          title: "Authentication Failed",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Authentication Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urn || !motherName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate({ urn, motherName });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-aisa-blue rounded-full flex items-center justify-center mb-4">
            <Vote className="text-white" size={24} />
          </div>
          <h2 className="text-2xl font-bold text-aisa-navy mb-2" data-testid="login-title">
            AISA Elections 2025
          </h2>
          <p className="text-gray-600 text-sm" data-testid="login-subtitle">
            Enter your credentials to vote
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="auth-form">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="urn" className="block text-sm font-medium text-gray-700 mb-2">
                    University Roll Number (URN)
                  </Label>
                  <Input
                    id="urn"
                    type="text"
                    value={urn}
                    onChange={(e) => setUrn(e.target.value)}
                    placeholder="e.g., 230910XX"
                    className="w-full h-12 text-lg"
                    data-testid="input-urn"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="motherName" className="block text-sm font-medium text-gray-700 mb-2">
                    Mother's Name
                  </Label>
                  <Input
                    id="motherName"
                    type="text"
                    value={motherName}
                    onChange={(e) => setMotherName(e.target.value)}
                    placeholder="Enter mother's first name"
                    className="w-full h-12 text-lg"
                    data-testid="input-mother-name"
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-aisa-blue hover:bg-aisa-navy h-12 text-lg font-semibold"
                disabled={loginMutation.isPending}
                data-testid="button-authenticate"
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <GraduationCap className="mr-2 h-5 w-5" />
                    Login & Vote
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
