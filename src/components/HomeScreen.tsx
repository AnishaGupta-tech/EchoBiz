import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Mic, MicOff, Volume2, Plus, Minus } from "lucide-react";

interface Transaction {
  id: string;
  type: "credit" | "debit";
  amount: number;
  person: string;
  timestamp: Date;
}

interface HomeScreenProps {
  language: string;
  onLogout: () => void;
}

const HomeScreen = ({ language, onLogout }: HomeScreenProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: "1",
      type: "credit",
      amount: 500,
      person: "Ramesh",
      timestamp: new Date(Date.now() - 3600000)
    },
    {
      id: "2",
      type: "debit",
      amount: 300,
      person: "Suresh",
      timestamp: new Date(Date.now() - 7200000)
    }
  ]);
  const [lastCommand, setLastCommand] = useState<string>("");
  const [manualAmount, setManualAmount] = useState("");
  const [manualPerson, setManualPerson] = useState("");
  const { toast } = useToast();
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setSpeechSupported(!!window.SpeechRecognition || !!window.webkitSpeechRecognition);
    // Clean up recognition on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onstart = null;
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  // Voice command handler with tap-to-stop support
  const handleVoiceCommand = () => {
    if (!speechSupported) {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser does not support voice commands.",
        variant: "destructive",
      });
      return;
    }

    // If already recording, stop recognition
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
      toast({
        title: "🎤 Listening...",
        description: "Speak your command now",
      });
    };

    recognition.onresult = (event: any) => {
      setIsRecording(false);
      recognitionRef.current = null;
      const transcript = event.results[0][0].transcript;
      setLastCommand(transcript);
      analyzeVoiceCommand(transcript);
    };

    recognition.onerror = (event: any) => {
      setIsRecording(false);
      recognitionRef.current = null;
      let description = event.error;
      if (event.error === "network") {
        description = "Speech recognition requires HTTPS. Please use a secure connection.";
      }
      toast({
        title: "Microphone Error",
        description,
        variant: "destructive",
      });
    };

    recognition.onend = () => {
      setIsRecording(false);
      recognitionRef.current = null;
    };

    recognition.start();
  };

  // Analyze the transcript for credit/debit terms and add transaction
  const analyzeVoiceCommand = (command: string) => {
    const creditKeywords = ["received", "got", "took", "liya", "credit"];
    const debitKeywords = ["paid", "gave", "diya", "debit"];

    let type: "credit" | "debit" | null = null;
    if (creditKeywords.some(word => command.toLowerCase().includes(word))) {
      type = "credit";
    } else if (debitKeywords.some(word => command.toLowerCase().includes(word))) {
      type = "debit";
    }

    // Try to extract amount and person from the command
    let amountMatch = command.match(/(\d+(\.\d+)?)/);
    let amount = amountMatch ? parseFloat(amountMatch[0]) : 500; // fallback to 500
    let personMatch = command.match(/(?:from|to|se|ko)\s+([A-Za-z]+)/i);
    let person = personMatch ? personMatch[1] : (type === "credit" ? "Ramesh" : "Suresh");

    if (type) {
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        type,
        amount,
        person,
        timestamp: new Date()
      };
      setTransactions(prev => [newTransaction, ...prev]);
      toast({
        title: type === "credit" ? "✅ Credit Added" : "💸 Payment Added",
        description: `₹${amount} ${type === "credit" ? "received from" : "paid to"} ${person}`,
      });
    } else {
      toast({
        title: "Unknown Command",
        description: `Could not detect credit or debit action.`,
      });
    }
  };

  const addManualTransaction = (type: "credit" | "debit") => {
    if (!manualAmount || !manualPerson) {
      toast({
        title: "Missing Information",
        description: "Please enter both amount and person name",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(manualAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type,
      amount,
      person: manualPerson,
      timestamp: new Date()
    };

    setTransactions(prev => [newTransaction, ...prev]);
    setManualAmount("");
    setManualPerson("");

    toast({
      title: type === "credit" ? "✅ Credit Added" : "💸 Payment Added",
      description: `₹${amount} ${type === "credit" ? "received from" : "paid to"} ${manualPerson}`,
    });
  };

  const getGreeting = () => {
    switch (language) {
      case "hi":
        return "नमस्ते! आज क्या काम है?";
      case "hinglish":
        return "Namaste! Aaj kya kaam hai?";
      default:
        return "Hello! What would you like to do today?";
    }
  };

  const getExampleCommands = () => {
    switch (language) {
      case "hi":
        return [
          "मैंने 500 लिया रमेश से",
          "500 दिया सुरेश को",
          "मुझे weekly report दिखाओ"
        ];
      case "hinglish":
        return [
          "Maine 500 liya Ramesh se",
          "500 diya Suresh ko",
          "Mujhe weekly report dikhao"
        ];
      default:
        return [
          "I received 500 from Ramesh",
          "I paid 500 to Suresh",
          "Show me weekly report"
        ];
    }
  };

  return (
    <div className="min-h-screen bg-gradient-warm">
      {/* Header */}
      <div className="bg-card/50 backdrop-blur-sm border-b border-border/50 p-4">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            EchoBiz
          </h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" onClick={onLogout} className="text-muted-foreground">
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Voice Command Section */}
        <Card className="shadow-card">
          <CardContent className="p-8 text-center space-y-6">
            <h2 className="text-2xl font-semibold">{getGreeting()}</h2>
            
            {/* Voice Button */}
            <div className="flex flex-col items-center space-y-4">
              <Button
                variant="voice"
                size="voice"
                onClick={handleVoiceCommand}
                className={`relative ${isRecording ? 'animate-pulse-custom duration-700' : ''}`}
              >
                {isRecording ? (
                  <MicOff className="!w-10 !h-10"/>
                ) : (
                  <Mic className="!w-10 !h-10"/>
                )}
              </Button>
              
              <p className="text-muted-foreground">
                {isRecording ? "Tap to stop recording" : "Tap to start voice command"}
              </p>
            </div>

            {/* Last Command */}
            {lastCommand && (
              <div className="bg-accent/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Volume2 className="h-4 w-4" />
                  Last command:
                </div>
                <p className="text-lg font-medium">"{lastCommand}"</p>
              </div>
            )}

            {/* Example Commands */}
            <div className="text-left max-w-md mx-auto">
              <h3 className="font-medium mb-3 text-center">Example Commands:</h3>
              <div className="space-y-2">
                {getExampleCommands().map((command, index) => (
                  <div key={index} className="bg-muted/50 rounded-lg p-3 text-sm">
                    "{command}"
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Manual Transaction Entry */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Add Transaction Manually</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="person">Person Name</Label>
                <Input
                  id="person"
                  placeholder="Enter person name"
                  value={manualPerson}
                  onChange={(e) => setManualPerson(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => addManualTransaction("credit")}
                className="flex items-center gap-2 bg-success hover:bg-success/90 text-success-foreground"
              >
                <Plus className="h-4 w-4" />
                Add Credit
              </Button>
              <Button
                onClick={() => addManualTransaction("debit")}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Minus className="h-4 w-4" />
                Add Debit
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="shadow-card">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4">Recent Transactions</h3>
            <div className="space-y-3">
              {transactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      transaction.type === "credit" ? "bg-success" : "bg-destructive"
                    }`} />
                    <div>
                      <p className="font-medium">
                        {transaction.type === "credit" ? "Received from" : "Paid to"} {transaction.person}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className={`text-lg font-semibold ${
                    transaction.type === "credit" ? "text-success" : "text-destructive"
                  }`}>
                    {transaction.type === "credit" ? "+" : "-"}₹{transaction.amount}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HomeScreen;