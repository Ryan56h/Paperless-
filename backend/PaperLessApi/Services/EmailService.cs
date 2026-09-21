using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace PaperLessApi.Services;

public interface IEmailService
{
    Task<bool> SendEmailAsync(string toEmail, string subject, string htmlBody);
    Task<bool> SendOtpEmailAsync(string toEmail, string otpCode, string purpose, string? recipientName = null);
}

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<bool> SendOtpEmailAsync(string toEmail, string otpCode, string purpose, string? recipientName = null)
    {
        var subject = $"[PaperLess+] Mã xác thực OTP: {otpCode}";
        var greeting = !string.IsNullOrWhiteSpace(recipientName) ? $"Xin chào <strong>{recipientName}</strong>," : "Xin chào bạn,";

        var htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset=""utf-8"">
    <title>Mã OTP PaperLess+</title>
</head>
<body style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f5f7; margin: 0; padding: 30px 15px;"">
    <table align=""center"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""max-width: 520px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e5e7eb;"">
        <tr>
            <td style=""background-color: #111827; padding: 28px; text-align: center;"">
                <h1 style=""color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1px;"">PaperLess<span style=""color: #10B981;"">+</span></h1>
                <p style=""color: #9CA3AF; margin: 6px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px;"">Nền tảng quản lý bán hàng thông minh</p>
            </td>
        </tr>
        <tr>
            <td style=""padding: 32px 28px;"">
                <p style=""font-size: 15px; color: #1f2937; margin-top: 0;"">{greeting}</p>
                <p style=""font-size: 14px; color: #4b5563; line-height: 1.6;"">
                    Bạn vừa yêu cầu mã OTP để <strong>{purpose}</strong> trên hệ thống PaperLess+. Dưới đây là mã xác thực 6 chữ số của bạn:
                </p>
                <div style=""text-align: center; margin: 30px 0;"">
                    <div style=""display: inline-block; background-color: #F3F4F6; border: 2px dashed #10B981; border-radius: 10px; padding: 16px 36px;"">
                        <span style=""font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #111827; font-family: monospace;"">{otpCode}</span>
                    </div>
                </div>
                <p style=""font-size: 13px; color: #6b7280; line-height: 1.5; margin-bottom: 0;"">
                    ⏱️ Mã xác thực này có hiệu lực trong vòng <strong>10 phút</strong>.<br>
                    🔒 Vì lý do an toàn, vui lòng tuyệt đối không chia sẻ mã này cho bất kỳ ai.
                </p>
            </td>
        </tr>
        <tr>
            <td style=""background-color: #F9FAFB; padding: 20px 28px; border-top: 1px solid #E5E7EB; text-align: center;"">
                <p style=""font-size: 12px; color: #9CA3AF; margin: 0;"">
                    Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này hoặc liên hệ bộ phận hỗ trợ PaperLess+.
                </p>
                <p style=""font-size: 11px; color: #D1D5DB; margin: 8px 0 0 0;"">
                    © 2026 PaperLess+ SaaS Platform. All rights reserved.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>";

        return await SendEmailAsync(toEmail, subject, htmlBody);
    }

    public async Task<bool> SendEmailAsync(string toEmail, string subject, string htmlBody)
    {
        var smtpServer = _configuration["EmailSettings:SmtpServer"] ?? "smtp.gmail.com";
        var portStr = _configuration["EmailSettings:Port"] ?? "587";
        var senderEmail = _configuration["EmailSettings:SenderEmail"] ?? "";
        var senderName = _configuration["EmailSettings:SenderName"] ?? "PaperLess+";
        var password = _configuration["EmailSettings:Password"] ?? "";
        var enableSsl = bool.TryParse(_configuration["EmailSettings:EnableSsl"], out var ssl) ? ssl : true;

        int port = int.TryParse(portStr, out var p) ? p : 587;

        if (string.IsNullOrWhiteSpace(senderEmail) || string.IsNullOrWhiteSpace(password))
        {
            _logger.LogWarning("⚠️ [EmailService] SMTP chưa được cấu hình trong appsettings.json. Email gửi tới {ToEmail} với tiêu đề '{Subject}'.", toEmail, subject);
            return false;
        }

        try
        {
            using var client = new SmtpClient(smtpServer, port)
            {
                Credentials = new NetworkCredential(senderEmail, password),
                EnableSsl = enableSsl
            };

            using var message = new MailMessage
            {
                From = new MailAddress(senderEmail, senderName),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true
            };

            message.To.Add(toEmail);
            await client.SendMailAsync(message);

            _logger.LogInformation("✅ [EmailService] Đã gửi email thành công tới {ToEmail}", toEmail);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ [EmailService] Lỗi khi gửi email tới {ToEmail}: {ErrorMessage}", toEmail, ex.Message);
            return false;
        }
    }
}
