import React, { useState } from 'react';
import { useTheme, hexToRgb, rgbToHex } from '../contexts/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Palette, RotateCcw, Save, Eye } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const ThemeSettings: React.FC = () => {
  const { colors, updateColors, resetToDefault } = useTheme();
  const { toast } = useToast();
  
  const [primaryColor, setPrimaryColor] = useState(rgbToHex(colors.primary));
  const [secondaryColor, setSecondaryColor] = useState(rgbToHex(colors.secondary));
  const [accentColor, setAccentColor] = useState(rgbToHex(colors.accent));

  const handleSave = () => {
    const newColors = {
      primary: hexToRgb(primaryColor),
      secondary: hexToRgb(secondaryColor),
      accent: hexToRgb(accentColor)
    };
    
    updateColors(newColors);
    toast({
      title: "Theme Updated",
      description: "Your custom theme colors have been saved and applied.",
    });
  };

  const handleReset = () => {
    resetToDefault();
    setPrimaryColor('#8427d7');
    setSecondaryColor('#A7A9AC');
    setAccentColor('#DCDDDE');
    toast({
      title: "Theme Reset",
      description: "Theme has been reset to default colors.",
    });
  };

  const ColorPicker: React.FC<{
    label: string;
    value: string;
    onChange: (value: string) => void;
    description: string;
    usage: string;
  }> = ({ label, value, onChange, description, usage }) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <Badge variant="secondary" className="text-xs">{usage}</Badge>
      </div>
      <div className="flex items-center gap-3">
        <div 
          className="w-12 h-12 rounded-lg border-2 border-gray-200 cursor-pointer relative overflow-hidden"
          style={{ backgroundColor: value }}
        >
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <div className="flex-1">
          <input
            type="text"
            value={value.toUpperCase()}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="#FFFFFF"
          />
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Palette className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-gray-900">Theme Settings</h1>
          </div>
          <p className="text-gray-600">
            Customize the color scheme for your CargoFlow platform. Changes will be applied to all public pages.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Color Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Color Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <ColorPicker
                label="Primary Color"
                value={primaryColor}
                onChange={setPrimaryColor}
                description="Main brand color used for headers, buttons, and primary elements"
                usage="60% usage"
              />
              
              <ColorPicker
                label="Secondary Color"
                value={secondaryColor}
                onChange={setSecondaryColor}
                description="Supporting color for text, borders, and secondary elements"
                usage="30% usage"
              />
              
              <ColorPicker
                label="Accent Color"
                value={accentColor}
                onChange={setAccentColor}
                description="Accent color for highlights, backgrounds, and subtle elements"
                usage="10% usage"
              />

              <div className="flex gap-3 pt-4">
                <Button onClick={handleSave} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  Save Theme
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Live Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Live Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Preview Elements */}
              <div className="space-y-4">
                <div className="p-4 rounded-lg" style={{ backgroundColor: `rgb(${hexToRgb(primaryColor)})` }}>
                  <h3 className="text-white font-semibold">Primary Color Preview</h3>
                  <p className="text-white/90 text-sm">Headers, buttons, and main brand elements</p>
                </div>
                
                <div className="p-4 rounded-lg border" style={{ backgroundColor: `rgb(${hexToRgb(accentColor)})` }}>
                  <h3 className="font-semibold" style={{ color: `rgb(${hexToRgb(primaryColor)})` }}>
                    Secondary & Accent Preview
                  </h3>
                  <p className="text-sm" style={{ color: `rgb(${hexToRgb(secondaryColor)})` }}>
                    Background and text elements combination
                  </p>
                </div>

                <div className="flex gap-2">
                  <button 
                    className="px-4 py-2 rounded text-white font-medium text-sm transition-colors"
                    style={{ 
                      backgroundColor: `rgb(${hexToRgb(primaryColor)})`,
                    }}
                  >
                    Primary Button
                  </button>
                  <button 
                    className="px-4 py-2 rounded border font-medium text-sm transition-colors"
                    style={{ 
                      borderColor: `rgb(${hexToRgb(primaryColor)})`,
                      color: `rgb(${hexToRgb(primaryColor)})`
                    }}
                  >
                    Secondary Button
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Color Values</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>Primary: {primaryColor.toUpperCase()}</div>
                  <div>Secondary: {secondaryColor.toUpperCase()}</div>
                  <div>Accent: {accentColor.toUpperCase()}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Usage Guide */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Theme Application Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold text-primary mb-2">Primary Color (60%)</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Hero section backgrounds</li>
                  <li>• Main navigation elements</li>
                  <li>• Primary buttons</li>
                  <li>• Section headers</li>
                  <li>• Feature card icons</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-secondary mb-2">Secondary Color (30%)</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Body text</li>
                  <li>• Descriptions</li>
                  <li>• Subheadings</li>
                  <li>• Card content</li>
                  <li>• Supporting elements</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-accent mb-2">Accent Color (10%)</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Section backgrounds</li>
                  <li>• Card backgrounds</li>
                  <li>• Subtle highlights</li>
                  <li>• Secondary buttons</li>
                  <li>• Pricing sections</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ThemeSettings;