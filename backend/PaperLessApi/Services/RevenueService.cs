using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using PaperLessApi.Data;
using PaperLessApi.DTOs;

namespace PaperLessApi.Services;

public class RevenueService : IRevenueService
{
    private readonly AppDbContext _context;

    public RevenueService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<TodayRevenueDto> GetGroceryTodayRevenueAsync(string tenantId)
    {
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);
        var yesterday = today.AddDays(-1);

        // Hóa đơn hôm nay
        var todayInvoices = await _context.Invoices
            .AsNoTracking()
            .Include(i => i.Items)
            .Where(i => i.TenantId == tenantId && i.CreatedAt >= today && i.CreatedAt < tomorrow)
            .ToListAsync();

        // Doanh thu hôm qua
        var yesterdayRevenue = await _context.Invoices
            .AsNoTracking()
            .Where(i => i.TenantId == tenantId && i.CreatedAt >= yesterday && i.CreatedAt < today)
            .SumAsync(i => (long?)i.Total) ?? 0;

        var totalRevenue = todayInvoices.Sum(i => i.Total);
        var orderCount = todayInvoices.Count;
        var avgOrder = orderCount > 0 ? totalRevenue / orderCount : 0;

        var cashRevenue = todayInvoices
            .Where(i => i.PayMethod.ToLower() == "cash")
            .Sum(i => i.Total);

        var digitalRevenue = todayInvoices
            .Where(i => i.PayMethod.ToLower() != "cash")
            .Sum(i => i.Total);

        // Biểu đồ theo giờ từ 06:00 đến 22:00
        var hourlyData = new List<HourlyRevenueDto>();
        for (int h = 6; h <= 21; h++)
        {
            var hourStr = $"{h:D2}:00";
            var inHour = todayInvoices.Where(i => i.CreatedAt.Hour == h).ToList();
            hourlyData.Add(new HourlyRevenueDto
            {
                Hour = hourStr,
                Revenue = inHour.Sum(i => i.Total),
                Orders = inHour.Count
            });
        }

        // Top sản phẩm bán chạy nhất hôm nay
        var topSelling = todayInvoices
            .SelectMany(i => i.Items)
            .GroupBy(item => item.Name)
            .Select(g => new TopProductDto
            {
                Name = g.Key,
                Quantity = g.Sum(x => x.Quantity),
                Revenue = g.Sum(x => x.Quantity * x.UnitPrice),
                Category = "Tạp hoá"
            })
            .OrderByDescending(x => x.Quantity)
            .Take(5)
            .ToList();

        return new TodayRevenueDto
        {
            TotalRevenue = totalRevenue,
            PreviousDayRevenue = yesterdayRevenue,
            OrderCount = orderCount,
            AverageOrderValue = avgOrder,
            CashRevenue = cashRevenue,
            DigitalRevenue = digitalRevenue,
            HourlyData = hourlyData,
            TopSelling = topSelling
        };
    }
}
