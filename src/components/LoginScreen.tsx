import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen = ({ onLogin }: LoginScreenProps) => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit phone number",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setStep("otp");
      toast({
        title: "OTP Sent!",
        description: `Verification code sent to +91${phone}`,
      });
    }, 1500);
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit verification code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Welcome!",
        description: "Login successful",
      });
      onLogin();
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-warm flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            EchoBiz
          </CardTitle>
          <CardDescription className="text-lg">
            {step === "phone" ? "Enter your phone number to continue" : "Enter the verification code"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === "phone" ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Phone Number</label>
                <div className="flex">
                  <div className="flex items-center px-3 bg-muted rounded-l-md border border-r-0 border-input">
                    <span className="text-sm font-medium">+91</span>
                  </div>
                  <Input
                    type="tel"
                    placeholder="Enter 10-digit number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="rounded-l-none"
                    disabled={loading}
                  />
                </div>
              </div>
              <Button 
                onClick={handleSendOTP}
                disabled={loading || !phone}
                className="w-full"
                size="lg"
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Verification Code</label>
                <Input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-lg tracking-widest"
                  disabled={loading}
                />
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={() => setStep("phone")}
                  disabled={loading}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleVerifyOTP}
                  disabled={loading || !otp}
                  className="flex-1"
                  size="lg"
                >
                  {loading ? "Verifying..." : "Verify"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginScreen;