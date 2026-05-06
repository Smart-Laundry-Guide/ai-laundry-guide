import { Home, Camera, History, BookOpen, MessageCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router';

export function BottomNav() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: Home, label: '홈' },
    { path: '/guide', icon: BookOpen, label: '가이드' },
    { path: '/camera', icon: Camera, label: '촬영' },
    { path: '/history', icon: History, label: '기록' },
    { path: '/chatbot', icon: MessageCircle, label: '챗봇' },
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center flex-1 gap-1"
            >
              <Icon 
                size={22} 
                className={isActive ? 'stroke-[#87CEEB]' : 'stroke-[#8896a8]'}
                strokeWidth={2}
              />
              <span 
                className={`${isActive ? 'text-[#87CEEB]' : 'text-[#8896a8]'}`}
                style={{ fontSize: '11px', fontWeight: 500 }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}