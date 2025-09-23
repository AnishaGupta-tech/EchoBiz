import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Mic, MicOff, Volume2, Plus, Minus, Package } from "lucide-react";

interface Transaction {
  id: string;
  type: "credit" | "debit";
  amount: number;
  person: string;
  timestamp: Date;
}

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  action: "added" | "reduced";
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
  const [inventory, setInventory] = useState<InventoryItem[]>([
    {
      id: "1",
      name: "Atta",
      quantity: 10,
      action: "added",
      timestamp: new Date(Date.now() - 1800000)
    },
    {
      id: "2",
      name: "Rice",
      quantity: 5,
      action: "reduced",
      timestamp: new Date(Date.now() - 3600000)
    }
  ]);
  const [lastCommand, setLastCommand] = useState<string>("");
  const [manualAmount, setManualAmount] = useState("");
  const [manualPerson, setManualPerson] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemQuantity, setItemQuantity] = useState("");
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

  const analyzeVoiceCommand = (command: string) => {
  const creditKeywords = ["received", "got", "took", "liya", "liye", "credit", 
  "mila", "mile", "milaa", "paaya", "paaye", "paya", "paye", 
  "aaya", "aaye", "aya", "aye", "maine liya", "maine paya", "maine liye",
  "se liya", "se liye", "se paya", "se paye", "मिला", "लिया", "पाया", "आया"];

  const debitKeywords = ["paid", "gave", "diya", "debit", 
  "diye", "diyaa", "de diya", "payment", 
  "pay kiya", "pay kia", "ko diya", "ko diye",
  "दिया", "दिये", "पेमेंट", "पैमेंट"];

  const inventoryAddKeywords = ["add", "stock", "inventory", "product", "item",
    "add product", "stock me", "inventory me", "kharida", "kharidi", "kharidaa",
    "kharide", "buy", "buy kiya", "buy kia", "purchase", "bought", "purchased",
    "खरीदा", "खरीदी", "खरीदे", ];
  const inventoryReduceKeywords = ["reduce", "reduced", "sell", "sold", "remove", "removed",
    "becha", "beche", "kam", "nikala"];

  // Check for inventory commands first
  if (inventoryAddKeywords.some(word => command.toLowerCase().includes(word))) {
    handleInventoryCommand(command, "added");
    return;
  } else if (inventoryReduceKeywords.some(word => command.toLowerCase().includes(word))) {
    handleInventoryCommand(command, "reduced");
    return;
  }

  let type: "credit" | "debit" | null = null;
  if (creditKeywords.some(word => command.toLowerCase().includes(word))) {
    type = "credit";
  } else if (debitKeywords.some(word => command.toLowerCase().includes(word))) {
    type = "debit";
  }

  // Extract amount - look for numbers
  let amountMatch = command.match(/(\d+(\.\d+)?)/);
  let amount = amountMatch ? parseFloat(amountMatch[0]) : 500;

  // Extract person name - improved regex patterns
  let person = "Unknown";
  
  // Pattern 1: "from/se [name]" or "to/ko [name]"
  let personMatch1 = command.match(/(?:from|se|से)\s+([A-Za-z]+)/i);
  let personMatch2 = command.match(/(?:to|ko|को)\s+([A-Za-z]+)/i);
  
  // Pattern 2: "[name] se/ko" (name before se/ko)
  let personMatch3 = command.match(/([A-Za-z]+)\s+(?:se|ko|से|को)/i);
  
  // Pattern 4: Common sentence structures
  let personMatch4 = command.match(/maine\s+(?:\d+\s+)?(?:liya|paya|diya)\s+([A-Za-z]+)/i);
  let personMatch5 = command.match(/([A-Za-z]+)\s+(?:liya|paya|diya|को|से)/i);

  if (personMatch1) {
    person = personMatch1[1];
  } else if (personMatch2) {
    person = personMatch2[1];
  } else if (personMatch3) {
    person = personMatch3[1];
  } else if (personMatch4) {
    person = personMatch4[1];
  } else if (personMatch5) {
    person = personMatch5[1];
  }
  

  
  if (person !== "Unknown") {
    person = person.charAt(0).toUpperCase() + person.slice(1).toLowerCase();
  }

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
    // Debug: Show what was transcribed
    toast({
      title: "Unknown Command",
      description: `Error: Could not detect credit or debit action.`,
    });
  }
};

