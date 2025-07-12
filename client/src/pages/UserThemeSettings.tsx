import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useUserTheme } from "@/contexts/UserThemeContext";
import { Palette, Save, RotateCcw, Upload, Image } from "lucide-react";

export default function UserThemeSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { themeSettings, updateTheme, isLoading: themeLoading } = useUserTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Initialize logo preview from existing theme settings
  useEffect(() => {
    if (themeSettings.logoUrl && !logoPreview) {
      setLogoPreview(themeSettings.logoUrl);
    }
  }, [themeSettings.logoUrl]);

  // Only allow access for user dashboard users
  if (!user || user.role === 'admin') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Access Restricted</h2>
          <p className="text-muted-foreground">User theme settings are only available for user dashboard accounts.</p>
        </div>
      </div>
    );
  }

  const handleColorChange = (colorType: 'primaryColor' | 'secondaryColor' | 'accentColor', value: string) => {
    updateTheme({ [colorType]: value });
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateTheme(themeSettings);
      toast({
        title: "Theme Updated",
        description: "Your theme settings have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save theme settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    const defaultSettings = {
      primaryColor: "#3094d1",
      secondaryColor: "#3195d1",
      accentColor: "#3296d1",
      logoUrl: null
    };
    updateTheme(defaultSettings);
    setLogoPreview(null);
  };

  const handleLogoUpload = async (file: File) => {
    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await fetch('/api/user/theme/logo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload logo');
      }

      const result = await response.json();
      
      // Update theme with new logo URL
      updateTheme({ logoUrl: result.logoUrl });
      setLogoPreview(result.logoUrl);
      
      toast({
        title: "Logo Updated",
        description: "Your dashboard logo has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File",
          description: "Please select a valid image file.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      // Show preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload the file
      handleLogoUpload(file);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Palette className="h-6 w-6" />
          Theme Settings
        </h1>
        <p className="text-muted-foreground">Customize your dashboard colors and appearance</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dashboard Logo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden">
                {(logoPreview || themeSettings.logoUrl) ? (
                  <img 
                    src={logoPreview || themeSettings.logoUrl || ''} 
                    alt="Dashboard Logo" 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center">
                    <Image className="w-8 h-8 mx-auto text-gray-400 mb-1" />
                    <p className="text-xs text-gray-500">No Logo</p>
                  </div>
                )}
              </div>
              
              <div className="flex-1 space-y-2">
                <label className="block text-sm font-medium">Custom Dashboard Logo</label>
                <p className="text-sm text-gray-500">Upload your own logo to replace "CargoFlow" in the dashboard sidebar. Recommended size: 120x40px</p>
                
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="logo-upload"
                    disabled={isUploadingLogo}
                  />
                  <label
                    htmlFor="logo-upload"
                    className={`inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer ${
                      isUploadingLogo ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    {isUploadingLogo ? 'Uploading...' : 'Upload Logo'}
                  </label>
                  
                  {(logoPreview || themeSettings.logoUrl) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        updateTheme({ logoUrl: null });
                        setLogoPreview(null);
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove Logo
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Color Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <label className="text-sm font-medium">Primary Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={themeSettings.primaryColor}
                  onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                  className="w-12 h-12 rounded border cursor-pointer"
                />
                <div className="flex-1">
                  <input
                    type="text"
                    value={themeSettings.primaryColor}
                    onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="#f43f5e"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Secondary Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={themeSettings.secondaryColor}
                  onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                  className="w-12 h-12 rounded border cursor-pointer"
                />
                <div className="flex-1">
                  <input
                    type="text"
                    value={themeSettings.secondaryColor}
                    onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="#64748b"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Accent Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={themeSettings.accentColor}
                  onChange={(e) => handleColorChange('accentColor', e.target.value)}
                  className="w-12 h-12 rounded border cursor-pointer"
                />
                <div className="flex-1">
                  <input
                    type="text"
                    value={themeSettings.accentColor}
                    onChange={(e) => handleColorChange('accentColor', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="#fbbf24"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to Default
            </Button>

            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 rounded-lg border" style={{ backgroundColor: themeSettings.primaryColor + '20', borderColor: themeSettings.primaryColor }}>
              <h3 className="font-semibold" style={{ color: themeSettings.primaryColor }}>Primary Color Preview</h3>
              <p className="text-sm opacity-75">This is how your primary color will appear in buttons and highlights</p>
            </div>
            
            <div className="p-4 rounded-lg border" style={{ backgroundColor: themeSettings.secondaryColor + '20', borderColor: themeSettings.secondaryColor }}>
              <h3 className="font-semibold" style={{ color: themeSettings.secondaryColor }}>Secondary Color Preview</h3>
              <p className="text-sm opacity-75">This color will be used for secondary elements and text</p>
            </div>
            
            <div className="p-4 rounded-lg border" style={{ backgroundColor: themeSettings.accentColor + '20', borderColor: themeSettings.accentColor }}>
              <h3 className="font-semibold" style={{ color: themeSettings.accentColor }}>Accent Color Preview</h3>
              <p className="text-sm opacity-75">This color will be used for accents and special highlights</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}