import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface LanguageSelectorProps {
  onLanguageSelect: (language: string) => void;
}

const LanguageSelector = ({ onLanguageSelect }: LanguageSelectorProps) => {
  const languages = [
    {
      code: "hi",
      name: "हिंदी",
      description: "Hindi",
      flag: "🇮🇳"
    },
    {
      code: "en",
      name: "English",
      description: "English",
      flag: "🇬🇧"
    },
    {
      code: "hinglish",
      name: "Hinglish",
      description: "Hindi + English Mix",
      flag: "🇮🇳"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-warm flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Choose Your Language</CardTitle>
          <CardDescription>Select your preferred language for voice commands</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {languages.map((language) => (
            <Button
              key={language.code}
              variant="outline"
              className="w-full h-16 flex items-center justify-between text-left hover:bg-accent/50 transition-all"
              onClick={() => onLanguageSelect(language.code)}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{language.flag}</span>
                <div>
                  <div className="font-semibold text-lg">{language.name}</div>
                  <div className="text-sm text-muted-foreground">{language.description}</div>
                </div>
              </div>
              <div className="text-primary">→</div>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default LanguageSelector;