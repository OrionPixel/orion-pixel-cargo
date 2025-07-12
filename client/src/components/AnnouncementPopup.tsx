import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  Info, 
  AlertTriangle, 
  CheckCircle, 
  AlertCircle, 
  Calendar, 
  Clock 
} from "lucide-react";

interface Announcement {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  priority: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface AnnouncementPopupProps {
  onClose?: () => void;
}

export default function AnnouncementPopup({ onClose }: AnnouncementPopupProps) {
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<number[]>(() => {
    const stored = localStorage.getItem('dismissedAnnouncements');
    return stored ? JSON.parse(stored) : [];
  });

  const { data: announcements = [] } = useQuery({
    queryKey: ['/api/announcements/active'],
    enabled: true,
  });

  console.log('🔍 ANNOUNCEMENT POPUP DEBUG:', { 
    announcements,
    announcementsLength: announcements.length,
    dismissedAnnouncements 
  });

  // Filter out dismissed announcements and only show active ones
  const activeAnnouncements = announcements.filter((announcement: Announcement) => {
    const now = new Date();
    const startDate = new Date(announcement.startDate);
    const endDate = new Date(announcement.endDate);
    const isTimeValid = now >= startDate && now <= endDate;
    const isNotDismissed = !dismissedAnnouncements.includes(announcement.id);
    
    return announcement.isActive && isTimeValid && isNotDismissed;
  });

  console.log('📢 ACTIVE ANNOUNCEMENTS:', { 
    activeAnnouncements, 
    activeLength: activeAnnouncements.length,
    isOpen 
  });

  useEffect(() => {
    console.log('🔄 USEEFFECT TRIGGERED - activeAnnouncements.length:', activeAnnouncements.length);
    
    if (activeAnnouncements.length > 0 && !isOpen) {
      console.log('🚀 SETTING POPUP TO OPEN - Active announcements found:', activeAnnouncements.length);
      setTimeout(() => {
        setIsOpen(true);
        console.log('⚡ IMMEDIATELY SET isOpen to true');
      }, 500);
    } else if (activeAnnouncements.length === 0) {
      console.log('❌ NO ACTIVE ANNOUNCEMENTS - Not showing popup');
      setIsOpen(false);
    }
  }, [activeAnnouncements.length]); // Removed isOpen dependency to prevent loop

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'success':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      default:
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    }
  };

  const handleClose = () => {
    console.log('🔴 HANDLE CLOSE CLICKED - Setting isOpen to false');
    
    // Check if there are more announcements to show
    if (currentAnnouncementIndex < activeAnnouncements.length - 1) {
      // Move to next announcement
      setCurrentAnnouncementIndex(currentAnnouncementIndex + 1);
    } else {
      // No more announcements, close the popup
      setIsOpen(false);
      onClose?.();
    }
  };

  const handleDismiss = () => {
    const currentAnnouncement = activeAnnouncements[currentAnnouncementIndex];
    if (currentAnnouncement) {
      const newDismissed = [...dismissedAnnouncements, currentAnnouncement.id];
      setDismissedAnnouncements(newDismissed);
      localStorage.setItem('dismissedAnnouncements', JSON.stringify(newDismissed));
    }
    
    // Filter out the dismissed announcement and check remaining
    const remainingAnnouncements = activeAnnouncements.filter(
      (_, index) => index !== currentAnnouncementIndex
    );
    
    if (remainingAnnouncements.length > 0) {
      // Reset index to 0 for remaining announcements and keep popup open
      setCurrentAnnouncementIndex(0);
      // Force a small delay to ensure UI updates properly
      setTimeout(() => {
        setIsOpen(true);
      }, 100);
    } else {
      handleClose();
    }
  };

  const handleNext = () => {
    if (currentAnnouncementIndex < activeAnnouncements.length - 1) {
      setCurrentAnnouncementIndex(currentAnnouncementIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentAnnouncementIndex > 0) {
      setCurrentAnnouncementIndex(currentAnnouncementIndex - 1);
    }
  };

  console.log('🎯 RENDER CHECK:', {
    hasAnnouncements: activeAnnouncements.length > 0,
    isOpen,
    shouldRender: activeAnnouncements.length > 0 && isOpen,
    currentIndex: currentAnnouncementIndex
  });

  if (!activeAnnouncements.length) {
    console.log('❌ NOT RENDERING: No announcements');
    return null;
  }

  if (!isOpen) {
    console.log('❌ NOT RENDERING: isOpen is false');
    return null;
  }

  const currentAnnouncement = activeAnnouncements[currentAnnouncementIndex];
  console.log('✅ RENDERING POPUP for announcement:', currentAnnouncement?.title);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
         style={{ zIndex: 9999 }}>
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-lg shadow-xl border flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div className="flex items-center space-x-2">
            {getTypeIcon(currentAnnouncement.type)}
            <h3 className="text-lg font-semibold">
              {currentAnnouncement.title}
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-6 w-6 p-0 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Image - Full height available space */}
        {currentAnnouncement.imageUrl && (
          <div className="flex-1 overflow-hidden bg-gray-50 min-h-0">
            <img 
              src={currentAnnouncement.imageUrl} 
              alt={currentAnnouncement.title}
              className="w-full h-full object-contain"
              onError={(e) => {
                // Fallback if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        )}
        
        {/* Message */}
        {currentAnnouncement.message && (
          <div className="p-4 flex-shrink-0">
            <p className="text-sm text-gray-600 leading-relaxed">
              {currentAnnouncement.message}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end space-x-2 p-4 border-t bg-gray-50/50 flex-shrink-0">
          {activeAnnouncements.length > 1 && (
            <span className="text-xs text-gray-500 mr-auto flex items-center">
              {currentAnnouncementIndex + 1} of {activeAnnouncements.length}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDismiss}
            className="h-8 px-3"
          >
            Don't show again
          </Button>
          <Button
            size="sm"
            onClick={handleClose}
            className="h-8 px-3 bg-primary text-white hover:bg-primary/90"
          >
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
}