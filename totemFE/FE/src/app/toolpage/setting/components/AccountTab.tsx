"use client";

interface AccountTabProps {
  userName: string;
  userEmail: string;
  loading: boolean;
  onUserNameChange: (value: string) => void;
  onUserEmailChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onChangePassword: () => void;
  onDeleteAccount: () => void;
}

export default function AccountTab({
  userName,
  userEmail,
  loading,
  onUserNameChange,
  onUserEmailChange,
  onSave,
  onCancel,
  onChangePassword,
  onDeleteAccount,
}: AccountTabProps) {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">계정 관리</h2>

      {/* Profile Info */}
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
            onChange={(e) => onUserNameChange(e.target.value)}
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
            onChange={(e) => onUserEmailChange(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-md transition duration-200"
          >
            취소
          </button>
          <button
            onClick={onSave}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition duration-200"
          >
            저장
          </button>
        </div>
      </div>

      {/* Change Password */}
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
            onClick={onChangePassword}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition duration-200"
          >
            비밀번호 변경
          </button>
        </div>
      </div>

      {/* Delete Account */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-red-200">
        <h3 className="text-xl font-semibold text-red-700 mb-4">계정 삭제</h3>
        <p className="text-gray-600 mb-4">
          계정을 삭제하면 모든 데이터가 영구적으로 삭제되며, 이 작업은 되돌릴 수
          없습니다. 신중하게 결정해주세요.
        </p>
        <button
          onClick={onDeleteAccount}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md transition duration-200 disabled:bg-gray-400"
          disabled={loading}
        >
          {loading ? "삭제 중..." : "계정 삭제"}
        </button>
      </div>
    </div>
  );
}
