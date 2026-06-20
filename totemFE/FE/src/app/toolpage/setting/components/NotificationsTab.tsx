"use client";

interface NotificationsTabProps {
  emailNotifications: boolean;
  pushNotifications: boolean;
  onToggleEmail: () => void;
  onTogglePush: () => void;
}

export default function NotificationsTab({
  emailNotifications,
  pushNotifications,
  onToggleEmail,
  onTogglePush,
}: NotificationsTabProps) {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">알림 설정</h2>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-700 text-lg font-medium">이메일 알림</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              value=""
              className="sr-only peer"
              checked={emailNotifications}
              onChange={onToggleEmail}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-700 text-lg font-medium">푸시 알림</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              value=""
              className="sr-only peer"
              checked={pushNotifications}
              onChange={onTogglePush}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  );
}
