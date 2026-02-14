<?php

namespace App\Models;

use App\Traits\QueryScopes;
use Illuminate\Database\Eloquent\Model;

class PurchaseReceiptItem extends Model
{
    use QueryScopes;

    protected $fillable = [
        'purchase_receipt_id',
        'product_variant_id',
        'quantity',
        'price',
        'input_tax_id',
        'vat_amount',
        'subtotal',
    ];

    /* ================= RELATIONS ================= */

    public function receipt()
    {
        return $this->belongsTo(PurchaseReceipt::class, 'purchase_receipt_id');
    }

    public function productVariant()
    {
        return $this->belongsTo(ProductVariant::class);
    }

    public function vat()
    {
        return $this->belongsTo(VatTax::class, 'input_tax_id');
    }
}
