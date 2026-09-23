using System.Threading.Tasks;
using PaperLessApi.DTOs;

namespace PaperLessApi.Services;

public interface IRevenueService
{
    Task<TodayRevenueDto> GetGroceryTodayRevenueAsync(string tenantId);
}
