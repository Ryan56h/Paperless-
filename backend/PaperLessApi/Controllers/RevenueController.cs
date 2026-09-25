using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using PaperLessApi.DTOs;
using PaperLessApi.Services;

namespace PaperLessApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RevenueController : ControllerBase
{
    private readonly IRevenueService _revenueService;

    public RevenueController(IRevenueService revenueService)
    {
        _revenueService = revenueService;
    }

    private string GetTenantId()
    {
        var tenantId = User.FindFirstValue("tenant_id");
        return !string.IsNullOrEmpty(tenantId) ? tenantId : "BIZ-GROCERY-01";
    }

    [HttpGet("grocery/today")]
    public async Task<ActionResult<TodayRevenueDto>> GetGroceryTodayRevenue()
    {
        var tenantId = GetTenantId();
        var revenue = await _revenueService.GetGroceryTodayRevenueAsync(tenantId);
        return Ok(revenue);
    }

    [HttpGet("shift")]
    public async Task<ActionResult<ShiftRevenueResponseDto>> GetShiftRevenue([FromQuery] System.DateTime? date)
    {
        var tenantId = GetTenantId();
        var result = await _revenueService.GetShiftRevenueAsync(tenantId, date);
        return Ok(result);
    }

    [HttpGet("daily")]
    public async Task<ActionResult<DailyRevenueResponseDto>> GetDailyRevenue([FromQuery] System.DateTime? from, [FromQuery] System.DateTime? to)
    {
        var tenantId = GetTenantId();
        var result = await _revenueService.GetDailyRevenueAsync(tenantId, from, to);
        return Ok(result);
    }

    [HttpGet("weekly")]
    public async Task<ActionResult<WeeklyRevenueResponseDto>> GetWeeklyRevenue([FromQuery] int offset = 0)
    {
        var tenantId = GetTenantId();
        var result = await _revenueService.GetWeeklyRevenueAsync(tenantId, offset);
        return Ok(result);
    }
}