// ...rest of your code...



const handleInventoryCommand = (command: string, action: "added" | "reduced") => {
  // Extract quantity - look for numbers
  let quantityMatch = command.match(/(\d+)/);
  let quantity = quantityMatch ? parseInt(quantityMatch[0]) : 1;

  // Extract item name using multiple patterns
  let itemName = "Item";
  
  // Units to exclude from item names
  const excludeUnits = [
    "kg", "kilo", "kilogram", "किलो", "किलोग्राम",
    "gram", "grams", "ग्राम", "gm",
    "litre", "liter", "litres", "liters", "लीटर", "lt",
    "packet", "packets", "पैकेट", "pack",
    "bag", "bags", "बैग",
    "piece", "pieces", "पीस", "pc", "pcs",
    "bottle", "bottles", "बोतल",
    "box", "boxes", "बॉक्स"
  ];
  
  // Pattern 1: Common items detection (expanded list)
  const commonItems = [
    "atta", "flour", "wheat", "गेहूं", "आटा",
    "rice", "chawal", "चावल", "basmati", "बासमती",
    "dal", "daal", "lentil", "दाल", "arhar", "moong", "chana",
    "oil", "tel", "तेल", "mustard oil", "sunflower",
    "sugar", "cheeni", "चीनी", "gud", "गुड़", "jaggery",
    "tea", "chai", "चाय", "coffee", "कॉफी",
    "milk", "doodh", "दूध", "ghee", "घी",
    "onion", "pyaaz", "प्याज", "potato", "aloo", "आलू",
    "tomato", "tamatar", "टमाटर", "ginger", "adrak", "अदरक",
    "salt", "namak", "नमक", "spice", "masala", "मसाला",
    "bread", "roti", "रोटी", "biscuit", "बिस्किट"
  ];

  // Pattern 2: Direct item name extraction using various sentence structures
  
  // "add [quantity] [item]" or "[quantity] [item] add"
  let itemMatch1 = command.match(/(?:add|stock)\s+(?:\d+\s+)?([a-zA-Z\u0900-\u097F]+)/i);
  let itemMatch2 = command.match(/(\d+)\s+([a-zA-Z\u0900-\u097F]+)\s+(?:add|stock|kharida|kharide)/i);
  
  // "[item] [quantity] add/stock" or "maine [item] kharida"
  let itemMatch3 = command.match(/([a-zA-Z\u0900-\u097F]+)\s+\d+\s+(?:add|stock|kharida)/i);
  let itemMatch4 = command.match(/maine\s+([a-zA-Z\u0900-\u097F]+)\s+kharida/i);
  
  // "inventory me [item]" or "stock me [item]"
  let itemMatch5 = command.match(/(?:inventory|stock)\s+me\s+([a-zA-Z\u0900-\u097F]+)/i);
  
  // "[quantity] kg/packet/bag [item]" or "[item] [quantity] kg"
  let itemMatch6 = command.match(/\d+\s+(?:kg|packet|bag|किलो|पैकेट|बैग)\s+([a-zA-Z\u0900-\u097F]+)/i);
  let itemMatch7 = command.match(/([a-zA-Z\u0900-\u097F]+)\s+\d+\s+(?:kg|packet|bag|किलो|पैकेट|बैग)/i);

  // Function to check if extracted name is a unit
  const isUnit = (name: string) => {
    return excludeUnits.some(unit => name.toLowerCase() === unit.toLowerCase());
  };

  // Check extracted patterns and filter out units
  if (itemMatch1 && itemMatch1[1] && !isUnit(itemMatch1[1])) {
    itemName = itemMatch1[1];
  } else if (itemMatch2 && itemMatch2[2] && !isUnit(itemMatch2[2])) {
    itemName = itemMatch2[2];
  } else if (itemMatch3 && itemMatch3[1] && !isUnit(itemMatch3[1])) {
    itemName = itemMatch3[1];
  } else if (itemMatch4 && itemMatch4[1] && !isUnit(itemMatch4[1])) {
    itemName = itemMatch4[1];
  } else if (itemMatch5 && itemMatch5[1] && !isUnit(itemMatch5[1])) {
    itemName = itemMatch5[1];
  } else if (itemMatch6 && itemMatch6[1] && !isUnit(itemMatch6[1])) {
    itemName = itemMatch6[1];
  } else if (itemMatch7 && itemMatch7[1] && !isUnit(itemMatch7[1])) {
    itemName = itemMatch7[1];
  } else {
    // Fallback: Check for common items in the command (excluding units)
    const foundItem = commonItems.find(item => 
      command.toLowerCase().includes(item.toLowerCase()) && !isUnit(item)
    );
    if (foundItem) {
      itemName = foundItem;
    }
  }

  // Clean up and capitalize the item name
  itemName = itemName.replace(/[^\w\s\u0900-\u097F]/g, '').trim();
  
  // Final check to ensure we don't use a unit as item name
  if (itemName.length > 0 && !isUnit(itemName)) {
    itemName = itemName.charAt(0).toUpperCase() + itemName.slice(1).toLowerCase();
  } else {
    itemName = "Item"; // Final fallback if item name is empty or is a unit
  }

  const newInventoryItem: InventoryItem = {
    id: Date.now().toString(),
    name: itemName,
    quantity,
    action,
    timestamp: new Date()
  };

  setInventory(prev => [newInventoryItem, ...prev]);
  toast({
    title: action === "added" ? "📦 Stock Added" : "📤 Stock Reduced",
    description: `${quantity} ${itemName} ${action === "added" ? "added to" : "reduced from"} inventory`,
  });
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

  const changeStock = (action: "added" | "reduced") => {
    if (!itemName || !itemQuantity) {
      toast({
        title: "Missing Information",
        description: "Please enter both item name and quantity",
        variant: "destructive",
      });
      return;
    }

    const quantity = parseInt(itemQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid quantity",
        variant: "destructive",
      });
      return;
    }

    const newInventoryItem: InventoryItem = {
      id: Date.now().toString(),
      name: itemName,
      quantity,
      action,
      timestamp: new Date()
    };

    setInventory(prev => [newInventoryItem, ...prev]);
    setItemName("");
    setItemQuantity("");

    toast({
      title: action === "added" ? "📦 Stock Added" : "📤 Stock Reduced",
      description: `${quantity} ${itemName} ${action === "added" ? "added to" : "reduced from"} inventory`,
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
          "Add 10 atta to stock"
        ];
      case "hinglish":
        return [
          "Maine 500 liya Ramesh se",
          "500 diya Suresh ko",
          "10 rice stock me add kar"
        ];
      default:
        return [
          "I received 500 from Ramesh",
          "I paid 500 to Suresh",
          "Add 5 rice to inventory"
        ];
    }
  };

  return (
    <div className="min-h-screen bg-gradient-warm">
      {/* Header */}
      <div className="bg-card/50 backdrop-blur-sm border-b border-border/50 p-4">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
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

      <div className="max-w-6xl mx-auto p-4 space-y-6">
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

        {/* Manual Entry Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Manual Transaction Entry */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Add Transaction Manually</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
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

          {/* Change Stock Section */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Change Stock</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="itemName">Item Name</Label>
                  <Input
                    id="itemName"
                    placeholder="Enter item name"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="itemQuantity">Quantity</Label>
                  <Input
                    id="itemQuantity"
                    type="number"
                    placeholder="Enter quantity"
                    value={itemQuantity}
                    onChange={(e) => setItemQuantity(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => changeStock("added")}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Package className="h-4 w-4" />
                  Add Stock
                </Button>
                <Button
                  onClick={() => changeStock("reduced")}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Minus className="h-4 w-4" />
                  Reduce Stock
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* History Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

          {/* Inventory History */}
          <Card className="shadow-card">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Inventory History</h3>
              <div className="space-y-3">
                {inventory.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        item.action === "added" ? "bg-blue-600" : "bg-orange-600"
                      }`} />
                      <div>
                        <p className="font-medium">
                          {item.name} {item.action === "added" ? "added" : "reduced"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {item.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className={`text-lg font-semibold ${
                      item.action === "added" ? "text-blue-600" : "text-orange-600"
                    }`}>
                      {item.action === "added" ? "+" : "-"}{item.quantity}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;