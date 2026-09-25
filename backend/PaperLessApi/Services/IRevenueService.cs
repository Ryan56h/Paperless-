using System;
using System.Threading.Tasks;
using PaperLessApi.DTOs;

namespace PaperLessApi.Services;

public interface IRevenueService
{
    Task<TodayRevenueDto> GetGroceryTodayRevenueAsync(string tenantId);
    Task<ShiftRevenueResponseDto> GetShiftRevenueAsync(string tenantId, DateTime? date);
    Task<DailyRevenueResponseDto> GetDailyRevenueAsync(string tenantId, DateTime? from, DateTime? to);
    Task<WeeklyRevenueResponseDto> GetWeeklyRevenueAsync(string tenantId, int weekOffset);
}
