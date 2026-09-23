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

        if (!await context.Plans.AnyAsync())
        {
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
            await context.SaveChangesAsync();
        }

        var defaultPlanId = (await context.Plans.FirstOrDefaultAsync(p => p.Id == "pro"))?.Id ?? "free";
        var defaultPasswordHash = BCrypt.Net.BCrypt.HashPassword("123456");

        if (!await context.Tenants.AnyAsync(t => t.Id == "BIZ-GROCERY-01"))
        {
            var groceryTenant = new Tenant
            {
                Id = "BIZ-GROCERY-01",
                Name = "Tạp Hóa & Siêu Thị Mini Minh Phát",
                BusinessType = "grocery",
                OwnerName = "Nguyễn Văn Minh",
                Phone = "0908123456",
                Email = "minhphat.mart@gmail.com",
                Address = "124 Đường 3/2, Quận 10, TP. Hồ Chí Minh",
                TaxCode = "0312984512",
                Status = "active",
                PlanId = defaultPlanId
            };
            context.Tenants.Add(groceryTenant);

            var groceryBranch = new Branch
            {
                Id = "branch-grocery-01",
                TenantId = groceryTenant.Id,
                Name = "Cửa Hàng Minh Phát - Q10",
                Address = "124 Đường 3/2, Quận 10, TP. Hồ Chí Minh"
            };
            context.Branches.Add(groceryBranch);

            if (!await context.Users.AnyAsync(u => u.Email == "minhphat.mart@gmail.com"))
            {
                var groceryOwner = new User
                {
                    Id = "user-grocery-owner",
                    TenantId = groceryTenant.Id,
                    BranchId = groceryBranch.Id,
                    FullName = "Nguyễn Văn Minh",
                    Email = "minhphat.mart@gmail.com",
                    Phone = "0908123456",
                    PasswordHash = defaultPasswordHash,
                    BusinessType = "grocery"
                };
                context.Users.Add(groceryOwner);
            }

            var groceryProducts = new List<Product>
            {
                new() { Id = "SPG001", TenantId = groceryTenant.Id, Name = "Gạo ST25 Ông Cua (5kg)", Category = "Lương thực", Price = 210000, Unit = "Túi", Barcode = "893123456701", Popular = true },
                new() { Id = "SPG002", TenantId = groceryTenant.Id, Name = "Dầu ăn Simply 1L", Category = "Gia vị", Price = 58000, Unit = "Chai", Barcode = "893123456702", Popular = true },
                new() { Id = "SPG003", TenantId = groceryTenant.Id, Name = "Nước mắm Nam Ngư 750ml", Category = "Gia vị", Price = 36000, Unit = "Chai", Barcode = "893123456703", Popular = true },
                new() { Id = "SPG004", TenantId = groceryTenant.Id, Name = "Sữa tươi Vinamilk có đường 1L", Category = "Sữa - Bơ", Price = 34000, Unit = "Hộp", Barcode = "893123456704", Popular = true },
                new() { Id = "SPG005", TenantId = groceryTenant.Id, Name = "Mì Hảo Hảo tôm chua cay (thùng)", Category = "Mì gói", Price = 118000, Unit = "Thùng", Barcode = "893123456705", Popular = true },
                new() { Id = "SPG006", TenantId = groceryTenant.Id, Name = "Trứng gà Ba Huân (vỉ 10)", Category = "Thực phẩm", Price = 32000, Unit = "Vỉ", Barcode = "893123456706", Popular = true },
                new() { Id = "SPG007", TenantId = groceryTenant.Id, Name = "Bột giặt OMO Comfort 3.6kg", Category = "Chăm sóc nhà cửa", Price = 185000, Unit = "Túi", Barcode = "893123456707", Popular = false },
                new() { Id = "SPG008", TenantId = groceryTenant.Id, Name = "Nước rửa chén Sunlight 750g", Category = "Chăm sóc nhà cửa", Price = 28000, Unit = "Chai", Barcode = "893123456708", Popular = false }
            };
            context.Products.AddRange(groceryProducts);

            var groceryCustomers = new List<Customer>
            {
                new() { Id = "KHG001", TenantId = groceryTenant.Id, Name = "Nguyễn Văn An", Phone = "0901234567", Points = 1250, Tier = "gold", TotalSpent = 12500000, TotalOrders = 18 },
                new() { Id = "KHG002", TenantId = groceryTenant.Id, Name = "Trần Thị Bích", Phone = "0912345678", Points = 320, Tier = "silver", TotalSpent = 3200000, TotalOrders = 7 },
                new() { Id = "KHG003", TenantId = groceryTenant.Id, Name = "Lê Minh Cường", Phone = "0923456789", Points = 80, Tier = "bronze", TotalSpent = 800000, TotalOrders = 2 }
            };
            context.Customers.AddRange(groceryCustomers);

            var groceryVouchers = new List<Voucher>
            {
                new() { Id = "VG001", TenantId = groceryTenant.Id, Code = "TAPHOA10", DiscountType = "percent", DiscountValue = 10, MinOrder = 100000, Expiry = "2026-12-31", Status = "active", UsageCount = 20, MaxUsage = 200 },
                new() { Id = "VG002", TenantId = groceryTenant.Id, Code = "GIAM30K", DiscountType = "fixed", DiscountValue = 30000, MinOrder = 250000, Expiry = "2026-12-31", Status = "active", UsageCount = 15, MaxUsage = 100 }
            };
            context.Vouchers.AddRange(groceryVouchers);

            await context.SaveChangesAsync();
        }

        if (!await context.Tenants.AnyAsync(t => t.Id == "BIZ-CAFE-01"))
        {
            var cafeTenant = new Tenant
            {
                Id = "BIZ-CAFE-01",
                Name = "Mộc Lan Cafe & Bakery",
                BusinessType = "cafe",
                OwnerName = "Trần Thu Hương",
                Phone = "0912888999",
                Email = "moclan.coffee@gmail.com",
                Address = "45 Nguyễn Đình Chiểu, Quận 3, TP. Hồ Chí Minh",
                TaxCode = "0318524796",
                Status = "active",
                PlanId = defaultPlanId
            };
            context.Tenants.Add(cafeTenant);

            var cafeBranch = new Branch
            {
                Id = "branch-cafe-01",
                TenantId = cafeTenant.Id,
                Name = "Quán Mộc Lan - Q3",
                Address = "45 Nguyễn Đình Chiểu, Quận 3, TP. Hồ Chí Minh"
            };
            context.Branches.Add(cafeBranch);

            if (!await context.Users.AnyAsync(u => u.Email == "moclan.coffee@gmail.com"))
            {
                var cafeOwner = new User
                {
                    Id = "user-cafe-owner",
                    TenantId = cafeTenant.Id,
                    BranchId = cafeBranch.Id,
                    FullName = "Trần Thu Hương",
                    Email = "moclan.coffee@gmail.com",
                    Phone = "0912888999",
                    PasswordHash = defaultPasswordHash,
                    BusinessType = "cafe"
                };
                context.Users.Add(cafeOwner);
            }

            var cafeProducts = new List<Product>
            {
                new() { Id = "SPC001", TenantId = cafeTenant.Id, Name = "Cà phê sữa đá", Category = "Cà phê", Price = 35000, Unit = "Ly", Barcode = "", Popular = true },
                new() { Id = "SPC002", TenantId = cafeTenant.Id, Name = "Cà phê đen đá", Category = "Cà phê", Price = 30000, Unit = "Ly", Barcode = "", Popular = true },
                new() { Id = "SPC003", TenantId = cafeTenant.Id, Name = "Bạc xỉu", Category = "Cà phê", Price = 38000, Unit = "Ly", Barcode = "", Popular = true },
                new() { Id = "SPC004", TenantId = cafeTenant.Id, Name = "Trà đào cam sả", Category = "Trà trái cây", Price = 45000, Unit = "Ly", Barcode = "", Popular = true },
                new() { Id = "SPC005", TenantId = cafeTenant.Id, Name = "Trà sen vàng macchiato", Category = "Trà sữa", Price = 48000, Unit = "Ly", Barcode = "", Popular = true },
                new() { Id = "SPC006", TenantId = cafeTenant.Id, Name = "Matcha latte đá xay", Category = "Đá xay", Price = 55000, Unit = "Ly", Barcode = "", Popular = false },
                new() { Id = "SPC007", TenantId = cafeTenant.Id, Name = "Bánh sừng bò croissant", Category = "Bánh ngọt", Price = 35000, Unit = "Cái", Barcode = "", Popular = true },
                new() { Id = "SPC008", TenantId = cafeTenant.Id, Name = "Bánh tiramisu", Category = "Bánh ngọt", Price = 45000, Unit = "Phần", Barcode = "", Popular = true }
            };
            context.Products.AddRange(cafeProducts);

            var cafeCustomers = new List<Customer>
            {
                new() { Id = "KHC001", TenantId = cafeTenant.Id, Name = "Phạm Thị Dung", Phone = "0934567890", Points = 4800, Tier = "diamond", TotalSpent = 48000000, TotalOrders = 64 },
                new() { Id = "KHC002", TenantId = cafeTenant.Id, Name = "Hoàng Văn Em", Phone = "0945678901", Points = 590, Tier = "silver", TotalSpent = 5900000, TotalOrders = 11 }
            };
            context.Customers.AddRange(cafeCustomers);

            var cafeVouchers = new List<Voucher>
            {
                new() { Id = "VC001", TenantId = cafeTenant.Id, Code = "COFFEE10", DiscountType = "percent", DiscountValue = 10, MinOrder = 80000, Expiry = "2026-12-31", Status = "active", UsageCount = 45, MaxUsage = 200 },
                new() { Id = "VC002", TenantId = cafeTenant.Id, Code = "FREECAKE", DiscountType = "fixed", DiscountValue = 35000, MinOrder = 150000, Expiry = "2026-12-31", Status = "active", UsageCount = 12, MaxUsage = 100 }
            };
            context.Vouchers.AddRange(cafeVouchers);

            await context.SaveChangesAsync();
        }
    }
}
