<?php

namespace App\Services\Book;

use App\Services\Interfaces\Book\CashBookServiceInterface;
use App\Services\BaseService;
use App\Repositories\Voucher\PaymentVoucherRepository;
use App\Repositories\Voucher\ReceiptVoucherRepository;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class CashBookService extends BaseService implements CashBookServiceInterface
{
    protected $paymentVoucherRepository;
    protected $receiptVoucherRepository;

    public function __construct(
        PaymentVoucherRepository $paymentVoucherRepository,
        ReceiptVoucherRepository $receiptVoucherRepository
    ) {
        $this->paymentVoucherRepository = $paymentVoucherRepository;
        $this->receiptVoucherRepository = $receiptVoucherRepository;
    }

    /**
     * Lấy dữ liệu sổ quỹ theo khoảng thời gian
     */
    public function getCashBook(Request $request): array
    {
        $periodData = $this->preparePeriodData($request);
        $paymentMethod = $request->input('payment_method', 'cash'); // cash hoặc bank

        // Lấy tất cả giao dịch trong khoảng thời gian
        $transactions = $this->getPeriodTransactions(
            $periodData['start_date'],
            $periodData['end_date'],
            $paymentMethod
        );

        // Tính số dư đầu kỳ
        $openingBalance = $this->calculateOpeningBalance(
            $periodData['previous_period_end'],
            $paymentMethod
        );

        // Format dữ liệu theo mẫu sổ quỹ
        $formattedData = $this->formatCashBookData($transactions, $openingBalance);

        // Tính tổng thu, tổng chi trong kỳ
        $summary = $this->calculateSummary($transactions);

        return [
            'payment_method' => $paymentMethod,
            'payment_method_name' => $this->getPaymentMethodName($paymentMethod),
            'account_code' => $paymentMethod === 'cash' ? '111' : '112',
            'account_name' => $paymentMethod === 'cash' ? 'Tiền mặt' : 'Tiền gửi ngân hàng',
            'start_date' => $periodData['start_date']->format('d/m/Y'),
            'end_date' => $periodData['end_date']->format('d/m/Y'),
            'opening_balance' => $openingBalance,
            'closing_balance' => $openingBalance + $summary['total_receipt'] - $summary['total_payment'],
            'data' => $formattedData,
            'summary' => $summary,
            'period' => $periodData['period']
        ];
    }

    /**
     * Lấy tất cả giao dịch trong khoảng thời gian
     */
    protected function getPeriodTransactions(Carbon $startDate, Carbon $endDate, string $paymentMethod): Collection
    {
        $condition = [
            ['voucher_date', '>=', $startDate],
            ['voucher_date', '<=', $endDate],
            ['status', '=', 'confirmed'],
            ['payment_method', '=', $paymentMethod]
        ];

        // Lấy phiếu thu
        $receipts = $this->receiptVoucherRepository->findByCondition(
            $condition,
            true,
            [],
            ['voucher_date' => 'ASC', 'created_at' => 'ASC'],
            ['id', 'code', 'voucher_date', 'customer_id', 'amount', 'note', 'created_at'],
            ['customer']
        )->map(function ($item) {
            return [
                'id' => $item->id,
                'voucher_date' => $item->voucher_date,
                'created_at' => $item->created_at,
                'code' => $item->code,
                'type' => 'receipt',
                'type_label' => 'Thu',
                'description' => $this->formatDescription('receipt', $item),
                'partner_name' => $item->customer->name ?? '',
                'amount' => $item->amount,
                'note' => $item->note,
                'receipt_amount' => $item->amount,
                'payment_amount' => 0
            ];
        });

        // Lấy phiếu chi
        $payments = $this->paymentVoucherRepository->findByCondition(
            $condition,
            true,
            [],
            ['voucher_date' => 'ASC', 'created_at' => 'ASC'],
            ['id', 'code', 'voucher_date', 'supplier_id', 'amount', 'note', 'created_at'],
            ['supplier']
        )->map(function ($item) {
            return [
                'id' => $item->id,
                'voucher_date' => $item->voucher_date,
                'created_at' => $item->created_at,
                'code' => $item->code,
                'type' => 'payment',
                'type_label' => 'Chi',
                'description' => $this->formatDescription('payment', $item),
                'partner_name' => $item->supplier->name ?? '',
                'amount' => $item->amount,
                'note' => $item->note,
                'receipt_amount' => 0,
                'payment_amount' => $item->amount
            ];
        });

        // Gộp và sắp xếp theo ngày chứng từ và thời gian tạo
        return $receipts->concat($payments)
            ->sortBy(function ($item) {
                return $item['voucher_date'] . ' ' . $item['created_at'];
            })
            ->values();
    }

    /**
     * Format mô tả cho giao dịch
     */
    protected function formatDescription(string $type, $item): string
    {
        if ($type === 'receipt') {
            $partnerName = $item->customer->name ?? '';
            return "Thu tiền từ khách hàng: {$partnerName} - " . ($item->note ?: 'Không có ghi chú');
        } else {
            $partnerName = $item->supplier->name ?? '';
            return "Chi tiền cho nhà cung cấp: {$partnerName} - " . ($item->note ?: 'Không có ghi chú');
        }
    }

    /**
     * Format dữ liệu sổ quỹ theo mẫu
     */
    protected function formatCashBookData(Collection $transactions, float $openingBalance): array
    {
        $runningBalance = $openingBalance;
        $result = [];

        // Thêm dòng số dư đầu kỳ
        $result[] = [
            'is_opening' => true,
            'voucher_date' => null,
            'code' => null,
            'description' => 'Số dư đầu kỳ',
            'receipt_amount' => null,
            'payment_amount' => null,
            'balance' => $openingBalance,
            'note' => ''
        ];

        // Thêm các dòng giao dịch
        foreach ($transactions as $item) {
            if ($item['type'] === 'receipt') {
                $runningBalance += $item['amount'];
            } else {
                $runningBalance -= $item['amount'];
            }

            $result[] = [
                'is_opening' => false,
                'voucher_date' => $item['voucher_date'],
                'code' => $item['code'],
                'description' => $item['description'],
                'receipt_amount' => $item['receipt_amount'],
                'payment_amount' => $item['payment_amount'],
                'balance' => $runningBalance,
                'note' => $item['note']
            ];
        }

        return $result;
    }

    /**
     * Tính số dư đầu kỳ
     */
    protected function calculateOpeningBalance(Carbon $endDate, string $paymentMethod): float
    {
        $condition = [
            ['voucher_date', '<=', $endDate],
            ['status', '=', 'confirmed'],
            ['payment_method', '=', $paymentMethod]
        ];

        // Tổng thu đến cuối kỳ trước
        $totalReceipt = $this->receiptVoucherRepository->findByCondition(
            $condition,
            true,
            [],
            [],
            ['amount']
        )->sum('amount');

        // Tổng chi đến cuối kỳ trước
        $totalPayment = $this->paymentVoucherRepository->findByCondition(
            $condition,
            true,
            [],
            [],
            ['amount']
        )->sum('amount');

        return $totalReceipt - $totalPayment;
    }

    /**
     * Tính tổng thu chi trong kỳ
     */
    protected function calculateSummary(Collection $transactions): array
    {
        $totalReceipt = $transactions->where('type', 'receipt')->sum('amount');
        $totalPayment = $transactions->where('type', 'payment')->sum('amount');

        return [
            'total_receipt' => $totalReceipt,
            'total_payment' => $totalPayment,
            'receipt_count' => $transactions->where('type', 'receipt')->count(),
            'payment_count' => $transactions->where('type', 'payment')->count()
        ];
    }

    /**
     * Lấy tên phương thức thanh toán
     */
    protected function getPaymentMethodName(string $method): string
    {
        $methods = [
            'cash' => 'Tiền mặt',
            'bank' => 'Chuyển khoản'
        ];

        return $methods[$method] ?? $method;
    }

    /**
     * Chuẩn bị dữ liệu kỳ báo cáo theo khoảng thời gian
     */
    protected function preparePeriodData(Request $request): array
    {
        // Lấy start_date và end_date từ request
        $startDateStr = $request->input('start_date');
        $endDateStr = $request->input('end_date');

        // Nếu không có start_date và end_date, mặc định lấy tháng hiện tại
        if (!$startDateStr || !$endDateStr) {
            $startDate = Carbon::now()->startOfMonth()->startOfDay();
            $endDate = Carbon::now()->endOfMonth()->endOfDay();
        } else {
            $startDate = Carbon::createFromFormat('Y-m-d', $startDateStr)->startOfDay();
            $endDate = Carbon::createFromFormat('Y-m-d', $endDateStr)->endOfDay();
        }

        $previousPeriodEnd = $startDate->copy()->subDay()->endOfDay();

        return [
            'start_date' => $startDate,
            'end_date' => $endDate,
            'previous_period_end' => $previousPeriodEnd,
            'period' => [
                'start_date' => $startDate->format('d/m/Y'),
                'end_date' => $endDate->format('d/m/Y'),
                'start_date_raw' => $startDate->format('Y-m-d'),
                'end_date_raw' => $endDate->format('Y-m-d')
            ]
        ];
    }
}