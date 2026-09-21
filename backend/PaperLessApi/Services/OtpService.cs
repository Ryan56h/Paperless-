using System;
using System.Collections.Concurrent;
using System.Security.Cryptography;

namespace PaperLessApi.Services;

public interface IOtpService
{
    string GenerateOtp(string key, string purpose, int expiryMinutes = 10, string? aliasKey = null);
    bool VerifyOtp(string key, string code, string purpose);
    bool ConsumeOtp(string key, string code, string purpose, string? aliasKey = null);
}

public class OtpService : IOtpService
{
    private class OtpEntry
    {
        public string Code { get; set; } = string.Empty;
        public DateTimeOffset ExpiresAt { get; set; }
    }

    private readonly ConcurrentDictionary<string, OtpEntry> _otpStore = new(StringComparer.OrdinalIgnoreCase);

    private static string BuildStorageKey(string key, string purpose) => $"{purpose.Trim().ToLower()}:{key.Trim().ToLower()}";

    public string GenerateOtp(string key, string purpose, int expiryMinutes = 10, string? aliasKey = null)
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            throw new ArgumentException("Key cannot be empty", nameof(key));
        }

        // Generate a cryptographically secure 6-digit numeric OTP code
        var codeNumber = RandomNumberGenerator.GetInt32(100000, 1000000);
        var code = codeNumber.ToString("D6");

        var entry = new OtpEntry
        {
            Code = code,
            ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(expiryMinutes)
        };

        var storageKey = BuildStorageKey(key, purpose);
        _otpStore.AddOrUpdate(storageKey, entry, (_, _) => entry);

        if (!string.IsNullOrWhiteSpace(aliasKey))
        {
            var aliasStorageKey = BuildStorageKey(aliasKey, purpose);
            _otpStore.AddOrUpdate(aliasStorageKey, entry, (_, _) => entry);
        }

        return code;
    }

    public bool VerifyOtp(string key, string code, string purpose)
    {
        if (string.IsNullOrWhiteSpace(key) || string.IsNullOrWhiteSpace(code))
        {
            return false;
        }

        var storageKey = BuildStorageKey(key, purpose);
        if (_otpStore.TryGetValue(storageKey, out var entry))
        {
            if (DateTimeOffset.UtcNow <= entry.ExpiresAt && entry.Code == code.Trim())
            {
                return true;
            }
        }

        return false;
    }

    public bool ConsumeOtp(string key, string code, string purpose, string? aliasKey = null)
    {
        if (VerifyOtp(key, code, purpose))
        {
            var storageKey = BuildStorageKey(key, purpose);
            _otpStore.TryRemove(storageKey, out _);

            if (!string.IsNullOrWhiteSpace(aliasKey))
            {
                var aliasStorageKey = BuildStorageKey(aliasKey, purpose);
                _otpStore.TryRemove(aliasStorageKey, out _);
            }

            return true;
        }

        return false;
    }
}
