"use client";

import { useState, useEffect } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
const getToken = () => localStorage.getItem("access_token") || "";

interface UserMessageResponse {
  message: string;
}

interface UserProfileResponse {
  username: string;
  email: string;
}

async function deleteUserByEmail(email: string): Promise<UserMessageResponse> {
  const res = await fetch(`${API_BASE}/api/users/${email}/v1`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: getToken(),
    },
  });

  if (!res.ok) {
    const errorData = await res
      .json()
      .catch(() => ({ message: `회원 탈퇴 실패(${res.status})` }));
    throw new Error(errorData.message);
  }

  return res.json();
}

async function fetchUserProfile(email: string): Promise<UserProfileResponse> {
  const res = await fetch(`${API_BASE}/api/users/${email}/v1`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: getToken(),
    },
  });

  if (!res.ok) {
    const errorData = await res
      .json()
      .catch(() => ({ message: `프로필 조회 실패(${res.status})` }));
    throw new Error(errorData.message);
  }

  return res.json();
}

async function updateUserProfile(
  email: string,
  username: string
): Promise<UserMessageResponse> {
  const res = await fetch(`${API_BASE}/api/users/${email}/v1`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: getToken(),
    },
    body: JSON.stringify({ username, email }),
  });

  if (!res.ok) {
    const errorData = await res
      .json()
      .catch(() => ({ message: `프로필 업데이트 실패(${res.status})` }));
    throw new Error(errorData.message);
  }

  return res.json();
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("account");
  const [loading, setLoading] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [, setProfileLoading] = useState(false);

  const [subscriptionStatus] = useState("프리미엄");
  const [nextBillingDate] = useState("2025년 9월 25일");
  const [paymentMethod] = useState("Visa **** 1234");

  const [paymentHistory] = useState([
    {
      id: 1,
      date: "2025-08-25",
      amount: "15,000원",
      status: "결제 완료",
      product: "프리미엄 플랜",
    },
    {
      id: 2,
      date: "2025-07-25",
      amount: "15,000원",
      status: "결제 완료",
      product: "프리미엄 플랜",
    },
    {
      id: 3,
      date: "2025-06-25",
      amount: "15,000원",
      status: "결제 완료",
      product: "프리미엄 플랜",
    },
  ]);

  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/icon?family=Material+Icons";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  const [userName, setUserName] = useState("홍길동");
  const [userEmail, setUserEmail] = useState("hong.gildong@example.com");

  useEffect(() => {
    const loadUserProfile = async () => {
      setProfileLoading(true);
      try {
        const profile = await fetchUserProfile(userEmail);
        setUserName(profile.username);
        setUserEmail(profile.email);
        alert("프로필 정보를 성공적으로 불러왔습니다.");
      } catch (e: unknown) {
        if (e instanceof Error) {
          alert(e.message || "프로필 정보를 불러오지 못했습니다.");
        } else {
          alert("프로필 정보를 불러오지 못했습니다.");
        }
      } finally {
        setProfileLoading(false);
      }
    };
    loadUserProfile();
  }, [userEmail]);

  const handleProfileSave = async () => {
    setLoading(true);
    try {
      const result = await updateUserProfile(userEmail, userName);
      alert("프로필 정보가 성공적으로 저장되었습니다.");
      console.log(result);
    } catch (e: unknown) {
      if (e instanceof Error) {
        alert(e.message || "프로필 정보 저장 중 오류가 발생했습니다.");
      } else {
        alert("프로필 정보 저장 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = () => {
    alert("비밀번호 변경 기능은 아직 구현되지 않았습니다.");
  };

  const handleDeleteAccount = async () => {
    if (
      window.confirm(
        "정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
      )
    ) {
      setLoading(true);
      try {
        const result = await deleteUserByEmail(userEmail);
        alert(result.message);
      } catch (e: unknown) {
        if (e instanceof Error) {
          alert(e.message || "계정 삭제 중 오류가 발생했습니다.");
        } else {
          alert("계정 삭제 중 오류가 발생했습니다.");
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 font-sans antialiased text-gray-800">
      <div className="flex bg-white rounded-lg shadow-md overflow-hidden">
        {/* 사이드바 메뉴 */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 flex flex-col gap-2">
          <button
            onClick={() => setActiveTab("account")}
            className={`flex items-center gap-3 p-3 rounded-md text-left text-lg font-medium transition-colors duration-200
              ${
                activeTab === "account"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
          >
            <span className="material-icons text-2xl">account_circle</span>
            계정 관리
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`flex items-center gap-3 p-3 rounded-md text-left text-lg font-medium transition-colors duration-200
              ${
                activeTab === "notifications"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
          >
            <span className="material-icons text-2xl">notifications</span>
            알림 설정
          </button>
          <button
            onClick={() => setActiveTab("billing")}
            className={`flex items-center gap-3 p-3 rounded-md text-left text-lg font-medium transition-colors duration-200
              ${
                activeTab === "billing"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
          >
            <span className="material-icons text-2xl">credit_card</span>
            결제 정보
          </button>
        </div>

        {/* 메인 콘텐츠 영역 */}
        <div className="flex-1 p-6">
          {activeTab === "account" && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                계정 관리
              </h2>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
                <h3 className="text-xl font-semibold text-gray-700 mb-4">
                  프로필 정보
                </h3>
                <div className="mb-4">
                  <label
                    htmlFor="name"
                    className="block text-gray-700 text-sm font-bold mb-2"
                  >
                    이름
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div className="mb-6">
                  <label
                    htmlFor="email"
                    className="block text-gray-700 text-sm font-bold mb-2"
                  >
                    이메일
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setUserName("홍길동");
                      setUserEmail("hong.gildong@example.com");
                    }}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-md transition duration-200"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleProfileSave}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition duration-200"
                  >
                    저장
                  </button>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
                <h3 className="text-xl font-semibold text-gray-700 mb-4">
                  비밀번호 변경
                </h3>
                <div className="mb-4">
                  <label
                    htmlFor="current-password"
                    className="block text-gray-700 text-sm font-bold mb-2"
                  >
                    현재 비밀번호
                  </label>
                  <input
                    type="password"
                    id="current-password"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div className="mb-6">
                  <label
                    htmlFor="new-password"
                    className="block text-gray-700 text-sm font-bold mb-2"
                  >
                    새 비밀번호
                  </label>
                  <input
                    type="password"
                    id="new-password"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleChangePassword}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition duration-200"
                  >
                    비밀번호 변경
                  </button>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-red-200">
                <h3 className="text-xl font-semibold text-red-700 mb-4">
                  계정 삭제
                </h3>
                <p className="text-gray-600 mb-4">
                  계정을 삭제하면 모든 데이터가 영구적으로 삭제되며, 이 작업은
                  되돌릴 수 없습니다. 신중하게 결정해주세요.
                </p>
                <button
                  onClick={handleDeleteAccount}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md transition duration-200 disabled:bg-gray-400"
                  disabled={loading}
                >
                  {loading ? "삭제 중..." : "계정 삭제"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                알림 설정
              </h2>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-700 text-lg font-medium">
                    이메일 알림
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      value=""
                      className="sr-only peer"
                      checked={emailNotifications}
                      onChange={() =>
                        setEmailNotifications(!emailNotifications)
                      }
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-700 text-lg font-medium">
                    푸시 알림
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      value=""
                      className="sr-only peer"
                      checked={pushNotifications}
                      onChange={() => setPushNotifications(!pushNotifications)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === "billing" && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                결제 정보
              </h2>

              {/* 현재 구독 정보 카드 */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
                <h3 className="text-xl font-semibold text-gray-700 mb-4">
                  현재 구독 상태
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium text-gray-700">
                    구독 플랜:
                  </span>
                  <span className="text-lg font-bold text-blue-600">
                    {subscriptionStatus}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-lg font-medium text-gray-700">
                    다음 결제일:
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    {nextBillingDate}
                  </span>
                </div>
                <div className="flex justify-end mt-4">
                  <button
                    onClick={() =>
                      alert(
                        "구독 변경 또는 취소 기능은 아직 구현되지 않았습니다."
                      )
                    }
                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-md transition duration-200"
                  >
                    플랜 변경
                  </button>
                </div>
              </div>

              {/* 결제 수단 관리 카드 */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
                <h3 className="text-xl font-semibold text-gray-700 mb-4">
                  결제 수단 관리
                </h3>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700 text-base">
                    {paymentMethod}
                  </span>
                  <button
                    onClick={() =>
                      alert("결제 수단 변경 기능은 아직 구현되지 않았습니다.")
                    }
                    className="text-sm text-blue-500 hover:underline"
                  >
                    변경
                  </button>
                </div>
                <div className="flex justify-start mt-4">
                  <button
                    onClick={() =>
                      alert(
                        "새로운 결제 수단 추가 기능은 아직 구현되지 않았습니다."
                      )
                    }
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-md transition duration-200"
                  >
                    새로운 카드 추가
                  </button>
                </div>
              </div>

              {/* 결제 내역 테이블 */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-700 mb-4">
                  결제 내역
                </h3>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        날짜
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        상품
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        금액
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        상태
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paymentHistory.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.product}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.amount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
