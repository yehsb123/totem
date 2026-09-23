"use client";

interface PaymentItem {
  id: number;
  date: string;
  amount: string;
  status: string;
  product: string;
}

interface BillingTabProps {
  subscriptionStatus: string;
  nextBillingDate: string;
  paymentMethod: string;
  paymentHistory: PaymentItem[];
}

export default function BillingTab({
  subscriptionStatus,
  nextBillingDate,
  paymentMethod,
  paymentHistory,
}: BillingTabProps) {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">결제 정보</h2>

      {/* Subscription Status */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">
          현재 구독 상태
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-lg font-medium text-gray-700">구독 플랜:</span>
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
              alert("구독 변경 또는 취소 기능은 아직 구현되지 않았습니다.")
            }
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-md transition duration-200"
          >
            플랜 변경
          </button>
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">
          결제 수단 관리
        </h3>
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-700 text-base">{paymentMethod}</span>
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
              alert("새로운 결제 수단 추가 기능은 아직 구현되지 않았습니다.")
            }
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-md transition duration-200"
          >
            새로운 카드 추가
          </button>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">결제 내역</h3>
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
  );
}
