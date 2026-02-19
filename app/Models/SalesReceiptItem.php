<?php

namespace App\Models;

use App\Traits\QueryScopes;
use Illuminate\Database\Eloquent\Model;

class SalesReceiptItem extends Model
{
    use QueryScopes;

    protected $table = 'sales_receipt_items';

    protected $fillable = [
        'sales_receipt_id',
        'product_variant_id',
        'quantity',
        'price',
        'list_price',
        'discount_amount',
        'discount_percent',
        'output_tax_id',
        'vat_amount',
        'subtotal'
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'price' => 'decimal:2',
        'list_price' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'discount_percent' => 'decimal:2',
        'vat_amount' => 'decimal:2',
        'subtotal' => 'decimal:2'
    ];

    /* ================= RELATIONS ================= */

    /**
     * Phiếu xuất kho
     */
    public function salesReceipt()
    {
        return $this->belongsTo(SalesReceipt::class);
    }

    /**
     * Biến thể sản phẩm
     */
    public function productVariant()
    {
        return $this->belongsTo(ProductVariant::class);
    }

    /**
     * Thuế đầu ra
     */
    public function outputTax()
    {
        return $this->belongsTo(VatTax::class, 'output_tax_id');
    }
}