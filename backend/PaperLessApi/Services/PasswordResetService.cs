using System;
using System.Collections.Concurrent;
using System.Security.Cryptography;

namespace PaperLessApi.Services;

public interface IPasswordResetService
{
    string GenerateResetCode(string identifier);
    bool VerifyResetCode(string identifier, string code);
    bool ConsumeResetCode(string identifier, string code);
}

public class PasswordResetService : IPasswordResetService
{
    private class ResetCodeEntry
    {
        public string Code { get; set; } = string.Empty;
        public DateTimeOffset ExpiresAt { get; set; }
    }

    private readonly ConcurrentDictionary<string, ResetCodeEntry> _resetCodes = new(StringComparer.OrdinalIgnoreCase);

    public string GenerateResetCode(string identifier)
    {
        // Generate a secure 6-digit numeric OTP code
        var codeNumber = RandomNumberGenerator.GetInt32(100000, 1000000);
        var code = codeNumber.ToString("D6");

        var entry = new ResetCodeEntry
        {
            Code = code,
            ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(15) // Code valid for 15 minutes
        };

        _resetCodes.AddOrUpdate(identifier.Trim(), entry, (_, _) => entry);
        return code;
    }

    public bool VerifyResetCode(string identifier, string code)
    {
        if (string.IsNullOrWhiteSpace(identifier) || string.IsNullOrWhiteSpace(code))
        {
            return false;
        }

        if (_resetCodes.TryGetValue(identifier.Trim(), out var entry))
        {
            if (DateTimeOffset.UtcNow <= entry.ExpiresAt && entry.Code == code.Trim())
            {
                return true;
            }
        }

        return false;
    }

    public bool ConsumeResetCode(string identifier, string code)
    {
        if (VerifyResetCode(identifier, code))
        {
            _resetCodes.TryRemove(identifier.Trim(), out _);
            return true;
        }

        return false;
    }
}
