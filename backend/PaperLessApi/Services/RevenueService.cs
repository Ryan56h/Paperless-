using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using PaperLessApi.DTOs;
using PaperLessApi.Models;
using PaperLessApi.Repositories;

namespace PaperLessApi.Services;

public class RevenueService : IRevenueService
{
    private readonly IInvoiceRepository _invoiceRepository;

    public RevenueService(IInvoiceRepository invoiceRepository)
    {
        _invoiceRepository = invoiceRepository;
    }

    public async Task<TodayRevenueDto> GetGroceryTodayRevenueAsync(string tenantId)
    {
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);
        var yesterday = today.AddDays(-1);

        // Hóa đơn hôm nay qua InvoiceRepository
        var todayInvoices = await _invoiceRepository.GetInvoicesInDateRangeAsync(tenantId, today, tomorrow);

        // Doanh thu hôm qua qua InvoiceRepository
        var yesterdayRevenue = await _invoiceRepository.GetRevenueInDateRangeAsync(tenantId, yesterday, today);

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

    public async Task<ShiftRevenueResponseDto> GetShiftRevenueAsync(string tenantId, DateTime? date)
    {
        var targetDate = (date ?? DateTime.UtcNow).Date;
        var nextDay = targetDate.AddDays(1);
        var invoices = await _invoiceRepository.GetInvoicesInDateRangeAsync(tenantId, targetDate, nextDay);

        var shiftDefinitions = new[]
        {
            new { Name = "Ca sáng", Range = "06:00 - 12:00", Start = 6, End = 12 },
            new { Name = "Ca chiều", Range = "12:00 - 18:00", Start = 12, End = 18 },
            new { Name = "Ca tối", Range = "18:00 - 22:00", Start = 18, End = 22 },
            new { Name = "Ca đêm", Range = "22:00 - 06:00", Start = 22, End = 6 }
        };

        var shifts = new List<ShiftRevenueDto>();

        foreach (var def in shiftDefinitions)
        {
            List<Invoice> shiftInvs;
            if (def.Start < def.End)
            {
                shiftInvs = invoices.Where(i => i.CreatedAt.Hour >= def.Start && i.CreatedAt.Hour < def.End).ToList();
            }
            else
            {
                shiftInvs = invoices.Where(i => i.CreatedAt.Hour >= def.Start || i.CreatedAt.Hour < def.End).ToList();
            }

            shifts.Add(new ShiftRevenueDto
            {
                ShiftName = def.Name,
                TimeRange = def.Range,
                TotalRevenue = shiftInvs.Sum(i => i.Total),
                OrderCount = shiftInvs.Count,
                CashRevenue = shiftInvs.Where(i => i.PayMethod.ToLower() == "cash").Sum(i => i.Total),
                DigitalRevenue = shiftInvs.Where(i => i.PayMethod.ToLower() != "cash").Sum(i => i.Total)
            });
        }

        return new ShiftRevenueResponseDto
        {
            Date = targetDate.ToString("yyyy-MM-dd"),
            TotalRevenue = invoices.Sum(i => i.Total),
            TotalOrders = invoices.Count,
            Shifts = shifts
        };
    }

    public async Task<DailyRevenueResponseDto> GetDailyRevenueAsync(string tenantId, DateTime? from, DateTime? to)
    {
        var toDate = (to ?? DateTime.UtcNow).Date.AddDays(1);
        var fromDate = (from ?? toDate.AddDays(-7)).Date;

        if (fromDate >= toDate)
        {
            fromDate = toDate.AddDays(-7);
        }

        var invoices = await _invoiceRepository.GetInvoicesInDateRangeAsync(tenantId, fromDate, toDate);

        var days = new List<DailyRevenueItemDto>();
        for (var d = fromDate; d < toDate; d = d.AddDays(1))
        {
            var dayInvs = invoices.Where(i => i.CreatedAt.Date == d).ToList();
            var dayTotal = dayInvs.Sum(i => i.Total);

            days.Add(new DailyRevenueItemDto
            {
                Date = d.ToString("yyyy-MM-dd"),
                DayOfWeek = GetVietnameseDayOfWeek(d.DayOfWeek),
                TotalRevenue = dayTotal,
                OrderCount = dayInvs.Count,
                CashRevenue = dayInvs.Where(i => i.PayMethod.ToLower() == "cash").Sum(i => i.Total),
                DigitalRevenue = dayInvs.Where(i => i.PayMethod.ToLower() != "cash").Sum(i => i.Total)
            });
        }

        var totalRev = invoices.Sum(i => i.Total);
        var totalOrders = invoices.Count;
        var dayCount = Math.Max(1, (toDate - fromDate).Days);

        return new DailyRevenueResponseDto
        {
            From = fromDate.ToString("yyyy-MM-dd"),
            To = toDate.AddDays(-1).ToString("yyyy-MM-dd"),
            TotalRevenue = totalRev,
            TotalOrders = totalOrders,
            AverageDailyRevenue = totalRev / dayCount,
            Days = days
        };
    }

    public async Task<WeeklyRevenueResponseDto> GetWeeklyRevenueAsync(string tenantId, int weekOffset)
    {
        var now = DateTime.UtcNow.Date;
        int diff = (7 + (int)now.DayOfWeek - (int)DayOfWeek.Monday) % 7;
        var monday = now.AddDays(-1 * diff).AddDays(weekOffset * 7);
        var sunday = monday.AddDays(7);

        var invoices = await _invoiceRepository.GetInvoicesInDateRangeAsync(tenantId, monday, sunday);

        var days = new List<DailyRevenueItemDto>();
        for (var d = monday; d < sunday; d = d.AddDays(1))
        {
            var dayInvs = invoices.Where(i => i.CreatedAt.Date == d).ToList();
            days.Add(new DailyRevenueItemDto
            {
                Date = d.ToString("yyyy-MM-dd"),
                DayOfWeek = GetVietnameseDayOfWeek(d.DayOfWeek),
                TotalRevenue = dayInvs.Sum(i => i.Total),
                OrderCount = dayInvs.Count,
                CashRevenue = dayInvs.Where(i => i.PayMethod.ToLower() == "cash").Sum(i => i.Total),
                DigitalRevenue = dayInvs.Where(i => i.PayMethod.ToLower() != "cash").Sum(i => i.Total)
            });
        }

        string weekLabel = weekOffset switch
        {
            0 => "Tuần này",
            -1 => "Tuần trước",
            _ => $"Tuần ({monday:dd/MM} - {sunday.AddDays(-1):dd/MM})"
        };

        return new WeeklyRevenueResponseDto
        {
            WeekLabel = weekLabel,
            From = monday.ToString("yyyy-MM-dd"),
            To = sunday.AddDays(-1).ToString("yyyy-MM-dd"),
            TotalRevenue = invoices.Sum(i => i.Total),
            TotalOrders = invoices.Count,
            Days = days
        };
    }

    private static string GetVietnameseDayOfWeek(DayOfWeek dow) => dow switch
    {
        DayOfWeek.Monday => "Thứ 2",
        DayOfWeek.Tuesday => "Thứ 3",
        DayOfWeek.Wednesday => "Thứ 4",
        DayOfWeek.Thursday => "Thứ 5",
        DayOfWeek.Friday => "Thứ 6",
        DayOfWeek.Saturday => "Thứ 7",
        DayOfWeek.Sunday => "Chủ nhật",
        _ => dow.ToString()
    };
}
