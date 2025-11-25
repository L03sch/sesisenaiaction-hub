import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
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

export function AccessibilityButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 100, y: 100 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);

  // Opções de acessibilidade (sem funcionalidade ainda)
  const [options, setOptions] = useState({
    highContrast: false,
    largeText: false,
    readingGuide: false,
    textToSpeech: false,
    reducedMotion: false,
    fontSize: [16],
    colorBlindMode: false,
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.accessibility-menu')) {
      return; // Não arrastar se clicar no menu
    }
    
    setIsDragging(true);
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Limitar às bordas da janela
      const maxX = window.innerWidth - 80;
      const maxY = window.innerHeight - 80;
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, dragOffset]);

  return (
    <>
      {/* Botão Flutuante */}
      <div
        ref={buttonRef}
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          zIndex: 9999,
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onMouseDown={handleMouseDown}
      >
        <Button
          size="icon"
          className="h-16 w-16 rounded-full shadow-2xl bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-110"
          onClick={() => !isDragging && setIsOpen(!isOpen)}
          title="Opções de Acessibilidade"
        >
          <Accessibility className="h-8 w-8" />
        </Button>
      </div>

      {/* Menu de Acessibilidade */}
      {isOpen && (
        <div
          className="accessibility-menu"
          style={{
            position: 'fixed',
            left: position.x > window.innerWidth / 2 ? `${position.x - 320}px` : `${position.x + 80}px`,
            top: `${position.y}px`,
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
                  Arraste o botão de acessibilidade para movê-lo pela tela
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
