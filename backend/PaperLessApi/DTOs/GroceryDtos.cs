using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace PaperLessApi.DTOs;

// --- PRODUCT DTOS ---
public class ProductDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public long Price { get; set; }
    public string Unit { get; set; } = "Cái";
    public string? Barcode { get; set; }
    public int Stock { get; set; }
    public bool Popular { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsAvailable { get; set; }
}

public class CreateProductRequest
{
    [Required(ErrorMessage = "Tên sản phẩm không được để trống")]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Danh mục không được để trống")]
    [MaxLength(50)]
    public string Category { get; set; } = string.Empty;

    [Range(0, 1000000000, ErrorMessage = "Giá sản phẩm không hợp lệ")]
    public long Price { get; set; }

    [MaxLength(30)]
    public string Unit { get; set; } = "Cái";

    [MaxLength(50)]
    public string? Barcode { get; set; }

    public int Stock { get; set; } = 100;

    public bool Popular { get; set; } = false;

    [MaxLength(500)]
    public string? ImageUrl { get; set; }
}

public class UpdateProductRequest
{
    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string Category { get; set; } = string.Empty;

    public long Price { get; set; }

    [MaxLength(30)]
    public string Unit { get; set; } = "Cái";

    [MaxLength(50)]
    public string? Barcode { get; set; }

    public int Stock { get; set; }

    public bool Popular { get; set; }

    [MaxLength(500)]
    public string? ImageUrl { get; set; }

    public bool IsAvailable { get; set; } = true;
}

// --- INVOICE & ORDER DTOS ---
public class CreateInvoiceItemRequest
{
    public string? ProductId { get; set; }

    [Required]
    public string Name { get; set; } = string.Empty;

    [Range(1, 10000)]
    public int Quantity { get; set; } = 1;

    public long UnitPrice { get; set; }
}

public class CreateInvoiceRequest
{
    public string? CustomerName { get; set; }
    public string? CustomerPhone { get; set; }
    public string PayMethod { get; set; } = "cash"; // cash, qr, transfer
    public long CashGiven { get; set; }
    public string? Note { get; set; }
    public string SendChannel { get; set; } = "zalo";

    [Required]
    [MinLength(1, ErrorMessage = "Đơn hàng phải có ít nhất 1 sản phẩm")]
    public List<CreateInvoiceItemRequest> Items { get; set; } = new();
}

public class InvoiceItemDto
{
    public string Id { get; set; } = string.Empty;
    public string? ProductId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public long UnitPrice { get; set; }
    public long Total => Quantity * UnitPrice;
}

public class InvoiceDto
{
    public string Id { get; set; } = string.Empty;
    public int TicketNumber { get; set; }
    public string? CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public string BranchName { get; set; } = string.Empty;
    public string StaffName { get; set; } = string.Empty;
    public long Subtotal { get; set; }
    public long Discount { get; set; }
    public long Tax { get; set; }
    public long Total { get; set; }
    public long CashGiven { get; set; }
    public long ChangeDue { get; set; }
    public string OrderStatus { get; set; } = "preparing";
    public string PayMethod { get; set; } = "cash";
    public string PayStatus { get; set; } = "paid";
    public string SendChannel { get; set; } = "zalo";
    public string SendStatus { get; set; } = "sent";
    public string? Note { get; set; }
    public string PublicToken { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public List<InvoiceItemDto> Items { get; set; } = new();
}

public class UpdateOrderStatusRequest
{
    [Required]
    public string Status { get; set; } = "preparing"; // preparing, ready, completed, cancelled
}

// --- REVENUE DTOS ---
public class HourlyRevenueDto
{
    public string Hour { get; set; } = string.Empty;
    public long Revenue { get; set; }
    public int Orders { get; set; }
}

public class TopProductDto
{
    public string Name { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public long Revenue { get; set; }
    public string Category { get; set; } = string.Empty;
}

public class TodayRevenueDto
{
    public long TotalRevenue { get; set; }
    public long PreviousDayRevenue { get; set; }
    public int OrderCount { get; set; }
    public long AverageOrderValue { get; set; }
    public long CashRevenue { get; set; }
    public long DigitalRevenue { get; set; }
    public List<HourlyRevenueDto> HourlyData { get; set; } = new();
    public List<TopProductDto> TopSelling { get; set; } = new();
}

// --- CUSTOMER DTOS ---
public class CustomerDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public int Points { get; set; }
    public string Tier { get; set; } = "bronze";
    public long TotalSpent { get; set; }
    public int TotalOrders { get; set; }
}

public class CreateCustomerRequest
{
    [Required]
    public string Name { get; set; } = string.Empty;

    [Required]
    [RegularExpression(@"^(0|\+84)(3|5|7|8|9)[0-9]{8}$", ErrorMessage = "Số điện thoại không hợp lệ")]
    public string Phone { get; set; } = string.Empty;
}
