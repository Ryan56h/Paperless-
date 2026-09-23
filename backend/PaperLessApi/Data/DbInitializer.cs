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
                new() { Id = "GP001", TenantId = groceryTenant.Id, Name = "Nước ngọt Coca-Cola 320ml", Category = "Đồ uống", Price = 10000, Unit = "Lon", Barcode = "89345601201", Popular = true, Stock = 120 },
                new() { Id = "GP002", TenantId = groceryTenant.Id, Name = "Nước tăng lực Red Bull 250ml", Category = "Đồ uống", Price = 15000, Unit = "Lon", Barcode = "89345601202", Popular = true, Stock = 80 },
                new() { Id = "GP003", TenantId = groceryTenant.Id, Name = "Nước tinh khiết Aquafina 500ml", Category = "Đồ uống", Price = 6000, Unit = "Chai", Barcode = "89345601203", Popular = false, Stock = 150 },
                new() { Id = "GP004", TenantId = groceryTenant.Id, Name = "Trà Oolong Tea+ Plus 455ml", Category = "Đồ uống", Price = 12000, Unit = "Chai", Barcode = "89345601204", Popular = true, Stock = 90 },
                new() { Id = "GP005", TenantId = groceryTenant.Id, Name = "Mì Hảo Hảo Tôm chua cay", Category = "Mì & Đồ ăn liền", Price = 4500, Unit = "Gói", Barcode = "89345601301", Popular = true, Stock = 200 },
                new() { Id = "GP006", TenantId = groceryTenant.Id, Name = "Mì trộn Omachi xốt tôm phô mai", Category = "Mì & Đồ ăn liền", Price = 12000, Unit = "Hộp", Barcode = "89345601302", Popular = true, Stock = 65 },
                new() { Id = "GP007", TenantId = groceryTenant.Id, Name = "Phở bò Đệ Nhất Acecook", Category = "Mì & Đồ ăn liền", Price = 8000, Unit = "Gói", Barcode = "89345601303", Popular = false, Stock = 70 },
                new() { Id = "GP008", TenantId = groceryTenant.Id, Name = "Snack khoai tây Lay's Tự nhiên 54g", Category = "Bánh kẹo & Snack", Price = 14000, Unit = "Gói", Barcode = "89345601401", Popular = true, Stock = 85 },
                new() { Id = "GP009", TenantId = groceryTenant.Id, Name = "Bánh que Pocky Sô-cô-la 40g", Category = "Bánh kẹo & Snack", Price = 13000, Unit = "Hộp", Barcode = "89345601402", Popular = false, Stock = 40 },
                new() { Id = "GP010", TenantId = groceryTenant.Id, Name = "Bánh Chocopie Orion (Hộp 6 cái)", Category = "Bánh kẹo & Snack", Price = 32000, Unit = "Hộp", Barcode = "89345601403", Popular = true, Stock = 50 },
                new() { Id = "GP011", TenantId = groceryTenant.Id, Name = "Hạt điều rang muối 200g", Category = "Bánh kẹo & Snack", Price = 48000, Unit = "Hũ", Barcode = "89345601404", Popular = false, Stock = 30 },
                new() { Id = "GP012", TenantId = groceryTenant.Id, Name = "Dầu ăn Tường An Cooking Oil 1L", Category = "Gia vị & Đồ khô", Price = 46000, Unit = "Chai", Barcode = "89345601501", Popular = false, Stock = 60 },
                new() { Id = "GP013", TenantId = groceryTenant.Id, Name = "Nước mắm Nam Ngư Đệ Nhị 900ml", Category = "Gia vị & Đồ khô", Price = 34000, Unit = "Chai", Barcode = "89345601502", Popular = false, Stock = 45 },
                new() { Id = "GP014", TenantId = groceryTenant.Id, Name = "Đường cát trắng Biên Hòa 1kg", Category = "Gia vị & Đồ khô", Price = 26000, Unit = "Túi", Barcode = "89345601503", Popular = false, Stock = 80 },
                new() { Id = "GP015", TenantId = groceryTenant.Id, Name = "Giấy vệ sinh cuộn Pulppy 10 cuộn", Category = "Hàng tiêu dùng", Price = 68000, Unit = "Lốc", Barcode = "89345601601", Popular = false, Stock = 35 },
                new() { Id = "GP016", TenantId = groceryTenant.Id, Name = "Nước giặt OMO Matic Cửa Trên 2kg", Category = "Hàng tiêu dùng", Price = 135000, Unit = "Túi", Barcode = "89345601602", Popular = true, Stock = 40 },
                new() { Id = "GP017", TenantId = groceryTenant.Id, Name = "Nước rửa chén Sunlight Chanh 750g", Category = "Hàng tiêu dùng", Price = 27000, Unit = "Chai", Barcode = "89345601603", Popular = true, Stock = 90 },
                new() { Id = "GP018", TenantId = groceryTenant.Id, Name = "Kem đánh răng P/S Bảo Vệ 123 200g", Category = "Hàng tiêu dùng", Price = 36000, Unit = "Hộp", Barcode = "89345601604", Popular = false, Stock = 55 },
                new() { Id = "GP019", TenantId = groceryTenant.Id, Name = "Bàn chải Colgate Charcoal Slim Soft", Category = "Hàng tiêu dùng", Price = 32000, Unit = "Cây", Barcode = "89345601605", Popular = false, Stock = 60 },
                new() { Id = "GP020", TenantId = groceryTenant.Id, Name = "Sữa đặc có đường Ông Thọ đỏ 380g", Category = "Sữa & Bơ", Price = 25000, Unit = "Lon", Barcode = "89345601701", Popular = true, Stock = 110 },
                new() { Id = "GP021", TenantId = groceryTenant.Id, Name = "Sữa tươi TH true MILK ít đường 1L", Category = "Sữa & Bơ", Price = 38000, Unit = "Hộp", Barcode = "89345601702", Popular = true, Stock = 70 },
                new() { Id = "GP022", TenantId = groceryTenant.Id, Name = "Bơ lạt Anchor 227g", Category = "Sữa & Bơ", Price = 75000, Unit = "Khối", Barcode = "89345601703", Popular = false, Stock = 25 }

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

        // Ensure grocery products are fully synced if previous seed had fewer products
        var groceryProdCount = await context.Products.CountAsync(p => p.TenantId == "BIZ-GROCERY-01");
        if (groceryProdCount < 20)
        {
            var oldGroceryProds = await context.Products.Where(p => p.TenantId == "BIZ-GROCERY-01").ToListAsync();
            context.Products.RemoveRange(oldGroceryProds);

            var fullGroceryProducts = new List<Product>
            {
                new() { Id = "GP001", TenantId = "BIZ-GROCERY-01", Name = "Nước ngọt Coca-Cola 320ml", Category = "Đồ uống", Price = 10000, Unit = "Lon", Barcode = "89345601201", Popular = true, Stock = 120 },
                new() { Id = "GP002", TenantId = "BIZ-GROCERY-01", Name = "Nước tăng lực Red Bull 250ml", Category = "Đồ uống", Price = 15000, Unit = "Lon", Barcode = "89345601202", Popular = true, Stock = 80 },
                new() { Id = "GP003", TenantId = "BIZ-GROCERY-01", Name = "Nước tinh khiết Aquafina 500ml", Category = "Đồ uống", Price = 6000, Unit = "Chai", Barcode = "89345601203", Popular = false, Stock = 150 },
                new() { Id = "GP004", TenantId = "BIZ-GROCERY-01", Name = "Trà Oolong Tea+ Plus 455ml", Category = "Đồ uống", Price = 12000, Unit = "Chai", Barcode = "89345601204", Popular = true, Stock = 90 },
                new() { Id = "GP005", TenantId = "BIZ-GROCERY-01", Name = "Mì Hảo Hảo Tôm chua cay", Category = "Mì & Đồ ăn liền", Price = 4500, Unit = "Gói", Barcode = "89345601301", Popular = true, Stock = 200 },
                new() { Id = "GP006", TenantId = "BIZ-GROCERY-01", Name = "Mì trộn Omachi xốt tôm phô mai", Category = "Mì & Đồ ăn liền", Price = 12000, Unit = "Hộp", Barcode = "89345601302", Popular = true, Stock = 65 },
                new() { Id = "GP007", TenantId = "BIZ-GROCERY-01", Name = "Phở bò Đệ Nhất Acecook", Category = "Mì & Đồ ăn liền", Price = 8000, Unit = "Gói", Barcode = "89345601303", Popular = false, Stock = 70 },
                new() { Id = "GP008", TenantId = "BIZ-GROCERY-01", Name = "Snack khoai tây Lay's Tự nhiên 54g", Category = "Bánh kẹo & Snack", Price = 14000, Unit = "Gói", Barcode = "89345601401", Popular = true, Stock = 85 },
                new() { Id = "GP009", TenantId = "BIZ-GROCERY-01", Name = "Bánh que Pocky Sô-cô-la 40g", Category = "Bánh kẹo & Snack", Price = 13000, Unit = "Hộp", Barcode = "89345601402", Popular = false, Stock = 40 },
                new() { Id = "GP010", TenantId = "BIZ-GROCERY-01", Name = "Bánh Chocopie Orion (Hộp 6 cái)", Category = "Bánh kẹo & Snack", Price = 32000, Unit = "Hộp", Barcode = "89345601403", Popular = true, Stock = 50 },
                new() { Id = "GP011", TenantId = "BIZ-GROCERY-01", Name = "Hạt điều rang muối 200g", Category = "Bánh kẹo & Snack", Price = 48000, Unit = "Hũ", Barcode = "89345601404", Popular = false, Stock = 30 },
                new() { Id = "GP012", TenantId = "BIZ-GROCERY-01", Name = "Dầu ăn Tường An Cooking Oil 1L", Category = "Gia vị & Đồ khô", Price = 46000, Unit = "Chai", Barcode = "89345601501", Popular = false, Stock = 60 },
                new() { Id = "GP013", TenantId = "BIZ-GROCERY-01", Name = "Nước mắm Nam Ngư Đệ Nhị 900ml", Category = "Gia vị & Đồ khô", Price = 34000, Unit = "Chai", Barcode = "89345601502", Popular = false, Stock = 45 },
                new() { Id = "GP014", TenantId = "BIZ-GROCERY-01", Name = "Đường cát trắng Biên Hòa 1kg", Category = "Gia vị & Đồ khô", Price = 26000, Unit = "Túi", Barcode = "89345601503", Popular = false, Stock = 80 },
                new() { Id = "GP015", TenantId = "BIZ-GROCERY-01", Name = "Giấy vệ sinh cuộn Pulppy 10 cuộn", Category = "Hàng tiêu dùng", Price = 68000, Unit = "Lốc", Barcode = "89345601601", Popular = false, Stock = 35 },
                new() { Id = "GP016", TenantId = "BIZ-GROCERY-01", Name = "Nước giặt OMO Matic Cửa Trên 2kg", Category = "Hàng tiêu dùng", Price = 135000, Unit = "Túi", Barcode = "89345601602", Popular = true, Stock = 40 },
                new() { Id = "GP017", TenantId = "BIZ-GROCERY-01", Name = "Nước rửa chén Sunlight Chanh 750g", Category = "Hàng tiêu dùng", Price = 27000, Unit = "Chai", Barcode = "89345601603", Popular = true, Stock = 90 },
                new() { Id = "GP018", TenantId = "BIZ-GROCERY-01", Name = "Kem đánh răng P/S Bảo Vệ 123 200g", Category = "Hàng tiêu dùng", Price = 36000, Unit = "Hộp", Barcode = "89345601604", Popular = false, Stock = 55 },
                new() { Id = "GP019", TenantId = "BIZ-GROCERY-01", Name = "Bàn chải Colgate Charcoal Slim Soft", Category = "Hàng tiêu dùng", Price = 32000, Unit = "Cây", Barcode = "89345601605", Popular = false, Stock = 60 },
                new() { Id = "GP020", TenantId = "BIZ-GROCERY-01", Name = "Sữa đặc có đường Ông Thọ đỏ 380g", Category = "Sữa & Bơ", Price = 25000, Unit = "Lon", Barcode = "89345601701", Popular = true, Stock = 110 },
                new() { Id = "GP021", TenantId = "BIZ-GROCERY-01", Name = "Sữa tươi TH true MILK ít đường 1L", Category = "Sữa & Bơ", Price = 38000, Unit = "Hộp", Barcode = "89345601702", Popular = true, Stock = 70 },
                new() { Id = "GP022", TenantId = "BIZ-GROCERY-01", Name = "Bơ lạt Anchor 227g", Category = "Sữa & Bơ", Price = 75000, Unit = "Khối", Barcode = "89345601703", Popular = false, Stock = 25 }
            };
            context.Products.AddRange(fullGroceryProducts);
            await context.SaveChangesAsync();
        }

        // Seed sample invoices for BIZ-GROCERY-01 if none exist
        if (!await context.Invoices.AnyAsync(i => i.TenantId == "BIZ-GROCERY-01"))
        {
            var now = DateTime.UtcNow;
            var todayStr = now.ToString("yyyyMMdd");
            var sampleInvoice1 = new Invoice
            {
                Id = $"PL-{todayStr}-001",
                TenantId = "BIZ-GROCERY-01",
                BranchId = "branch-grocery-01",
                BranchName = "Cửa Hàng Minh Phát - Q10",
                CustomerId = "KHG001",
                CustomerName = "Nguyễn Văn An",
                CustomerPhone = "0901234567",
                StaffName = "Nguyễn Văn Minh",
                Subtotal = 125000,
                Tax = 10000,
                Total = 135000,
                TicketNumber = 101,
                CashGiven = 150000,
                ChangeDue = 15000,
                PayMethod = "cash",
                PayStatus = "paid",
                OrderStatus = "completed",
                SendChannel = "zalo",
                SendStatus = "sent",
                CreatedAt = now.AddHours(-3),
                Items = new List<InvoiceItem>
                {
                    new() { ProductId = "GP001", Name = "Nước ngọt Coca-Cola 320ml", Quantity = 3, UnitPrice = 10000 },
                    new() { ProductId = "GP010", Name = "Bánh Chocopie Orion (Hộp 6 cái)", Quantity = 2, UnitPrice = 32000 },
                    new() { ProductId = "GP005", Name = "Mì Hảo Hảo Tôm chua cay", Quantity = 7, UnitPrice = 4500 }
                }
            };

            var sampleInvoice2 = new Invoice
            {
                Id = $"PL-{todayStr}-002",
                TenantId = "BIZ-GROCERY-01",
                BranchId = "branch-grocery-01",
                BranchName = "Cửa Hàng Minh Phát - Q10",
                CustomerId = "KHG002",
                CustomerName = "Trần Thị Bích",
                CustomerPhone = "0912345678",
                StaffName = "Nguyễn Văn Minh",
                Subtotal = 195000,
                Tax = 0,
                Total = 195000,
                TicketNumber = 102,
                CashGiven = 195000,
                ChangeDue = 0,
                PayMethod = "qr",
                PayStatus = "paid",
                OrderStatus = "ready",
                SendChannel = "sms",
                SendStatus = "sent",
                CreatedAt = now.AddHours(-1),
                Items = new List<InvoiceItem>
                {
                    new() { ProductId = "GP016", Name = "Nước giặt OMO Matic Cửa Trên 2kg", Quantity = 1, UnitPrice = 135000 },
                    new() { ProductId = "GP002", Name = "Nước tăng lực Red Bull 250ml", Quantity = 4, UnitPrice = 15000 }
                }
            };

            var sampleInvoice3 = new Invoice
            {
                Id = $"PL-{todayStr}-003",
                TenantId = "BIZ-GROCERY-01",
                BranchId = "branch-grocery-01",
                BranchName = "Cửa Hàng Minh Phát - Q10",
                CustomerId = "KHG003",
                CustomerName = "Lê Minh Cường",
                CustomerPhone = "0923456789",
                StaffName = "Nguyễn Văn Minh",
                Subtotal = 86000,
                Tax = 0,
                Total = 86000,
                TicketNumber = 103,
                CashGiven = 100000,
                ChangeDue = 14000,
                PayMethod = "cash",
                PayStatus = "paid",
                OrderStatus = "preparing",
                SendChannel = "both",
                SendStatus = "sent",
                CreatedAt = now.AddMinutes(-20),
                Items = new List<InvoiceItem>
                {
                    new() { ProductId = "GP004", Name = "Trà Oolong Tea+ Plus 455ml", Quantity = 3, UnitPrice = 12000 },
                    new() { ProductId = "GP008", Name = "Snack khoai tây Lay's Tự nhiên 54g", Quantity = 2, UnitPrice = 14000 },
                    new() { ProductId = "GP006", Name = "Mì trộn Omachi xốt tôm phô mai", Quantity = 1, UnitPrice = 12000 }
                }
            };

            context.Invoices.AddRange(sampleInvoice1, sampleInvoice2, sampleInvoice3);
            await context.SaveChangesAsync();
        }
    }
}
