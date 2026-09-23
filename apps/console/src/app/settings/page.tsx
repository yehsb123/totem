"use client";

import { useState, useEffect } from "react";

import AccountTab from "./components/AccountTab";
import NotificationsTab from "./components/NotificationsTab";
import BillingTab from "./components/BillingTab";
import {
  fetchUserProfile,
  updateUserProfile,
  deleteUserByEmail,
} from "./settingApi";

const TABS = [
  { key: "account", label: "계정 관리", icon: "account_circle" },
  { key: "notifications", label: "알림 설정", icon: "notifications" },
  { key: "billing", label: "결제 정보", icon: "credit_card" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const DEFAULT_NAME = "홍길동";
const DEFAULT_EMAIL = "hong.gildong@example.com";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("account");
  const [loading, setLoading] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);

  const [userName, setUserName] = useState(DEFAULT_NAME);
  const [userEmail, setUserEmail] = useState(DEFAULT_EMAIL);

  const [subscriptionStatus] = useState("프리미엄");
  const [nextBillingDate] = useState("2025년 9월 25일");
  const [paymentMethod] = useState("Visa **** 1234");
  const [paymentHistory] = useState([
    { id: 1, date: "2025-08-25", amount: "15,000원", status: "결제 완료", product: "프리미엄 플랜" },
    { id: 2, date: "2025-07-25", amount: "15,000원", status: "결제 완료", product: "프리미엄 플랜" },
    { id: 3, date: "2025-06-25", amount: "15,000원", status: "결제 완료", product: "프리미엄 플랜" },
  ]);

  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/icon?family=Material+Icons";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const profile = await fetchUserProfile(userEmail);
        setUserName(profile.username);
        setUserEmail(profile.email);
        alert("프로필 정보를 성공적으로 불러왔습니다.");
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "프로필 정보를 불러오지 못했습니다.";
        alert(msg);
      }
    };
    loadUserProfile();
  }, [userEmail]);

  const handleProfileSave = async () => {
    setLoading(true);
    try {
      await updateUserProfile(userEmail, userName);
      alert("프로필 정보가 성공적으로 저장되었습니다.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "프로필 정보 저장 중 오류가 발생했습니다.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;
    setLoading(true);
    try {
      const result = await deleteUserByEmail(userEmail);
      alert(result.message);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "계정 삭제 중 오류가 발생했습니다.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 font-sans antialiased text-gray-800">
      <div className="flex bg-white rounded-lg shadow-md overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 flex flex-col gap-2">
          {TABS.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-3 p-3 rounded-md text-left text-lg font-medium transition-colors duration-200 ${
                activeTab === key
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className="material-icons text-2xl">{icon}</span>
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          {activeTab === "account" && (
            <AccountTab
              userName={userName}
              userEmail={userEmail}
              loading={loading}
              onUserNameChange={setUserName}
              onUserEmailChange={setUserEmail}
              onSave={handleProfileSave}
              onCancel={() => { setUserName(DEFAULT_NAME); setUserEmail(DEFAULT_EMAIL); }}
              onChangePassword={() => alert("비밀번호 변경 기능은 아직 구현되지 않았습니다.")}
              onDeleteAccount={handleDeleteAccount}
            />
          )}
          {activeTab === "notifications" && (
            <NotificationsTab
              emailNotifications={emailNotifications}
              pushNotifications={pushNotifications}
              onToggleEmail={() => setEmailNotifications(!emailNotifications)}
              onTogglePush={() => setPushNotifications(!pushNotifications)}
            />
          )}
          {activeTab === "billing" && (
            <BillingTab
              subscriptionStatus={subscriptionStatus}
              nextBillingDate={nextBillingDate}
              paymentMethod={paymentMethod}
              paymentHistory={paymentHistory}
            />
          )}
        </div>
      </div>
    </div>
  );
}
