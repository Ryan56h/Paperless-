using System;

namespace PaperLessApi.Services;

public interface IPasswordResetService
{
    string GenerateResetCode(string identifier, string? aliasIdentifier = null);
    bool VerifyResetCode(string identifier, string code);
    bool ConsumeResetCode(string identifier, string code, string? aliasIdentifier = null);
}

public class PasswordResetService : IPasswordResetService
{
    private readonly IOtpService _otpService;

    public PasswordResetService(IOtpService otpService)
    {
        _otpService = otpService;
    }

    public string GenerateResetCode(string identifier, string? aliasIdentifier = null)
    {
        return _otpService.GenerateOtp(identifier, "password_reset", 15, aliasIdentifier);
    }

    public bool VerifyResetCode(string identifier, string code)
    {
        return _otpService.VerifyOtp(identifier, code, "password_reset");
    }

    public bool ConsumeResetCode(string identifier, string code, string? aliasIdentifier = null)
    {
        return _otpService.ConsumeOtp(identifier, code, "password_reset", aliasIdentifier);
    }
}
