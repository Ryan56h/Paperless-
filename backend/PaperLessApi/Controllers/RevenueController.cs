using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PaperLessApi.DTOs;
using PaperLessApi.Services;

namespace PaperLessApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class RevenueController : ControllerBase
{
    private readonly IRevenueService _revenueService;

    public RevenueController(IRevenueService revenueService)
    {
        _revenueService = revenueService;
    }

    private string? GetTenantId(string? requestedTenantId = null)
    {
        if (User.IsInRole("admin") && !string.IsNullOrWhiteSpace(requestedTenantId))
        {
            return requestedTenantId;
        }
        return User.FindFirstValue("tenant_id");
    }

    [HttpGet("grocery/today")]
    public async Task<ActionResult<TodayRevenueDto>> GetGroceryTodayRevenue([FromQuery] string? tenantId)
    {
        var tid = GetTenantId(tenantId);
        if (string.IsNullOrEmpty(tid))
        {
            return Unauthorized(new { message = "Không xác định được thông tin cửa hàng của bạn." });
        }

        var revenue = await _revenueService.GetGroceryTodayRevenueAsync(tid);
        return Ok(revenue);
    }

    [HttpGet("shift")]
    public async Task<ActionResult<ShiftRevenueResponseDto>> GetShiftRevenue(
        [FromQuery] System.DateTime? date,
        [FromQuery] string? tenantId)
    {
        var tid = GetTenantId(tenantId);
        if (string.IsNullOrEmpty(tid))
        {
            return Unauthorized(new { message = "Không xác định được thông tin cửa hàng của bạn." });
        }

        var result = await _revenueService.GetShiftRevenueAsync(tid, date);
        return Ok(result);
    }

    [HttpGet("daily")]
    public async Task<ActionResult<DailyRevenueResponseDto>> GetDailyRevenue(
        [FromQuery] System.DateTime? from,
        [FromQuery] System.DateTime? to,
        [FromQuery] string? tenantId)
    {
        var tid = GetTenantId(tenantId);
        if (string.IsNullOrEmpty(tid))
        {
            return Unauthorized(new { message = "Không xác định được thông tin cửa hàng của bạn." });
        }

        var result = await _revenueService.GetDailyRevenueAsync(tid, from, to);
        return Ok(result);
    }

    [HttpGet("weekly")]
    public async Task<ActionResult<WeeklyRevenueResponseDto>> GetWeeklyRevenue(
        [FromQuery] int offset = 0,
        [FromQuery] string? tenantId = null)
    {
        var tid = GetTenantId(tenantId);
        if (string.IsNullOrEmpty(tid))
        {
            return Unauthorized(new { message = "Không xác định được thông tin cửa hàng của bạn." });
        }

        var result = await _revenueService.GetWeeklyRevenueAsync(tid, offset);
        return Ok(result);
    }
}

