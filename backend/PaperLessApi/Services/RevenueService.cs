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
    private static readonly TimeSpan VnOffset = TimeSpan.FromHours(7);

    public RevenueService(IInvoiceRepository invoiceRepository)
    {
        _invoiceRepository = invoiceRepository;
    }

    /// <summary>
    /// Chuyển đổi thời gian từ UTC sang múi giờ Việt Nam (UTC+7)
    /// </summary>
    private static DateTime ToVnTime(DateTime utc)
    {
        return utc.Kind == DateTimeKind.Utc
            ? utc.Add(VnOffset)
            : DateTime.SpecifyKind(utc, DateTimeKind.Utc).Add(VnOffset);
    }

    /// <summary>
    /// Lấy ngày hôm nay theo múi giờ Việt Nam
    /// </summary>
    private static DateTime GetVnToday()
    {
        return DateTime.UtcNow.Add(VnOffset).Date;
    }

    public async Task<TodayRevenueDto> GetGroceryTodayRevenueAsync(string tenantId)
    {
        var vnToday = GetVnToday();
        var vnTomorrow = vnToday.AddDays(1);
        var vnYesterday = vnToday.AddDays(-1);

        // Quy đổi dải ngày VN sang UTC để truy vấn DB chính xác
        var startUtc = vnToday.Add(-VnOffset);
        var endUtc = vnTomorrow.Add(-VnOffset);
        var yesterdayStartUtc = vnYesterday.Add(-VnOffset);

        // Hóa đơn hôm nay theo giờ VN
        var todayInvoices = await _invoiceRepository.GetInvoicesInDateRangeAsync(tenantId, startUtc, endUtc);

        // Doanh thu hôm qua theo giờ VN
        var yesterdayRevenue = await _invoiceRepository.GetRevenueInDateRangeAsync(tenantId, yesterdayStartUtc, startUtc);

        var totalRevenue = todayInvoices.Sum(i => i.Total);
        var orderCount = todayInvoices.Count;
        var avgOrder = orderCount > 0 ? totalRevenue / orderCount : 0;

        var cashRevenue = todayInvoices
            .Where(i => i.PayMethod.ToLower() == "cash")
            .Sum(i => i.Total);

        var digitalRevenue = todayInvoices
            .Where(i => i.PayMethod.ToLower() != "cash")
            .Sum(i => i.Total);

        // Biểu đồ theo giờ từ 06:00 đến 21:00 (chuẩn giờ VN)
        var hourlyData = new List<HourlyRevenueDto>();
        for (int h = 6; h <= 21; h++)
        {
            var hourStr = $"{h:D2}:00";
            var inHour = todayInvoices.Where(i => ToVnTime(i.CreatedAt).Hour == h).ToList();
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
        var vnTargetDate = (date != null ? date.Value.Date : GetVnToday());
        var vnNextDay = vnTargetDate.AddDays(1);

        var startUtc = vnTargetDate.Add(-VnOffset);
        var endUtc = vnNextDay.Add(-VnOffset);

        var invoices = await _invoiceRepository.GetInvoicesInDateRangeAsync(tenantId, startUtc, endUtc);

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
                shiftInvs = invoices.Where(i =>
                {
                    var hour = ToVnTime(i.CreatedAt).Hour;
                    return hour >= def.Start && hour < def.End;
                }).ToList();
            }
            else
            {
                shiftInvs = invoices.Where(i =>
                {
                    var hour = ToVnTime(i.CreatedAt).Hour;
                    return hour >= def.Start || hour < def.End;
                }).ToList();
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
            Date = vnTargetDate.ToString("yyyy-MM-dd"),
            TotalRevenue = invoices.Sum(i => i.Total),
            TotalOrders = invoices.Count,
            Shifts = shifts
        };
    }

    public async Task<DailyRevenueResponseDto> GetDailyRevenueAsync(string tenantId, DateTime? from, DateTime? to)
    {
        var vnToDate = (to != null ? to.Value.Date : GetVnToday()).AddDays(1);
        var vnFromDate = (from != null ? from.Value.Date : vnToDate.AddDays(-7));

        if (vnFromDate >= vnToDate)
        {
            vnFromDate = vnToDate.AddDays(-7);
        }

        var startUtc = vnFromDate.Add(-VnOffset);
        var endUtc = vnToDate.Add(-VnOffset);

        var invoices = await _invoiceRepository.GetInvoicesInDateRangeAsync(tenantId, startUtc, endUtc);

        var days = new List<DailyRevenueItemDto>();
        for (var d = vnFromDate; d < vnToDate; d = d.AddDays(1))
        {
            var dayInvs = invoices.Where(i => ToVnTime(i.CreatedAt).Date == d).ToList();
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
        var dayCount = Math.Max(1, (vnToDate - vnFromDate).Days);

        return new DailyRevenueResponseDto
        {
            From = vnFromDate.ToString("yyyy-MM-dd"),
            To = vnToDate.AddDays(-1).ToString("yyyy-MM-dd"),
            TotalRevenue = totalRev,
            TotalOrders = totalOrders,
            AverageDailyRevenue = totalRev / dayCount,
            Days = days
        };
    }

    public async Task<WeeklyRevenueResponseDto> GetWeeklyRevenueAsync(string tenantId, int weekOffset)
    {
        var vnNow = GetVnToday();
        int diff = (7 + (int)vnNow.DayOfWeek - (int)DayOfWeek.Monday) % 7;
        var monday = vnNow.AddDays(-1 * diff).AddDays(weekOffset * 7);
        var sunday = monday.AddDays(7);

        var startUtc = monday.Add(-VnOffset);
        var endUtc = sunday.Add(-VnOffset);

        var invoices = await _invoiceRepository.GetInvoicesInDateRangeAsync(tenantId, startUtc, endUtc);

        var days = new List<DailyRevenueItemDto>();
        for (var d = monday; d < sunday; d = d.AddDays(1))
        {
            var dayInvs = invoices.Where(i => ToVnTime(i.CreatedAt).Date == d).ToList();
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
