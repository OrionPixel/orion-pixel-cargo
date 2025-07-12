import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useSuperAdminTheme } from "@/contexts/SuperAdminThemeContext";
import { Palette, Monitor, Sun, Moon, Save, RotateCcw, Upload, Image } from "lucide-react";

export default function AdminThemeSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { themeSettings, updateTheme, isLoading } = useSuperAdminTheme();
  
  const [localSettings, setLocalSettings] = useState({
    primaryColor: themeSettings.primaryColor || "#3b82f6",
    secondaryColor: themeSettings.secondaryColor || "#64748b",
    accentColor: themeSettings.accentColor || "#8b5cf6",
    theme: themeSettings.theme || "light"
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Update local settings when theme settings change
  useEffect(() => {
    setLocalSettings({
      primaryColor: themeSettings.primaryColor || "#3b82f6",
      secondaryColor: themeSettings.secondaryColor || "#64748b", 
      accentColor: themeSettings.accentColor || "#8b5cf6",
      theme: themeSettings.theme || "light"
    });
  }, [themeSettings]);

  const [isSaving, setIsSaving] = useState(false);

  // Logo upload functions
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // File validation - allow PNG, JPG, GIF, SVG
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please select a PNG, JPG, GIF, or SVG image file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large", 
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingLogo(true);

    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await fetch('/api/admin/upload-logo', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      // Update theme with new logo URL
      updateTheme({ logoUrl: result.logoUrl } as any);
      setLogoPreview(result.logoUrl);

      toast({
        title: "Logo Updated",
        description: `Website logo uploaded successfully. Format: ${file.type.split('/')[1].toUpperCase()}`,
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

  const handleRemoveLogo = () => {
    updateTheme({ logoUrl: null } as any);
    setLogoPreview(null);
    toast({
      title: "Logo Removed",
      description: "Website logo has been removed.",
    });
  };

  const handleSave = async () => {
    console.log('💾 Save button clicked! Local settings:', localSettings);
    setIsSaving(true);
    
    try {
      const response = await fetch("/api/admin/theme-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(localSettings),
        credentials: "include"
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to update theme settings: ${errorData}`);
      }
      
      const data = await response.json();
      updateTheme(data);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/theme-settings"] });
      
      toast({
        title: "Success",
        description: "Super Admin theme settings updated successfully",
      });
    } catch (error: any) {
      console.error("Theme update error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update theme settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleColorChange = (key: string, value: string) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    // Apply theme immediately for preview
    updateTheme(newSettings);
  };

  const handleReset = async () => {
    const defaultSettings = {
      primaryColor: "#3b82f6",
      secondaryColor: "#64748b", 
      accentColor: "#8b5cf6",
      theme: "light" as const
    };
    setLocalSettings(defaultSettings);
    
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/theme-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(defaultSettings),
        credentials: "include"
      });
      
      if (response.ok) {
        const data = await response.json();
        updateTheme(data);
        queryClient.invalidateQueries({ queryKey: ["/api/admin/theme-settings"] });
        toast({
          title: "Success",
          description: "Theme reset to default settings",
        });
      }
    } catch (error) {
      console.error("Reset error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = 
    localSettings.primaryColor !== (themeSettings.primaryColor || "#3b82f6") ||
    localSettings.secondaryColor !== (themeSettings.secondaryColor || "#64748b") ||
    localSettings.accentColor !== (themeSettings.accentColor || "#8b5cf6") ||
    localSettings.theme !== (themeSettings.theme || "light");

  console.log('Theme changes debug:', {
    localSettings,
    themeSettings,
    hasChanges,
    isSaving
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Super Admin Theme Settings</h1>
        <p className="text-muted-foreground">
          Customize the global theme for landing pages and admin dashboard
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Color Scheme
            </CardTitle>
            <CardDescription>
              Set the primary, secondary, and accent colors for the landing website and admin dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="primary">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primary"
                  type="color"
                  value={localSettings.primaryColor}
                  onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  value={localSettings.primaryColor}
                  onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary">Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="secondary"
                  type="color"
                  value={localSettings.secondaryColor}
                  onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  value={localSettings.secondaryColor}
                  onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                  placeholder="#64748b"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accent">Accent Color</Label>
              <div className="flex gap-2">
                <Input
                  id="accent"
                  type="color"
                  value={localSettings.accentColor}
                  onChange={(e) => handleColorChange('accentColor', e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  value={localSettings.accentColor}
                  onChange={(e) => handleColorChange('accentColor', e.target.value)}
                  placeholder="#8b5cf6"
                  className="flex-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Theme Mode
            </CardTitle>
            <CardDescription>
              Choose between light and dark theme for the admin interface
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Default Theme</Label>
              <Select
                value={localSettings.theme}
                onValueChange={(value: "light" | "dark") => 
                  setLocalSettings(prev => ({ ...prev, theme: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      Light Theme
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      Dark Theme
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4 border-t">
              <div className="space-y-3">
                <div className="text-sm font-medium">Preview Colors</div>
                <div className="flex gap-2">
                  <div 
                    className="w-12 h-12 rounded border shadow-sm"
                    style={{ backgroundColor: localSettings.primaryColor }}
                    title="Primary"
                  />
                  <div 
                    className="w-12 h-12 rounded border shadow-sm"
                    style={{ backgroundColor: localSettings.secondaryColor }}
                    title="Secondary"
                  />
                  <div 
                    className="w-12 h-12 rounded border shadow-sm"
                    style={{ backgroundColor: localSettings.accentColor }}
                    title="Accent"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Theme Scope</CardTitle>
          <CardDescription>
            These settings control the appearance of:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium text-green-600">Landing Website</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Home page</li>
                <li>• About page</li>
                <li>• Features page</li>
                <li>• Pricing page</li>
                <li>• Contact page</li>
                <li>• Sign-in page</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-blue-600">Admin Dashboard</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Admin dashboard</li>
                <li>• User management</li>
                <li>• Analytics & reports</li>
                <li>• System settings</li>
                <li>• Support center</li>
                <li>• Theme settings</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Global Website Logo
          </CardTitle>
          <CardDescription>
            Upload a custom logo to replace "LogiGoFast" across all public pages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden">
                {(logoPreview || (themeSettings as any)?.logoUrl) ? (
                  <img 
                    src={logoPreview || (themeSettings as any)?.logoUrl || ''} 
                    alt="Website Logo" 
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
                <label className="block text-sm font-medium">Custom Website Logo</label>
                <p className="text-sm text-gray-500">Upload your logo to replace "LogiGoFast" on all public pages. Recommended size: 200x60px</p>
                
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*,.svg"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="global-logo-upload"
                    disabled={isUploadingLogo}
                  />
                  <label
                    htmlFor="global-logo-upload"
                    className={`inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer ${
                      isUploadingLogo ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    {isUploadingLogo ? 'Uploading...' : 'Upload Logo'}
                  </label>
                  
                  {(logoPreview || (themeSettings as any)?.logoUrl) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveLogo}
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

      <div className="flex gap-3">
        <Button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
        
        <Button 
          variant="outline"
          onClick={handleReset}
          disabled={isSaving}
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Reset to Default
        </Button>
      </div>
    </div>
  );
}