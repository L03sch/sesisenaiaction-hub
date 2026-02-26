import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { 
  Accessibility, 
  Eye, 
  EyeOff, 
  Type, 
  Palette, 
  MousePointer2,
  Volume2,
  X,
  Maximize2
} from "lucide-react";

interface AccessibilityButtonProps {
  sidebarOpen: boolean;
}

export function AccessibilityButton({ sidebarOpen }: AccessibilityButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [guideY, setGuideY] = useState(0);
  const ttsActiveRef = useRef(false);

  const [options, setOptions] = useState({
    highContrast: false,
    largeText: false,
    readingGuide: false,
    textToSpeech: false,
    reducedMotion: false,
    fontSize: [16],
    colorBlindMode: false,
  });

  // Alto Contraste
  useEffect(() => {
    document.documentElement.classList.toggle("high-contrast", options.highContrast);
  }, [options.highContrast]);

  // Texto Grande
  useEffect(() => {
    document.documentElement.classList.toggle("large-text", options.largeText);
  }, [options.largeText]);

  // Tamanho da Fonte
  useEffect(() => {
    document.documentElement.style.fontSize = `${options.fontSize[0]}px`;
  }, [options.fontSize]);

  // Reduzir Animações
  useEffect(() => {
    document.documentElement.classList.toggle("reduced-motion", options.reducedMotion);
  }, [options.reducedMotion]);

  // Modo Daltônico
  useEffect(() => {
    document.documentElement.classList.toggle("colorblind-mode", options.colorBlindMode);
  }, [options.colorBlindMode]);

  // Guia de Leitura — acompanha o mouse
  useEffect(() => {
    if (!options.readingGuide) return;
    const handleMouseMove = (e: MouseEvent) => setGuideY(e.clientY);
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [options.readingGuide]);

  // Texto para Fala — lê o texto do elemento clicado
  useEffect(() => {
    ttsActiveRef.current = options.textToSpeech;
    if (!options.textToSpeech) {
      window.speechSynthesis?.cancel();
      return;
    }
    const handleClick = (e: MouseEvent) => {
      if (!ttsActiveRef.current) return;
      const target = e.target as HTMLElement;
      const text = target.innerText?.trim() || target.textContent?.trim();
      if (!text) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "pt-BR";
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [options.textToSpeech]);

  return (
    <>
      {/* Filtro SVG para Modo Daltônico (deuteranopia) */}
      <svg aria-hidden style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          <filter id="colorblind-filter">
            <feColorMatrix type="matrix" values="
              0.625 0.375 0   0 0
              0.7   0.3   0   0 0
              0     0.3   0.7 0 0
              0     0     0   1 0"
            />
          </filter>
        </defs>
      </svg>

      {/* Botão fixo na sidebar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Opções de Acessibilidade"
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
          isOpen
            ? "bg-primary text-primary-foreground shadow-md"
            : "hover:bg-muted text-foreground"
        )}
      >
        <Accessibility className="w-5 h-5 flex-shrink-0" />
        {sidebarOpen && <span className="font-medium">Acessibilidade</span>}
      </button>

      {/* Guia de Leitura */}
      {options.readingGuide && (
        <div
          aria-hidden
          style={{
            position: "fixed",
            left: 0,
            top: guideY - 12,
            width: "100vw",
            height: 24,
            background: "rgba(255, 255, 0, 0.25)",
            borderTop: "1px solid rgba(255, 200, 0, 0.6)",
            borderBottom: "1px solid rgba(255, 200, 0, 0.6)",
            pointerEvents: "none",
            zIndex: 99999,
            transition: "top 0.05s linear",
          }}
        />
      )}

      {/* Painel de Acessibilidade */}
      {isOpen && (
        <div
          className="accessibility-menu"
          style={{
            position: 'fixed',
            left: sidebarOpen ? '272px' : '88px',
            bottom: '80px',
            zIndex: 9998,
            maxHeight: '80vh',
            overflow: 'auto',
          }}
        >
          <Card className="w-80 shadow-2xl border-2">
            <CardHeader className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 h-6 w-6"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <Accessibility className="h-6 w-6" />
                <CardTitle>Acessibilidade</CardTitle>
              </div>
              <CardDescription>
                Personalize sua experiência de navegação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Alto Contraste */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="high-contrast" className="cursor-pointer">
                    Alto Contraste
                  </Label>
                </div>
                <Switch
                  id="high-contrast"
                  checked={options.highContrast}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, highContrast: checked })
                  }
                />
              </div>

              {/* Texto Grande */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Maximize2 className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="large-text" className="cursor-pointer">
                    Texto Grande
                  </Label>
                </div>
                <Switch
                  id="large-text"
                  checked={options.largeText}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, largeText: checked })
                  }
                />
              </div>

              {/* Tamanho da Fonte */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Type className="h-4 w-4 text-muted-foreground" />
                    <Label>Tamanho da Fonte</Label>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {options.fontSize[0]}px
                  </span>
                </div>
                <Slider
                  value={options.fontSize}
                  onValueChange={(value) =>
                    setOptions({ ...options, fontSize: value })
                  }
                  min={12}
                  max={24}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Guia de Leitura */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="reading-guide" className="cursor-pointer">
                    Guia de Leitura
                  </Label>
                </div>
                <Switch
                  id="reading-guide"
                  checked={options.readingGuide}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, readingGuide: checked })
                  }
                />
              </div>

              {/* Texto para Fala */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="text-to-speech" className="cursor-pointer">
                    Texto para Fala
                  </Label>
                </div>
                <Switch
                  id="text-to-speech"
                  checked={options.textToSpeech}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, textToSpeech: checked })
                  }
                />
              </div>

              {/* Modo Daltônico */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="colorblind-mode" className="cursor-pointer">
                    Modo Daltônico
                  </Label>
                </div>
                <Switch
                  id="colorblind-mode"
                  checked={options.colorBlindMode}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, colorBlindMode: checked })
                  }
                />
              </div>

              {/* Movimento Reduzido */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MousePointer2 className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="reduced-motion" className="cursor-pointer">
                    Reduzir Animações
                  </Label>
                </div>
                <Switch
                  id="reduced-motion"
                  checked={options.reducedMotion}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, reducedMotion: checked })
                  }
                />
              </div>

              {/* Informação */}
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground text-center">
                  Personalize sua experiência de navegação
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
