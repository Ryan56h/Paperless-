using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using PaperLessApi.DTOs;
using PaperLessApi.Models;
using PaperLessApi.Repositories;

namespace PaperLessApi.Services;

public class InvoiceService : IInvoiceService
{
    private readonly IInvoiceRepository _invoiceRepository;
    private readonly IProductRepository _productRepository;
    private readonly ICustomerRepository _customerRepository;
    private readonly IGenericRepository<Tenant> _tenantRepository;

    public InvoiceService(
        IInvoiceRepository invoiceRepository,
        IProductRepository productRepository,
        ICustomerRepository customerRepository,
        IGenericRepository<Tenant> tenantRepository)
    {
        _invoiceRepository = invoiceRepository;
        _productRepository = productRepository;
        _customerRepository = customerRepository;
        _tenantRepository = tenantRepository;
    }

    public async Task<Invoice?> GetInvoiceAsync(string id)
    {
        return await _invoiceRepository.GetInvoiceByIdAsync(id);
    }

    public async Task<Invoice?> GetLatestInvoiceAsync()
    {
        return await _invoiceRepository.GetLatestInvoiceAsync();
    }

    public async Task<(bool Success, string Message, Invoice? Invoice)> CreateInvoiceAsync(Invoice invoice)
    {
        if (await _invoiceRepository.ExistsAsync(invoice.Id))
        {
            return (false, "Hóa đơn này đã tồn tại!", null);
        }

        invoice.CreatedAt = DateTime.UtcNow;
        var createdInvoice = await _invoiceRepository.AddInvoiceAsync(invoice);
        return (true, "Tạo hóa đơn thành công", createdInvoice);
    }

    public async Task<InvoiceDto> CreateInvoiceAsync(
        string tenantId,
        string staffName,
        string? branchId,
        CreateInvoiceRequest request)
    {
        var tenant = await _tenantRepository.GetByIdAsync(tenantId);
        var branchName = tenant?.Name ?? "Cửa hàng Tạp hoá";

        var today = DateTime.UtcNow.Date;
        var todayStr = DateTime.UtcNow.ToString("yyyyMMdd");

        // Tính ticketNumber cho ngày hôm nay qua InvoiceRepository
        var maxTicketToday = await _invoiceRepository.GetMaxTicketTodayAsync(tenantId, today);
        var nextTicket = maxTicketToday + 1;

        // Mã hóa đơn duy nhất toàn hệ thống (tránh xung đột PK giữa các Tenant)
        var globalCountToday = await _invoiceRepository.CountTodayAsync(today);

        string invoiceId;
        int seq = globalCountToday + 1;
        do
        {
            invoiceId = $"PL-{todayStr}-{seq:D3}";
            seq++;
        } while (await _invoiceRepository.ExistsAsync(invoiceId));

        // Tính tổng tiền
        long subtotal = 0;
        var invoiceItems = new List<InvoiceItem>();

        foreach (var item in request.Items)
        {
            var lineTotal = item.Quantity * item.UnitPrice;
            subtotal += lineTotal;

            invoiceItems.Add(new InvoiceItem
            {
                ProductId = item.ProductId,
                Name = item.Name,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice
            });

            // Giảm tồn kho qua ProductRepository nếu có ProductId
            if (!string.IsNullOrEmpty(item.ProductId))
            {
                await _productRepository.DecrementStockAsync(tenantId, item.ProductId, item.Quantity);
            }
        }

        long tax = 0;
        long discount = 0;
        long total = subtotal + tax - discount;
        long cashGiven = request.CashGiven > 0 ? request.CashGiven : total;
        long changeDue = Math.Max(0, cashGiven - total);

        // Khách hàng thân thiết nếu có SĐT qua CustomerRepository
        Customer? customer = null;
        var phone = request.CustomerPhone?.Trim();
        if (!string.IsNullOrEmpty(phone))
        {
            customer = await _customerRepository.GetByPhoneAsync(tenantId, phone);
            if (customer != null)
            {
                var pointsEarned = (int)(total / 10000); // 1 điểm mỗi 10k
                customer.Points += pointsEarned;
                customer.TotalSpent += total;
                customer.TotalOrders += 1;
                if (!string.IsNullOrEmpty(request.CustomerName))
                {
                    customer.Name = request.CustomerName.Trim();
                }
                _customerRepository.Update(customer);
            }
            else if (!string.IsNullOrEmpty(request.CustomerName))
            {
                customer = new Customer
                {
                    TenantId = tenantId,
                    Name = request.CustomerName.Trim(),
                    Phone = phone,
                    Points = (int)(total / 10000),
                    TotalSpent = total,
                    TotalOrders = 1,
                    Tier = "bronze"
                };
                await _customerRepository.AddAsync(customer);
            }
        }

        var invoice = new Invoice
        {
            Id = invoiceId,
            TenantId = tenantId,
            BranchId = branchId,
            BranchName = branchName,
            CustomerId = customer?.Id,
            CustomerName = request.CustomerName?.Trim() ?? customer?.Name ?? "Khách lẻ",
            CustomerPhone = phone ?? string.Empty,
            StaffName = staffName,
            Subtotal = subtotal,
            Discount = discount,
            Tax = tax,
            Total = total,
            TicketNumber = nextTicket,
            CashGiven = cashGiven,
            ChangeDue = changeDue,
            OrderStatus = "preparing",
            PayMethod = request.PayMethod,
            PayStatus = "paid",
            SendChannel = request.SendChannel ?? "zalo",
            SendStatus = "sent",
            Note = request.Note?.Trim(),
            CreatedAt = DateTime.UtcNow,
            Items = invoiceItems
        };

        await _invoiceRepository.AddAsync(invoice);

        return MapToDto(invoice);
    }

