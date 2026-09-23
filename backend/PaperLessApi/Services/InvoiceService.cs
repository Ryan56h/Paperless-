using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using PaperLessApi.Data;
using PaperLessApi.DTOs;
using PaperLessApi.Models;
using PaperLessApi.Repositories;

namespace PaperLessApi.Services;

public class InvoiceService : IInvoiceService
{
    private readonly AppDbContext _context;
    private readonly IInvoiceRepository? _repository;

    public InvoiceService(AppDbContext context, IInvoiceRepository? repository = null)
    {
        _context = context;
        _repository = repository;
    }

    public async Task<Invoice?> GetInvoiceAsync(string id)
    {
        if (_repository != null) return await _repository.GetInvoiceByIdAsync(id);
        return await _context.Invoices.Include(i => i.Items).FirstOrDefaultAsync(i => i.Id == id);
    }

    public async Task<Invoice?> GetLatestInvoiceAsync()
    {
        if (_repository != null) return await _repository.GetLatestInvoiceAsync();
        return await _context.Invoices.Include(i => i.Items).OrderByDescending(i => i.CreatedAt).FirstOrDefaultAsync();
    }

    public async Task<(bool Success, string Message, Invoice? Invoice)> CreateInvoiceAsync(Invoice invoice)
    {
        if (_repository != null)
        {
            if (await _repository.ExistsAsync(invoice.Id))
            {
                return (false, "Hóa đơn này đã tồn tại!", null);
            }

            invoice.CreatedAt = DateTime.UtcNow;
            var createdInvoice = await _repository.AddInvoiceAsync(invoice);
            return (true, "Tạo hóa đơn thành công", createdInvoice);
        }

        if (await _context.Invoices.AnyAsync(i => i.Id == invoice.Id))
        {
            return (false, "Hóa đơn này đã tồn tại!", null);
        }

        invoice.CreatedAt = DateTime.UtcNow;
        _context.Invoices.Add(invoice);
        await _context.SaveChangesAsync();
        return (true, "Tạo hóa đơn thành công", invoice);
    }

    public async Task<InvoiceDto> CreateInvoiceAsync(
        string tenantId,
        string staffName,
        string? branchId,
        CreateInvoiceRequest request)
    {
        var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId);
        var branchName = tenant?.Name ?? "Cửa hàng Tạp hoá";

        var today = DateTime.UtcNow.Date;
        var todayStr = DateTime.UtcNow.ToString("yyyyMMdd");

        // Tính ticketNumber cho ngày hôm nay
        var maxTicketToday = await _context.Invoices
            .Where(i => i.TenantId == tenantId && i.CreatedAt >= today)
            .MaxAsync(i => (int?)i.TicketNumber) ?? 100;
        var nextTicket = maxTicketToday + 1;

        // Mã hóa đơn duy nhất toàn hệ thống (tránh xung đột PK giữa các Tenant)
        var globalCountToday = await _context.Invoices
            .Where(i => i.CreatedAt >= today)
            .CountAsync();

        string invoiceId;
        int seq = globalCountToday + 1;
        do
        {
            invoiceId = $"PL-{todayStr}-{seq:D3}";
            seq++;
        } while (await _context.Invoices.AnyAsync(i => i.Id == invoiceId));

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

            // Giảm tồn kho nếu có ProductId
            if (!string.IsNullOrEmpty(item.ProductId))
            {
                var prod = await _context.Products.FirstOrDefaultAsync(p => p.Id == item.ProductId && p.TenantId == tenantId);
                if (prod != null && prod.Stock >= item.Quantity)
                {
                    prod.Stock -= item.Quantity;
                }
            }
        }

        long tax = 0;
        long discount = 0;
        long total = subtotal + tax - discount;
        long cashGiven = request.CashGiven > 0 ? request.CashGiven : total;
        long changeDue = Math.Max(0, cashGiven - total);

        // Khách hàng thân thiết nếu có SĐT
        Customer? customer = null;
        var phone = request.CustomerPhone?.Trim();
        if (!string.IsNullOrEmpty(phone))
        {
            customer = await _context.Customers.FirstOrDefaultAsync(c => c.TenantId == tenantId && c.Phone == phone);
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
                _context.Customers.Add(customer);
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

        _context.Invoices.Add(invoice);
        await _context.SaveChangesAsync();

        return MapToDto(invoice);
    }

    public async Task<List<InvoiceDto>> GetInvoicesAsync(string tenantId, string? status, int limit)
    {
        var query = _context.Invoices
            .AsNoTracking()
            .Include(i => i.Items)
            .Where(i => i.TenantId == tenantId);

        if (!string.IsNullOrWhiteSpace(status))
        {
            var statuses = status.Split(',').Select(s => s.Trim().ToLower()).ToList();
            query = query.Where(i => statuses.Contains(i.OrderStatus.ToLower()));
        }

        var invoices = await query
            .OrderByDescending(i => i.CreatedAt)
            .Take(limit)
            .ToListAsync();

        return invoices.Select(MapToDto).ToList();
    }

    public async Task<InvoiceDto?> GetInvoiceByIdAsync(string id)
    {
        var invoice = await _context.Invoices
            .AsNoTracking()
            .Include(i => i.Items)
            .FirstOrDefaultAsync(i => i.Id == id);

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

        var invoices = await _context.Invoices
            .AsNoTracking()
            .Include(i => i.Items)
            .Where(i => i.Id.ToUpper() == cleanQuery ||
                        i.CustomerPhone == query.Trim() ||
                        (!string.IsNullOrEmpty(phoneDigits) && i.CustomerPhone.Contains(phoneDigits)))
            .OrderByDescending(i => i.CreatedAt)
            .Take(20)
            .ToListAsync();

        return invoices.Select(MapToDto).ToList();
    }

    public async Task<bool> UpdateOrderStatusAsync(string id, string status)
    {
        var invoice = await _context.Invoices.FirstOrDefaultAsync(i => i.Id == id);
        if (invoice == null) return false;

        invoice.OrderStatus = status.ToLower();
        await _context.SaveChangesAsync();
        return true;
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
