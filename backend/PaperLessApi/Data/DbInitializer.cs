using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using PaperLessApi.Models;

namespace PaperLessApi.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        await context.Database.MigrateAsync();

        if (await context.Plans.AnyAsync())
        {
            return;
        }

        var freePlan = new Plan
        {
            Id = "free",
            Name = "Gói Cơ Bản (Free Trial)",
            Price = 0,
            MaxInvoicesMonth = 100,
            MaxMsgMonth = 100,
            IsActive = true
        };

        var proPlan = new Plan
        {
            Id = "pro",
            Name = "Gói Chuyên Nghiệp (Pro)",
            Price = 499000,
            MaxInvoicesMonth = 5000,
            MaxMsgMonth = 5000,
            IsActive = true
        };

        context.Plans.AddRange(freePlan, proPlan);

        var tenant = new Tenant
        {
            Id = "tenant-demo",
            Name = "PaperLess Coffee & Bakery",
            TaxCode = "0312345678",
            Phone = "0909000111",
            Email = "contact@paperless.vn",
            Status = "active",
            PlanId = proPlan.Id
        };
        context.Tenants.Add(tenant);

        var branch = new Branch
        {
            Id = "branch-q1",
            TenantId = tenant.Id,
            Name = "Chi nhánh Quận 1",
            Address = "123 Nguyễn Thị Minh Khai, P. Bến Thành, Q.1, TP.HCM"
        };
        context.Branches.Add(branch);

        var hashedPass = BCrypt.Net.BCrypt.HashPassword("123456");

        var owner = new User
        {
            Id = "user-owner",
            TenantId = tenant.Id,
            BranchId = branch.Id,
            FullName = "Nguyễn Văn Chủ",
            Email = "owner@paperless.vn",
            Phone = "0909000111",
            PasswordHash = hashedPass,
            Role = "owner"
        };

        var manager = new User
        {
            Id = "user-manager",
            TenantId = tenant.Id,
            BranchId = branch.Id,
            FullName = "Lê Thanh Tùng",
            Email = "manager@paperless.vn",
            Phone = "0909000222",
            PasswordHash = hashedPass,
            Role = "manager"
        };

        var staff = new User
        {
            Id = "user-staff",
            TenantId = tenant.Id,
            BranchId = branch.Id,
            FullName = "Nguyễn Bảo Trân",
            Email = "staff@paperless.vn",
            Phone = "0909000333",
            PasswordHash = hashedPass,
            Role = "staff"
        };

        context.Users.AddRange(owner, manager, staff);

        var products = new List<Product>
        {
            new() { Id = "SP001", TenantId = tenant.Id, Name = "Cà phê sữa đá", Category = "Cà phê", Price = 45000 },
            new() { Id = "SP002", TenantId = tenant.Id, Name = "Bánh croissant", Category = "Bánh ngọt", Price = 35000 },
            new() { Id = "SP003", TenantId = tenant.Id, Name = "Trà sữa trân châu", Category = "Trà sữa", Price = 55000 },
            new() { Id = "SP004", TenantId = tenant.Id, Name = "Sandwich gà", Category = "Bánh mỳ", Price = 65000 },
            new() { Id = "SP005", TenantId = tenant.Id, Name = "Nước cam tươi", Category = "Nước ép", Price = 40000 },
            new() { Id = "SP006", TenantId = tenant.Id, Name = "Cà phê Americano", Category = "Cà phê", Price = 50000 },
            new() { Id = "SP007", TenantId = tenant.Id, Name = "Bánh tiramisu", Category = "Bánh ngọt", Price = 75000 },
            new() { Id = "SP008", TenantId = tenant.Id, Name = "Trà đào cam sả", Category = "Nước ép", Price = 48000 },
        };
        context.Products.AddRange(products);

        var customers = new List<Customer>
        {
            new() { Id = "KH001", TenantId = tenant.Id, Name = "Nguyễn Văn An", Phone = "0901234567", Points = 1250, Tier = "gold", TotalSpent = 12500000, TotalOrders = 18 },
            new() { Id = "KH002", TenantId = tenant.Id, Name = "Trần Thị Bích", Phone = "0912345678", Points = 320, Tier = "silver", TotalSpent = 3200000, TotalOrders = 7 },
            new() { Id = "KH003", TenantId = tenant.Id, Name = "Lê Minh Cường", Phone = "0923456789", Points = 80, Tier = "bronze", TotalSpent = 800000, TotalOrders = 2 },
            new() { Id = "KH004", TenantId = tenant.Id, Name = "Phạm Thị Dung", Phone = "0934567890", Points = 4800, Tier = "diamond", TotalSpent = 48000000, TotalOrders = 64 },
            new() { Id = "KH005", TenantId = tenant.Id, Name = "Hoàng Văn Em", Phone = "0945678901", Points = 590, Tier = "silver", TotalSpent = 5900000, TotalOrders = 11 },
            new() { Id = "KH006", TenantId = tenant.Id, Name = "Vũ Thị Phương", Phone = "0956789012", Points = 2100, Tier = "gold", TotalSpent = 21000000, TotalOrders = 29 },
            new() { Id = "KH007", TenantId = tenant.Id, Name = "Đặng Minh Quân", Phone = "0967890123", Points = 140, Tier = "bronze", TotalSpent = 1400000, TotalOrders = 4 },
            new() { Id = "KH008", TenantId = tenant.Id, Name = "Bùi Thị Hoa", Phone = "0978901234", Points = 3600, Tier = "diamond", TotalSpent = 36000000, TotalOrders = 47 }
        };
        context.Customers.AddRange(customers);

        var vouchers = new List<Voucher>
        {
            new() { Id = "V001", TenantId = tenant.Id, Code = "WELCOME10", DiscountType = "percent", DiscountValue = 10, MinOrder = 100000, Expiry = "2026-12-31", Status = "active", UsageCount = 45, MaxUsage = 200 },
            new() { Id = "V002", TenantId = tenant.Id, Code = "SUMMER50K", DiscountType = "fixed", DiscountValue = 50000, MinOrder = 300000, Expiry = "2026-12-31", Status = "active", UsageCount = 12, MaxUsage = 100 },
            new() { Id = "V003", TenantId = tenant.Id, Code = "GOLD20", DiscountType = "percent", DiscountValue = 20, MinOrder = 200000, Expiry = "2026-05-01", Status = "expired", UsageCount = 88, MaxUsage = 100 },
            new() { Id = "V004", TenantId = tenant.Id, Code = "LOYAL5K", DiscountType = "fixed", DiscountValue = 5000, MinOrder = 50000, Expiry = "2026-12-31", Status = "active", UsageCount = 230, MaxUsage = 500 },
            new() { Id = "V005", TenantId = tenant.Id, Code = "FLASH30", DiscountType = "percent", DiscountValue = 30, MinOrder = 150000, Expiry = "2026-05-20", Status = "expired", UsageCount = 100, MaxUsage = 100 }
        };
        context.Vouchers.AddRange(vouchers);

        await context.SaveChangesAsync();
    }
}
