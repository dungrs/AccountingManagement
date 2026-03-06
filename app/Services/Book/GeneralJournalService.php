<?php

namespace App\Services\Book;

use App\Services\Interfaces\Book\GeneralJournalServiceInterface;
use App\Services\BaseService;
use App\Repositories\Journal\JournalEntryRepository;
use App\Repositories\Journal\JournalEntryDetailRepository;
use App\Repositories\Voucher\PaymentVoucherRepository;
use App\Repositories\Voucher\ReceiptVoucherRepository;
use App\Repositories\Receipt\PurchaseReceiptRepository;
use App\Repositories\Receipt\SalesReceiptRepository;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GeneralJournalService extends BaseService implements GeneralJournalServiceInterface
{
    protected $journalEntryRepository;
    protected $journalEntryDetailRepository;
    protected $paymentVoucherRepository;
    protected $receiptVoucherRepository;
    protected $purchaseReceiptRepository;
    protected $salesReceiptRepository;

    public function __construct(
        JournalEntryRepository $journalEntryRepository,
        JournalEntryDetailRepository $journalEntryDetailRepository,
        PaymentVoucherRepository $paymentVoucherRepository,
        ReceiptVoucherRepository $receiptVoucherRepository,
        PurchaseReceiptRepository $purchaseReceiptRepository,
        SalesReceiptRepository $salesReceiptRepository
    ) {
        $this->journalEntryRepository = $journalEntryRepository;
        $this->journalEntryDetailRepository = $journalEntryDetailRepository;
        $this->paymentVoucherRepository = $paymentVoucherRepository;
        $this->receiptVoucherRepository = $receiptVoucherRepository;
        $this->purchaseReceiptRepository = $purchaseReceiptRepository;
        $this->salesReceiptRepository = $salesReceiptRepository;
    }

    /**
     * Lấy dữ liệu sổ nhật ký chung theo khoảng thời gian
     */
    public function getGeneralJournal(Request $request): array
    {
        $periodData = $this->preparePeriodData($request);
        $accountCode = $request->input('account_code', 'all');

        // Lấy tất cả chứng từ trong khoảng thời gian
        $journalEntries = $this->getPeriodJournalEntries(
            $periodData['start_date'],
            $periodData['end_date']
        );

        // Lọc theo tài khoản nếu có
        if ($accountCode !== 'all') {
            $journalEntries = $this->filterByAccountCode($journalEntries, $accountCode);
        }

        // Format dữ liệu theo mẫu sổ nhật ký chung
        $formattedData = $this->formatGeneralJournalData($journalEntries);

        // Tính tổng phát sinh Nợ, Có trong kỳ
        $summary = $this->calculateSummary($journalEntries);

        return [
            'account_code' => $accountCode,
            'account_name' => $this->getAccountName($accountCode),
            'start_date' => $periodData['start_date']->format('d/m/Y'),
            'end_date' => $periodData['end_date']->format('d/m/Y'),
            'data' => $formattedData,
            'summary' => $summary,
            'period' => $periodData['period']
        ];
    }

    /**
     * Lấy tất cả chứng từ trong khoảng thời gian
     */
    protected function getPeriodJournalEntries(Carbon $startDate, Carbon $endDate): Collection
    {
        $condition = [
            ['entry_date', '>=', $startDate],
            ['entry_date', '<=', $endDate],
        ];

        $relations = [
            'details.account',
            'details.account.languages',
            'creator',
            'reference'
        ];

        return $this->journalEntryRepository->findByCondition(
            $condition,
            true,
            [],
            ['entry_date' => 'ASC', 'id' => 'ASC'],
            ['*'],
            $relations
        );
    }

    /**
     * Lọc chứng từ theo mã tài khoản
     */
    protected function filterByAccountCode(Collection $journalEntries, string $accountCode): Collection
    {
        return $journalEntries->filter(function ($entry) use ($accountCode) {
            return $entry->details->contains(function ($detail) use ($accountCode) {
                return strpos($detail->account->account_code, $accountCode) === 0;
            });
        })->values();
    }

    /**
     * Format dữ liệu sổ nhật ký chung theo mẫu
     */
    protected function formatGeneralJournalData(Collection $journalEntries): array
    {
        $result = [];
        $stt = 1;

        foreach ($journalEntries as $entry) {
            $firstDetail = true;
            $detailCount = $entry->details->count();

            // Xử lý ngày tháng
            $entryDate = $this->parseDate($entry->entry_date);

            // Lấy thông tin tham chiếu từ chứng từ gốc
            $referenceInfo = $this->getReferenceInfo($entry->reference_type, $entry->reference_id);

            // Xác định loại chứng từ
            $voucherType = $this->determineVoucherType($entry->reference_type);
            $referenceTypeLabel = $this->getReferenceTypeLabel($entry->reference_type, $voucherType);

            // Lấy thông tin đối tượng và ghi chú
            $partnerInfo = $this->getPartnerInfo($entry->reference);
            $referenceNote = $referenceInfo['note'] ?? $entry->note;

            // Format diễn giải
            $description = $this->formatDescription($entry, $referenceInfo, $partnerInfo);

            foreach ($entry->details as $detail) {
                // Lấy tên tài khoản
                $accountName = $this->getAccountNameFromDetail($detail);

                $item = [
                    'stt' => $firstDetail ? $stt : '',
                    'ngay_ct' => $firstDetail && $entryDate ? $entryDate->format('d') : '',
                    'thang_ct' => $firstDetail && $entryDate ? $entryDate->format('m') : '',
                    'nam_ct' => $firstDetail && $entryDate ? $entryDate->format('Y') : '',
                    'so_hieu_ct' => $firstDetail ? $entry->code : '',
                    'ngay_thang_ct' => $firstDetail && $entryDate ? $entryDate->format('d/m/Y') : '',
                    'dien_giai' => $firstDetail ? $description : '',
                    'tk_no' => $detail->debit > 0 ? $detail->account->account_code : '',
                    'tk_co' => $detail->credit > 0 ? $detail->account->account_code : '',
                    'so_tien_no' => (float)($detail->debit ?? 0),
                    'so_tien_co' => (float)($detail->credit ?? 0),
                    'so_tien_no_display' => $detail->debit > 0 ? $detail->debit : null,
                    'so_tien_co_display' => $detail->credit > 0 ? $detail->credit : null,
                    'reference_type_label' => $firstDetail ? $referenceTypeLabel : '',
                    'reference_code' => $firstDetail ? ($referenceInfo['code'] ?? '') : '',
                    'partner_info' => $firstDetail ? $partnerInfo : '',
                    'reference_note' => $firstDetail ? $referenceNote : '',
                    'rowspan' => $firstDetail ? $detailCount : 0,
                    'is_first' => $firstDetail
                ];

                $result[] = $item;

                if ($firstDetail) {
                    $stt++;
                }
                $firstDetail = false;
            }
        }

        return $result;
    }

    /**
     * Xác định loại chứng từ
     */
    protected function determineVoucherType($referenceType): string
    {
        $map = [
            'payment_voucher'  => 'PC',   // Phiếu chi
            'receipt_voucher'  => 'PT',   // Phiếu thu
            'purchase_receipt' => 'PNK',  // Phiếu nhập kho
            'sales_receipt'    => 'PXK',  // Phiếu xuất kho
        ];

        return $map[$referenceType] ?? 'CT';
    }

    /**
     * Lấy nhãn cho loại chứng từ
     */
    protected function getReferenceTypeLabel($referenceType, $voucherType = null): string
    {
        $labels = [
            'receipt_voucher'  => 'PT',   // Phiếu thu
            'payment_voucher'  => 'PC',   // Phiếu chi
            'sales_receipt'    => 'PXK',  // Phiếu xuất kho
            'purchase_receipt' => 'PNK',  // Phiếu nhập kho
        ];

        return $voucherType ?? ($labels[$referenceType] ?? 'CT');
    }

    /**
     * Lấy thông tin tham chiếu từ chứng từ gốc
     */
    protected function getReferenceInfo($referenceType, $referenceId): array
    {
        $result = ['code' => null, 'note' => null, 'voucher_date' => null];

        if (!$referenceType || !$referenceId) {
            return $result;
        }

        try {
            switch ($referenceType) {
                case 'receipt_voucher':
                    $info = $this->receiptVoucherRepository->getBasicInfo($referenceId);
                    if (!empty($info)) {
                        $result = array_merge($result, [
                            'code'         => $info['code'],
                            'note'         => $info['note'],
                            'voucher_date' => $info['voucher_date'],
                        ]);
                    }
                    break;

                case 'payment_voucher':
                    $info = $this->paymentVoucherRepository->getBasicInfo($referenceId);
                    if (!empty($info)) {
                        $result = array_merge($result, [
                            'code'         => $info['code'],
                            'note'         => $info['note'],
                            'voucher_date' => $info['voucher_date'],
                        ]);
                    }
                    break;

                case 'purchase_receipt':
                    $info = $this->purchaseReceiptRepository->getBasicInfo($referenceId);
                    if (!empty($info)) {
                        $result = array_merge($result, [
                            'code'         => $info['code'],
                            'note'         => $info['note'],
                            'voucher_date' => $info['receipt_date'],
                        ]);
                    }
                    break;

                case 'sales_receipt':
                    $info = $this->salesReceiptRepository->getBasicInfo($referenceId);
                    if (!empty($info)) {
                        $result = array_merge($result, [
                            'code'         => $info['code'],
                            'note'         => $info['note'],
                            'voucher_date' => $info['receipt_date'],
                        ]);
                    }
                    break;

                default:
                    $result['code'] = 'CT_' . $referenceId;
                    break;
            }
        } catch (\Exception $e) {
            Log::error('GeneralJournalService::getReferenceInfo - ' . $e->getMessage());
            $result['code'] = $referenceType . '_' . $referenceId;
        }

        return $result;
    }

    /**
     * Lấy thông tin đối tượng từ chứng từ gốc
     */
    protected function getPartnerInfo($reference): string
    {
        if (!$reference) {
            return '';
        }

        if ($reference instanceof \App\Models\SalesReceipt && $reference->customer) {
            return 'KH: ' . $reference->customer->name;
        }

        if ($reference instanceof \App\Models\PurchaseReceipt && $reference->supplier) {
            return 'NCC: ' . $reference->supplier->name;
        }

        if ($reference instanceof \App\Models\ReceiptVoucher && $reference->customer) {
            return 'KH: ' . $reference->customer->name;
        }

        if ($reference instanceof \App\Models\PaymentVoucher && $reference->supplier) {
            return 'NCC: ' . $reference->supplier->name;
        }

        return '';
    }

    /**
     * Format diễn giải
     */
    protected function formatDescription($entry, $referenceInfo = [], $partnerInfo = ''): string
    {
        $parts = [];

        // Thêm loại chứng từ
        $voucherType = $this->determineVoucherType($entry->reference_type);
        if ($voucherType) {
            $parts[] = '[' . $voucherType . ']';
        }

        // Thêm tiêu đề mặc định nếu không có gì
        if (empty($parts) && empty($referenceInfo['note']) && empty($entry->note)) {
            $parts[] = 'Bút toán từ chứng từ';
        }

        // Ưu tiên note từ chứng từ gốc
        if (!empty($referenceInfo['note'])) {
            $parts[] = '- ' . trim($referenceInfo['note']);
        }
        // Fallback: journal note
        elseif (!empty($entry->note)) {
            $parts[] = '- ' . trim($entry->note);
        }

        return implode(' ', $parts);
    }

    /**
     * Lấy tên tài khoản từ detail
     */
    protected function getAccountNameFromDetail($detail): string
    {
        if (!$detail->account) {
            return '';
        }

        if ($detail->account->languages && $detail->account->languages->isNotEmpty()) {
            $firstLang = $detail->account->languages->first();
            return $firstLang->name ?? '';
        }

        return '';
    }

    /**
     * Parse date từ nhiều định dạng khác nhau
     */
    protected function parseDate($date)
    {
        if (empty($date)) {
            return null;
        }

        if ($date instanceof Carbon) {
            return $date;
        }

        if ($date instanceof \DateTime) {
            return Carbon::instance($date);
        }

        if (is_string($date)) {
            try {
                return Carbon::parse($date);
            } catch (\Exception $e) {
                return null;
            }
        }

        return null;
    }

    /**
     * Tính tổng phát sinh trong kỳ
     */
    protected function calculateSummary(Collection $journalEntries): array
    {
        $totalDebit = 0;
        $totalCredit = 0;
        $totalEntries = $journalEntries->count();

        foreach ($journalEntries as $entry) {
            foreach ($entry->details as $detail) {
                $totalDebit += (float)($detail->debit ?? 0);
                $totalCredit += (float)($detail->credit ?? 0);
            }
        }

        return [
            'total_debit' => round($totalDebit, 2),
            'total_credit' => round($totalCredit, 2),
            'total_debit_display' => number_format($totalDebit, 0, ',', '.') . ' ₫',
            'total_credit_display' => number_format($totalCredit, 0, ',', '.') . ' ₫',
            'total_entries' => $totalEntries,
            'balance_diff' => round(abs($totalDebit - $totalCredit), 2),
            'is_balanced' => abs($totalDebit - $totalCredit) < 0.01
        ];
    }

    /**
     * Lấy tên tài khoản
     */
    protected function getAccountName(string $accountCode): string
    {
        if ($accountCode === 'all') {
            return 'Tất cả tài khoản';
        }

        $accounts = [
            '111' => 'Tiền mặt',
            '112' => 'Tiền gửi ngân hàng',
            '131' => 'Phải thu khách hàng',
            '156' => 'Hàng hóa',
            '331' => 'Phải trả người bán',
            '511' => 'Doanh thu bán hàng',
            '632' => 'Giá vốn hàng bán',
            '641' => 'Chi phí bán hàng',
            '642' => 'Chi phí quản lý'
        ];

        foreach ($accounts as $code => $name) {
            if (strpos($accountCode, $code) === 0) {
                return $name;
            }
        }

        return 'Tài khoản ' . $accountCode;
    }

    /**
     * Chuẩn bị dữ liệu kỳ báo cáo theo khoảng thời gian
     */
    protected function preparePeriodData(Request $request): array
    {
        $startDateStr = $request->input('start_date');
        $endDateStr = $request->input('end_date');

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