    public async Task<List<InvoiceDto>> GetInvoicesAsync(string tenantId, string? status, int limit)
    {
        List<string>? statuses = null;
        if (!string.IsNullOrWhiteSpace(status))
        {
            statuses = status.Split(',').Select(s => s.Trim().ToLower()).ToList();
        }

        var invoices = await _invoiceRepository.GetInvoicesByTenantAsync(tenantId, statuses, limit);
        return invoices.Select(MapToDto).ToList();
    }

    public async Task<InvoiceDto?> GetInvoiceByIdAsync(string id)
    {
        var invoice = await _invoiceRepository.GetInvoiceByIdAsync(id);
        if (invoice == null) return null;

        return MapToDto(invoice);
    }

    public async Task<List<InvoiceDto>> LookupInvoicesAsync(string query)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return new List<InvoiceDto>();
        }

        var cleanQuery = query.Trim().ToUpper();
        var phoneDigits = Regex.Replace(query, @"\D", "");

        var invoices = await _invoiceRepository.LookupInvoicesAsync(cleanQuery, query.Trim(), phoneDigits, 20);
        return invoices.Select(MapToDto).ToList();
    }

    public async Task<bool> UpdateOrderStatusAsync(string id, string status)
    {
        return await _invoiceRepository.UpdateOrderStatusAsync(id, status);
    }

    private static InvoiceDto MapToDto(Invoice invoice)
    {
        return new InvoiceDto
        {
            Id = invoice.Id,
            TicketNumber = invoice.TicketNumber,
            CustomerId = invoice.CustomerId,
            CustomerName = invoice.CustomerName,
            CustomerPhone = invoice.CustomerPhone,
            BranchName = invoice.BranchName,
            StaffName = invoice.StaffName,
            Subtotal = invoice.Subtotal,
            Discount = invoice.Discount,
            Tax = invoice.Tax,
            Total = invoice.Total,
            CashGiven = invoice.CashGiven,
            ChangeDue = invoice.ChangeDue,
            OrderStatus = invoice.OrderStatus,
            PayMethod = invoice.PayMethod,
            PayStatus = invoice.PayStatus,
            SendChannel = invoice.SendChannel,
            SendStatus = invoice.SendStatus,
            Note = invoice.Note,
            PublicToken = invoice.PublicToken,
            CreatedAt = invoice.CreatedAt,
            Items = invoice.Items?.Select(item => new InvoiceItemDto
            {
                Id = item.Id,
                ProductId = item.ProductId,
                Name = item.Name,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice
            }).ToList() ?? new List<InvoiceItemDto>()
        };
    }
}
